import type { Doctor, RankedDoctor, ScoreBreakdown } from "./types";

/**
 * TrustScore v1 — an honest proxy for capability. No outcome data exists in
 * India at doctor level, so we rank ONLY on verifiable/objective signals.
 * Weights (sum 100): qualification 30, experience 15, reviews 25,
 * condition relevance 20, accessibility 10.
 *
 * Rules:
 * - Ranking is never for sale. No paid boost exists anywhere in this codebase.
 * - Distance is a filter and tiebreaker, not a quality signal.
 */
export function rankDoctors(
  doctors: (Doctor & { distance_km: number })[],
  matchedConditions: string[],
  radiusKm: number
): RankedDoctor[] {
  const currentYear = new Date().getFullYear();

  const ranked = doctors.map((d) => {
    const breakdown = scoreDoctor(d, matchedConditions, radiusKm, currentYear);
    const trust_score = Math.round(
      breakdown.qualification +
        breakdown.experience +
        breakdown.reviews +
        breakdown.condition_relevance +
        breakdown.accessibility
    );
    return { ...d, trust_score, score_breakdown: breakdown };
  });

  // Sort by score desc; distance as tiebreaker
  ranked.sort((a, b) => b.trust_score - a.trust_score || a.distance_km - b.distance_km);
  return ranked;
}

function scoreDoctor(
  d: Doctor & { distance_km: number },
  matchedConditions: string[],
  radiusKm: number,
  currentYear: number
): ScoreBreakdown {
  // 1. Qualification depth (30). Levels: 1 MBBS/BDS, 2 PG diploma, 3 MD/MS/MDS, 4 DM/MCh.
  // NMC-verified credentials get full value; unverified are discounted 40%.
  const levelScore = [0, 12, 18, 25, 30][Math.min(Math.max(d.qualification_level, 1), 4)];
  const qualification = d.nmc_verified ? levelScore : levelScore * 0.6;

  // 2. Experience (15) — diminishing returns, caps at 20 years.
  const years = d.reg_year ? Math.max(0, currentYear - d.reg_year) : 0;
  const experience = 15 * Math.min(years, 20) / 20 * (years > 0 ? 1 : 0);

  // 3. Reviews (25) — avg rating scaled by volume confidence and authenticity.
  // Volume confidence: log curve, ~full confidence at 50+ reviews.
  const volumeConfidence = Math.min(1, Math.log10(d.review_count + 1) / Math.log10(51));
  const reviews = 25 * (d.review_avg / 5) * volumeConfidence * d.review_authenticity;

  // 4. Condition relevance (20) — overlap between routed condition keywords and
  // the doctor's declared conditions/sub-specialties.
  let condition_relevance = 10; // baseline: right specialty already filtered
  if (matchedConditions.length > 0) {
    const declared = [...d.conditions, ...d.sub_specialties].map((c) => c.toLowerCase());
    const hits = matchedConditions.filter((mc) =>
      declared.some((dc) => dc.includes(mc) || mc.includes(dc))
    );
    condition_relevance = 10 + 10 * Math.min(1, hits.length / Math.max(1, matchedConditions.length));
  }

  // 5. Accessibility (10) — profile completeness + gentle nearness bonus within radius.
  const completeness =
    [d.phone, d.timings, d.fee_inr, d.address].filter(Boolean).length / 4;
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

const round1 = (n: number) => Math.round(n * 10) / 10;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
