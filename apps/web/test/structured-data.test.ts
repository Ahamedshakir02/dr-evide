import { describe, expect, it } from "vitest";
import { SAMPLE_DOCTORS, SPECIALTY_SLUGS, type Doctor } from "@dr-evide/core";
import {
  SCHEMA_SPECIALTY,
  buildPhysicianJsonLd,
  doctorDescription,
  doctorTitle,
} from "@/lib/structured-data";

/**
 * What the site is willing to assert about a named person, in a form that
 * outlives the page it came from.
 *
 * A `Physician` node gets scraped, cached and republished by things that will
 * never show the reader the "Sample data" banner sitting above it. The tests
 * that matter here are the ones about what is *absent*.
 */

const SITE = "https://drevide.example";

/** A real doctor: a sample row with the flag cleared and the marker removed. */
function realDoctor(overrides: Partial<Doctor> = {}): Doctor {
  return {
    ...SAMPLE_DOCTORS[0]!,
    full_name: "Dr. Anitha Menon",
    nmc_reg_no: "KL-12345",
    is_sample: false,
    ...overrides,
  };
}

describe("a fictional doctor is never published as a real one", () => {
  it.each(SAMPLE_DOCTORS.map((d) => [d.id, d.full_name] as const))(
    "emits no markup for sample doctor %i (%s)",
    (id) => {
      const doctor = SAMPLE_DOCTORS.find((d) => d.id === id)!;
      expect(buildPhysicianJsonLd(doctor, { siteUrl: SITE })).toBeNull();
    }
  );

  it("is decided by the row, not by the name carrying (SAMPLE)", () => {
    // The marker in the name is for humans reading the page. Someone will edit
    // it out one day; the flag is what this must depend on.
    const disguised = { ...SAMPLE_DOCTORS[0]!, full_name: "Dr. Anitha Menon" };
    expect(buildPhysicianJsonLd(disguised, { siteUrl: SITE })).toBeNull();
  });

  it("emits markup once the flag is cleared", () => {
    expect(buildPhysicianJsonLd(realDoctor(), { siteUrl: SITE })).not.toBeNull();
  });
});

describe("credential claims need a verified credential behind them", () => {
  it("omits qualifications and registration number when unverified", () => {
    const node = buildPhysicianJsonLd(
      realDoctor({ nmc_verified: false, qualifications: ["MBBS", "MD Dermatology"] }),
      { siteUrl: SITE }
    )!;

    // The doctor still gets a node — name, department and clinic are facts
    // about a place. What is missing is every assertion about the person.
    expect(node.name).toBe("Dr. Anitha Menon");
    expect(node.hasCredential).toBeUndefined();
    expect(node.identifier).toBeUndefined();
    expect(JSON.stringify(node)).not.toMatch(/MBBS|KL-12345/);
  });

  it("includes them once the registration has been checked", () => {
    const node = buildPhysicianJsonLd(realDoctor({ nmc_verified: true }), { siteUrl: SITE })!;

    expect(node.hasCredential).toEqual([
      { "@type": "EducationalOccupationalCredential", credentialCategory: "degree", name: "MBBS" },
      {
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        name: "MD Dermatology",
      },
    ]);
    expect(node.identifier).toMatchObject({ value: "KL-12345" });
  });

  it("does not invent a credential list for a verified doctor who has none", () => {
    const node = buildPhysicianJsonLd(
      realDoctor({ nmc_verified: true, qualifications: [] }),
      { siteUrl: SITE }
    )!;

    expect(node.hasCredential).toBeUndefined();
  });
});

describe("ratings are not published", () => {
  it("emits no aggregateRating even with a full review history", () => {
    const node = buildPhysicianJsonLd(
      realDoctor({ nmc_verified: true, review_count: 84, review_avg: 4.6 }),
      { siteUrl: SITE }
    )!;

    // Star ratings are the highest-value markup on a page like this, which is
    // exactly why the decision not to emit them needs a test rather than a
    // comment someone can quietly delete. See lib/structured-data.ts.
    expect(node.aggregateRating).toBeUndefined();
    expect(node.review).toBeUndefined();
    expect(JSON.stringify(node)).not.toMatch(/[Rr]ating|reviewCount|ratingValue/);
  });

  it("never leaks a TrustScore into the markup", () => {
    const node = buildPhysicianJsonLd(realDoctor({ nmc_verified: true }), { siteUrl: SITE })!;
    expect(JSON.stringify(node)).not.toMatch(/trust|score/i);
  });
});

