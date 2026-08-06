import type { Doctor, RankedDoctor, ScoreBreakdown } from "./types";
import { normalize, matchesTerm } from "./text";

/**
 * TrustScore — an honest proxy for capability. No outcome data exists in India
 * at doctor level, so we rank ONLY on verifiable, objective signals.
 * Weights (sum 100): qualification 30, reviews 25, condition relevance 20,
 * experience 15, accessibility 10.
 *
 * Two rules this module exists to enforce:
 *
 *   1. Ranking is never for sale. No paid boost exists anywhere in this
 *      codebase, and CI fails if a field that looks like one is introduced.
 *      See scripts/check-no-paid-ranking.mjs.
 *
 *   2. Distance is a filter and a tiebreaker, not a quality signal. Being
 *      closer does not make a doctor better.
 *
 * Scoring is a pure function of (doctor, context). Nothing here reads the
 * clock, the network, or the environment — see RankingContext.asOfYear. That is
 * what makes the golden tests in ranking.test.ts meaningful: if a weight moves,
 * the diff is visible and deliberate.
 */

/**
 * Bump on ANY change to the weights or the scoring maths, and record the change
 * in ENGINEERING-LOG.md.
 *
 * Every RankedDoctor carries the version that produced it. Without this, tuning
 * a weight silently rewrites every score the product has ever shown, and
 * "why did my score drop?" becomes unanswerable.
 */
export const SCORE_VERSION = "1.0.0";

/** Everything scoring needs from outside the doctor record. */
export interface RankingContext {
  /** Condition keywords from routing, already lowercased. */
  matchedConditions: string[];
  /** The search radius, for the nearness component of accessibility. */
  radiusKm: number;
  /**
   * The year to measure experience against. Injected rather than read from the
   * clock so scores are reproducible: the same inputs must always give the same
   * number, in tests and a year from now.
   */
  asOfYear: number;
}

/** The weights behind TrustScore, for the UI that explains them. */
export const SCORE_WEIGHTS = [
  { key: "qualification", label: "Verified credentials", max: 30 },
  { key: "reviews", label: "Authentic reviews", max: 25 },
  { key: "condition_relevance", label: "Condition relevance", max: 20 },
  { key: "experience", label: "Years of experience", max: 15 },
  { key: "accessibility", label: "Accessibility", max: 10 },
] as const satisfies readonly { key: keyof ScoreBreakdown; label: string; max: number }[];

export type ScoredDoctor = Pick<RankedDoctor, "trust_score" | "score_breakdown" | "score_version">;

/**
 * Rank a set of doctors. Sorted by score descending, with distance as the
 * tiebreaker and id as the final tiebreaker — without that last one the order
 * of two identically-scored, equidistant doctors depends on how the database
 * happened to return them, which makes results flicker between requests.
 */
export function rankDoctors(
  doctors: (Doctor & { distance_km: number })[],
  ctx: RankingContext
): RankedDoctor[] {
  return doctors
    .map((d) => ({ ...d, ...scoreOne(d, ctx) }))
    .sort(
      (a, b) =>
        b.trust_score - a.trust_score ||
        a.distance_km - b.distance_km ||
        a.id - b.id
    );
}

/**
 * Score a single doctor. The profile page fetches one doctor directly and has
 * no ranked list to read from, but must reproduce exactly the number shown on
 * the results card — so both go through this one function.
 */
export function scoreOne(d: Doctor & { distance_km: number }, ctx: RankingContext): ScoredDoctor {
  const breakdown = scoreDoctor(d, ctx);
  const trust_score = Math.round(
    breakdown.qualification +
      breakdown.experience +
      breakdown.reviews +
      breakdown.condition_relevance +
      breakdown.accessibility
  );
  return { trust_score, score_breakdown: breakdown, score_version: SCORE_VERSION };
}

