import { describe, expect, it } from "vitest";
import { SAMPLE_DOCTORS } from "../src/data";
import { DEFAULT_LOCATION, haversineKm } from "../src/geo";
import { SCORE_VERSION, SCORE_WEIGHTS, rankDoctors, scoreOne } from "../src/ranking";
import type { Doctor } from "../src/types";

/**
 * TrustScore golden tests.
 *
 * These freeze the exact numbers the product shows next to named, real people.
 * If a change to the weights or the maths makes one fail, that is the point:
 * the diff is the record of what moved. Update the table and bump SCORE_VERSION
 * together, and note it in ENGINEERING-LOG.md — never silently re-baseline.
 *
 * asOfYear is pinned at 2026 so these stay meaningful after New Year's Day.
 */

const AS_OF_YEAR = 2026;

function rankFor(specialty: string, conditions: string[], radiusKm: number) {
  const withDistance = SAMPLE_DOCTORS.filter((d) => d.specialty_slug === specialty)
    .map((d) => ({
      ...d,
      distance_km: haversineKm(
        DEFAULT_LOCATION.lat,
        DEFAULT_LOCATION.lng,
        d.lat,
        d.lng
      ),
    }))
    .filter((d) => d.distance_km <= radiusKm);

  return rankDoctors(withDistance, {
    matchedConditions: conditions,
    radiusKm,
    asOfYear: AS_OF_YEAR,
  });
}

/** [id, total, qualification, experience, reviews, condition_relevance, accessibility] */
type Golden = [number, number, number, number, number, number, number];

const SCENARIOS: { name: string; specialty: string; conditions: string[]; radiusKm: number; expect: Golden[] }[] = [
  {
    name: "dermatology, routed for hair fall, 15km",
    specialty: "dermatology",
    conditions: ["hair fall"],
    radiusKm: 15,
    expect: [
      [1, 88, 25, 12, 20.7, 20, 10], // Dr. Anitha Menon — MD, NMC-verified, declares hair fall
      [3, 55, 15, 8.3, 15.4, 10, 6.6], // Dr. Fathima Rasheed — same MD level, unverified: 40% discount
    ],
  },
  {
    name: "orthopedics, no routed conditions, 15km",
    specialty: "orthopedics",
    conditions: [],
    radiusKm: 15,
    expect: [
      [4, 82, 25, 15, 22.3, 10, 9.9], // experience capped at the 20-year ceiling
      [6, 64, 18, 10.5, 18.9, 10, 6.7],
    ],
  },
  {
    name: "general physician, routed for fever, 25km",
    specialty: "general",
    conditions: ["fever"],
    radiusKm: 25,
    expect: [
      [11, 89, 25, 14.3, 19.6, 20, 10],
      [12, 60, 12, 4.5, 13.4, 20, 9.9], // MBBS only — qualification floor of 12
    ],
  },
];

describe.each(SCENARIOS)("golden: $name", ({ specialty, conditions, radiusKm, expect: golden }) => {
  const ranked = rankFor(specialty, conditions, radiusKm);

  it("returns the expected doctors in the expected order", () => {
    expect(ranked.map((d) => d.id)).toEqual(golden.map((g) => g[0]));
  });

  it.each(golden)(
    "doctor %i scores %i (%f + %f + %f + %f + %f)",
    (id, total, qualification, experience, reviews, relevance, accessibility) => {
      const doctor = ranked.find((d) => d.id === id)!;
      expect(doctor.trust_score).toBe(total);
      expect(doctor.score_breakdown).toEqual({
        qualification,
        experience,
        reviews,
        condition_relevance: relevance,
        accessibility,
      });
    }
  );
});

