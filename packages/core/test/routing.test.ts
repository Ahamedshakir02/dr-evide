import { describe, expect, it } from "vitest";
import { routeByKeywords } from "../src/routing";
import { EMERGENCY_TERMS } from "../src/emergency";
import { KEYWORD_MAP, SPECIALTY_SLUGS } from "../src/taxonomy";
import { normalize } from "../src/text";

describe("misroutes fixed by whole-word matching", () => {
  // Every one of these was a live defect in v1, where KEYWORD_MAP was matched
  // with String.includes() against the raw text.
  it("'heart' does not match the ENT keyword 'ear'", () => {
    const result = routeByKeywords("my heart beats very fast sometimes");
    const slugs = result.specialties.map((s) => s.slug);
    expect(slugs).toContain("cardiology");
    expect(slugs).not.toContain("ent");
  });

  it("'kidney' does not match the Pediatrics keyword 'kid'", () => {
    const result = routeByKeywords("pain near my kidney area");
    expect(result.specialties.map((s) => s.slug)).not.toContain("pediatrics");
  });

  it("'hearing' still routes to ENT on its own", () => {
    expect(routeByKeywords("hearing loss in left ear").specialties[0]?.slug).toBe("ent");
  });
});

describe("routing the launch-area complaints", () => {
  const cases: [string, string][] = [
    ["my hair is falling a lot lately", "dermatology"],
    ["toothache and bleeding gums", "dental"],
    ["knee pain when I climb stairs", "orthopedics"],
    ["my child has not been gaining weight", "pediatrics"],
    ["sore throat and blocked nose", "ent"],
    ["fever and body pain for three days", "general"],
    ["മുടി കൊഴിച്ചിൽ ഉണ്ട്", "dermatology"],
    ["mudi kozhichil undu", "dermatology"],
    ["palluvedana", "dental"],
    ["muttu vedana", "orthopedics"],
  ];

  it.each(cases)("%s -> %s", (text, expected) => {
    expect(routeByKeywords(text).specialties[0]?.slug).toBe(expected);
  });
});

describe("unroutable text", () => {
  it("falls back to a General Physician rather than an empty screen", () => {
    const result = routeByKeywords("qqqq zzzz not a real complaint");
    expect(result.specialties).toHaveLength(1);
    expect(result.specialties[0]?.slug).toBe("general");
    expect(result.specialties[0]?.reason).toMatch(/General Physician/);
  });

  it("never returns more than two departments", () => {
    const result = routeByKeywords("fever cough knee pain tooth ear rash child heart");
    expect(result.specialties.length).toBeLessThanOrEqual(2);
  });

  it("gives every returned department a non-empty reason", () => {
    for (const [text] of [["hair fall"], ["knee pain"], ["asdfgh"]] as const) {
      for (const s of routeByKeywords(text).specialties) {
        expect(s.reason.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("taxonomy invariants", () => {
  it("covers every specialty slug", () => {
    expect(Object.keys(KEYWORD_MAP).sort()).toEqual([...SPECIALTY_SLUGS].sort());
  });

  it("keeps routing keywords disjoint from emergency red flags", () => {
    // The emergency check runs first and must keep winning. A term appearing in
    // both lists is dead weight at best and a misleading signal at worst.
    const emergency = new Set(
      [...EMERGENCY_TERMS.medical, ...EMERGENCY_TERMS.mentalHealth].map((t) =>
        normalize(t)
      )
    );

    const collisions: string[] = [];
    for (const keywords of Object.values(KEYWORD_MAP)) {
      for (const kw of keywords) {
        if (emergency.has(normalize(kw))) collisions.push(kw);
      }
    }
    expect(collisions).toEqual([]);
  });

  it("has no duplicate keywords within a specialty", () => {
    for (const [slug, keywords] of Object.entries(KEYWORD_MAP)) {
      const seen = keywords.map((k) => normalize(k));
      expect(new Set(seen).size, `duplicate keyword in ${slug}`).toBe(seen.length);
    }
  });
});