function scoreDoctor(
  d: Doctor & { distance_km: number },
  { matchedConditions, radiusKm, asOfYear }: RankingContext
): ScoreBreakdown {
  // 1. Qualification depth (30). Levels: 1 MBBS/BDS, 2 PG diploma, 3 MD/MS/MDS, 4 DM/MCh.
  // NMC-verified credentials get full value; unverified are discounted 40%, because
  // an unverified claim is a claim, not a credential.
  const levelScore = [0, 12, 18, 25, 30][clamp(d.qualification_level, 1, 4)];
  const qualification = d.nmc_verified ? levelScore : levelScore * 0.6;

  // 2. Experience (15) — linear to a 20-year cap. Beyond that, more years stop
  // telling us anything useful about the next consultation.
  const years = d.reg_year ? Math.max(0, asOfYear - d.reg_year) : 0;
  const experience = (15 * Math.min(years, 20)) / 20;

  // 3. Reviews (25) — average rating, scaled by how much the volume lets us
  // trust that average, then by an authenticity multiplier from spam/burst
  // analysis. Volume confidence is a log curve reaching ~1.0 at 50 reviews:
  // five 5-star reviews should not outrank fifty 4.5-star ones.
  const volumeConfidence = Math.min(1, Math.log10(d.review_count + 1) / Math.log10(51));
  const reviews = 25 * (d.review_avg / 5) * volumeConfidence * d.review_authenticity;

  // 4. Condition relevance (20) — overlap between the routed condition keywords
  // and what this doctor declares they treat. Baseline 10 because the specialty
  // filter already ran; the other 10 rewards a specific match.
  const condition_relevance = 10 + 10 * conditionOverlap(d, matchedConditions);

  // 5. Accessibility (10) — can a person actually reach this doctor? Profile
  // completeness (is there a phone number and timings at all) plus a gentle
  // nearness bonus within the radius the user chose.
  const completeness = [d.phone, d.timings, d.fee_inr, d.address].filter(Boolean).length / 4;
  const nearness = radiusKm > 0 ? 1 - Math.min(1, d.distance_km / radiusKm) : 0;
  const accessibility = 10 * (0.6 * completeness + 0.4 * nearness);

  return {
    qualification: round1(qualification),
    experience: round1(experience),
    reviews: round1(reviews),
    condition_relevance: round1(condition_relevance),
    accessibility: round1(accessibility),
  };
}

/**
 * Fraction of the routed conditions this doctor declares, 0..1.
 *
 * A condition counts as a hit when any of its words appears as a whole word in
 * what the doctor declares, so a search routed for "hair fall" still matches a
 * dermatologist who listed "hair". Whole words, not substrings: the old
 * bidirectional includes() gave a doctor listing "ear infection" a relevance
 * hit on a search routed for "heart".
 */
/* ═══ Presentation ═══════════════════════════════════════════════════════
   Everything below turns a score into words. None of it feeds sorting, and
   nothing here may ever be read by scoreDoctor — a label must be a view of the
   number, never an input to it.
   ═══════════════════════════════════════════════════════════════════════ */

export type ScoreBand = "strong" | "good" | "fair" | "limited";

export interface ScoreDescription {
  band: ScoreBand;
  /** Short qualitative label, e.g. "Strong". */
  label: string;
  /** The signal contributing the largest share of its own maximum. */
  strongest: { key: keyof ScoreBreakdown; label: string; value: number; max: number };
}

/**
 * The highest score actually reachable, which is not 100.
 *
 * Condition relevance is `10 + 10 × overlap`, so browsing a department without
 * having described a symptom caps that component at 10 no matter how good the
 * doctor is. Banding against a flat 100 would therefore make every doctor look
 * worse when reached from a department tile than from the symptom box — the
 * same person, the same credentials, a worse-sounding label, for a reason that
 * has nothing to do with them.
 */
const reachableMax = (hasMatchedConditions: boolean): number =>
  hasMatchedConditions ? 100 : 90;

/**
 * Describe a score in words.
 *
 * A bare "82" on a card is unanchored: nobody knows whether that is unusually
 * good or barely adequate, and the ring reads as a proportion of a 100 that is
 * not attainable. Thresholds are cutoffs on the share of the reachable maximum,
 * chosen so that "strong" means every verifiable signal is close to full.
 *
 * These are a presentation choice, not a measurement. Treat them like the
 * weights: if they move, bump SCORE_VERSION and record it in ENGINEERING-LOG.md,
 * because a doctor who was "Strong" yesterday and "Good" today will ask why.
 */
export function describeScore(
  breakdown: ScoreBreakdown,
  { hasMatchedConditions }: { hasMatchedConditions: boolean }
): ScoreDescription {
  const total = SCORE_WEIGHTS.reduce((sum, w) => sum + breakdown[w.key], 0);
  const share = total / reachableMax(hasMatchedConditions);

  const band: ScoreBand =
    share >= 0.78 ? "strong" : share >= 0.62 ? "good" : share >= 0.45 ? "fair" : "limited";

  const strongest = SCORE_WEIGHTS.map((w) => ({
    key: w.key,
    label: w.label,
    value: breakdown[w.key],
    max: w.max,
  })).reduce((best, cur) => (cur.value / cur.max > best.value / best.max ? cur : best));

  return { band, label: BAND_LABELS[band], strongest };
}

const BAND_LABELS: Record<ScoreBand, string> = {
  strong: "Strong",
  good: "Good",
  fair: "Fair",
  limited: "Limited record",
};

function conditionOverlap(d: Doctor, matchedConditions: string[]): number {
  if (matchedConditions.length === 0) return 0;

  const declared = normalize([...d.conditions, ...d.sub_specialties].join(" "));
  const hits = matchedConditions.filter((condition) =>
    words(condition).some((word) => matchesTerm(declared, word))
  );
  return Math.min(1, hits.length / matchedConditions.length);
}

/** Words of at least two characters, normalised. */
function words(phrase: string): string[] {
  return normalize(phrase)
    .trim()
    .split(" ")
    .filter((w) => w.length >= 2);
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const round1 = (n: number) => Math.round(n * 10) / 10;