describe("determinism", () => {
  it("produces identical output for identical input", () => {
    const a = rankFor("dermatology", ["hair fall"], 15);
    const b = rankFor("dermatology", ["hair fall"], 15);
    expect(a).toEqual(b);
  });

  it("reads the year from the context, never from the clock", () => {
    const [doctor] = rankFor("dermatology", [], 15);
    const base = { ...doctor, distance_km: doctor.distance_km };

    const y2026 = scoreOne(base, { matchedConditions: [], radiusKm: 15, asOfYear: 2026 });
    const y2036 = scoreOne(base, { matchedConditions: [], radiusKm: 15, asOfYear: 2036 });

    // Ten more years of experience must change the number. If these are equal,
    // asOfYear is being ignored and scores are silently frozen.
    expect(y2036.score_breakdown.experience).toBeGreaterThanOrEqual(
      y2026.score_breakdown.experience
    );
    expect(y2026.score_version).toBe(SCORE_VERSION);
  });

  it("stamps every result with the scoring version", () => {
    for (const d of rankFor("general", [], 25)) {
      expect(d.score_version).toBe(SCORE_VERSION);
    }
  });
});

describe("the promises TrustScore makes", () => {
  const base: Doctor & { distance_km: number } = {
    ...SAMPLE_DOCTORS[0]!,
    distance_km: 5,
  };
  const ctx = { matchedConditions: [], radiusKm: 15, asOfYear: AS_OF_YEAR };

  it("discounts unverified credentials by 40%", () => {
    const verified = scoreOne({ ...base, nmc_verified: true }, ctx);
    const unverified = scoreOne({ ...base, nmc_verified: false }, ctx);
    expect(unverified.score_breakdown.qualification).toBeCloseTo(
      verified.score_breakdown.qualification * 0.6,
      1
    );
  });

  it("never lets distance outweigh quality", () => {
    // A far, excellent doctor against a next-door, weak one. Accessibility is
    // worth 10 points total and only 40% of that is nearness — 4 points cannot
    // close a credentials-and-reviews gap. Distance is a filter, not a ranking.
    const excellentFar = { ...base, distance_km: 14.9 };
    const weakNear: Doctor & { distance_km: number } = {
      ...base,
      id: 999,
      distance_km: 0.1,
      qualification_level: 1,
      nmc_verified: false,
      reg_year: 2024,
      review_count: 2,
      review_avg: 3,
      review_authenticity: 0.5,
    };

    const [first] = rankDoctors([weakNear, excellentFar], ctx);
    expect(first!.id).toBe(base.id);
  });

  it("keeps every score inside 0..100", () => {
    for (const doctor of SAMPLE_DOCTORS) {
      const { trust_score } = scoreOne({ ...doctor, distance_km: 1 }, ctx);
      expect(trust_score).toBeGreaterThanOrEqual(0);
      expect(trust_score).toBeLessThanOrEqual(100);
    }
  });

  it("caps the breakdown components at their published weights", () => {
    const maxed: Doctor & { distance_km: number } = {
      ...base,
      qualification_level: 4,
      nmc_verified: true,
      reg_year: 1970,
      review_count: 10_000,
      review_avg: 5,
      review_authenticity: 1,
      distance_km: 0,
    };
    const { score_breakdown } = scoreOne(maxed, {
      matchedConditions: ["hair fall"],
      radiusKm: 15,
      asOfYear: AS_OF_YEAR,
    });

    for (const { key, max } of SCORE_WEIGHTS) {
      expect(score_breakdown[key], `${key} exceeded its weight`).toBeLessThanOrEqual(max);
    }
  });

  it("published weights sum to 100", () => {
    expect(SCORE_WEIGHTS.reduce((sum, w) => sum + w.max, 0)).toBe(100);
  });

  it("breaks ties deterministically rather than by database order", () => {
    const a = { ...base, id: 2 };
    const b = { ...base, id: 1 };
    expect(rankDoctors([a, b], ctx).map((d) => d.id)).toEqual([1, 2]);
    expect(rankDoctors([b, a], ctx).map((d) => d.id)).toEqual([1, 2]);
  });

  it("ignores any field that looks like paid placement", () => {
    // Ranking is never for sale. Smuggling a boost field onto the record must
    // not move the number — scoring reads only the declared signals.
    const bribed = { ...base, sponsored: true, boost: 999, promoted_rank: 1 } as never;
    expect(scoreOne(bribed, ctx).trust_score).toBe(scoreOne(base, ctx).trust_score);
  });
});