describe("the node itself", () => {
  const node = buildPhysicianJsonLd(realDoctor({ nmc_verified: true }), { siteUrl: SITE })!;

  it("is a Physician with a stable identity", () => {
    expect(node["@context"]).toBe("https://schema.org");
    expect(node["@type"]).toBe("Physician");
    expect(node["@id"]).toBe(`${SITE}/doctor/1`);
    expect(node.url).toBe(`${SITE}/doctor/1`);
  });

  it("places the doctor somewhere real", () => {
    expect(node.address).toMatchObject({
      "@type": "PostalAddress",
      addressLocality: "Edappal",
      addressRegion: "Kerala",
      addressCountry: "IN",
    });
    expect(node.geo).toMatchObject({ "@type": "GeoCoordinates" });
  });

  it("drops address lines it does not have rather than emitting blanks", () => {
    const sparse = buildPhysicianJsonLd(
      realDoctor({ address: null, town: null, phone: null, clinic_name: null }),
      { siteUrl: SITE }
    )!;

    expect(sparse.address).toEqual({
      "@type": "PostalAddress",
      addressRegion: "Kerala",
      addressCountry: "IN",
    });
    expect(sparse.telephone).toBeUndefined();
    expect(sparse.worksFor).toBeUndefined();
  });

  it("survives a round trip through JSON with no undefined holes", () => {
    const round = JSON.parse(JSON.stringify(node));
    expect(round).toEqual(node);
    expect(JSON.stringify(node)).not.toMatch(/undefined|null/);
  });

  it("escapes nothing itself — the page does that", () => {
    // A clinic name containing a closing script tag must not be this module's
    // problem to solve halfway. It passes the value through; the page escapes
    // `<` on serialisation. Half-sanitising here would make the string look
    // safe to the next person who reads it.
    const hostile = buildPhysicianJsonLd(
      realDoctor({ clinic_name: "</script><img onerror=alert(1)>" }),
      { siteUrl: SITE }
    )!;

    expect(hostile.worksFor).toMatchObject({ name: "</script><img onerror=alert(1)>" });
  });
});

describe("the department mapping does not drift", () => {
  it("maps every department in the taxonomy", () => {
    // Adding a specialty to core without a schema.org term would silently emit
    // `medicalSpecialty: undefined` on every profile in that department.
    for (const slug of SPECIALTY_SLUGS) {
      expect(SCHEMA_SPECIALTY[slug], `no schema.org term for "${slug}"`).toBeTruthy();
    }
  });

  it("has no mapping for a department that no longer exists", () => {
    expect(Object.keys(SCHEMA_SPECIALTY).sort()).toEqual([...SPECIALTY_SLUGS].sort());
  });
});

describe("titles and descriptions", () => {
  it("names the doctor, the department and the town", () => {
    expect(doctorTitle(realDoctor())).toBe("Dr. Anitha Menon — Dermatology in Edappal");
  });

  it("drops the town clause when there is no town", () => {
    expect(doctorTitle(realDoctor({ town: null }))).toBe("Dr. Anitha Menon — Dermatology");
  });

  it("gives each profile a distinct title", () => {
    // The defect this replaces: every profile shared one site-wide title, so
    // two doctors were indistinguishable in a search result.
    const titles = SAMPLE_DOCTORS.map((d) => doctorTitle(d));
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("builds a description out of the fields that are present", () => {
    const text = doctorDescription(realDoctor(), 2026);
    expect(text).toContain("Dr. Anitha Menon practises Dermatology in Edappal, Kerala.");
    expect(text).toContain("MBBS, MD Dermatology");
    expect(text).toContain("16 years' experience");
  });

  it("leaves no empty clauses when the row is sparse", () => {
    const text = doctorDescription(
      realDoctor({ qualifications: [], reg_year: null, clinic_name: null, town: null }),
      2026
    );

    expect(text).toBe(
      "Dr. Anitha Menon practises Dermatology in Kerala. See verified credentials, " +
        "consultation fee and directions on Dr Evide — doctors ranked by credentials, " +
        "never by who paid."
    );
    // The shapes a template with holes in it leaves behind.
    expect(text).not.toMatch(/ {2}|·\s*\.|,\s*\./);
  });

  it("does not claim experience for a doctor registered this year", () => {
    expect(doctorDescription(realDoctor({ reg_year: 2026 }), 2026)).not.toMatch(/experience/);
  });
});
