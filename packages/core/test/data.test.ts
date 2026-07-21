import { describe, expect, it } from "vitest";
import { SAMPLE_DOCTORS } from "../src/data";
import { doctorSchema, doctorSearchSchema, llmRoutingSchema, routeSymptomSchema } from "../src/schemas";
import { MAX_RADIUS_KM, MIN_RADIUS_KM } from "../src/geo";

describe("bundled sample data", () => {
  it("every record satisfies the doctor schema", () => {
    for (const doctor of SAMPLE_DOCTORS) {
      const result = doctorSchema.safeParse(doctor);
      expect(result.success, `doctor ${doctor.id}: ${JSON.stringify(result.error?.issues)}`).toBe(
        true
      );
    }
  });

  it("is entirely marked as sample data", () => {
    // These are fictional people at real addresses. Anything here that reads as
    // a real doctor is a defamation problem, not a data problem.
    for (const doctor of SAMPLE_DOCTORS) {
      expect(doctor.is_sample, `doctor ${doctor.id} is not flagged as sample`).toBe(true);
      expect(doctor.full_name).toMatch(/\(SAMPLE\)/);
    }
  });

  it("has unique ids", () => {
    const ids = SAMPLE_DOCTORS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("sits inside the launch area", () => {
    // Roughly Kerala. A coordinate typo that lands a doctor in another state
    // silently empties every search.
    for (const d of SAMPLE_DOCTORS) {
      expect(d.lat, `doctor ${d.id} latitude`).toBeGreaterThan(8);
      expect(d.lat, `doctor ${d.id} latitude`).toBeLessThan(13);
      expect(d.lng, `doctor ${d.id} longitude`).toBeGreaterThan(74);
      expect(d.lng, `doctor ${d.id} longitude`).toBeLessThan(78);
    }
  });
});

describe("doctorSearchSchema", () => {
  it("fills in the Edappal defaults for a bare request", () => {
    const parsed = doctorSearchSchema.parse({ specialty: "dermatology" });
    expect(parsed.lat).toBeCloseTo(10.9855, 3);
    expect(parsed.radius).toBe(15);
    expect(parsed.conditions).toEqual([]);
  });

  it("clamps rather than rejects an out-of-range radius", () => {
    // A user dragging a slider must never be able to produce an error.
    expect(doctorSearchSchema.parse({ specialty: "general", radius: "9999" }).radius).toBe(
      MAX_RADIUS_KM
    );
    expect(doctorSearchSchema.parse({ specialty: "general", radius: "-5" }).radius).toBe(
      MIN_RADIUS_KM
    );
    expect(doctorSearchSchema.parse({ specialty: "general", radius: "abc" }).radius).toBe(15);
  });

  it("rejects an unknown specialty", () => {
    expect(doctorSearchSchema.safeParse({ specialty: "astrology" }).success).toBe(false);
  });

  it("splits and bounds the conditions list", () => {
    const parsed = doctorSearchSchema.parse({
      specialty: "general",
      conditions: "  Fever , cough ,,",
    });
    expect(parsed.conditions).toEqual(["fever", "cough"]);
  });

  it("rejects out-of-range coordinates", () => {
    expect(doctorSearchSchema.safeParse({ specialty: "general", lat: "91" }).success).toBe(false);
  });
});

describe("routeSymptomSchema", () => {
  it("rejects text too short to route", () => {
    expect(routeSymptomSchema.safeParse({ text: "hi" }).success).toBe(false);
    expect(routeSymptomSchema.safeParse({}).success).toBe(false);
    expect(routeSymptomSchema.safeParse({ text: 42 }).success).toBe(false);
  });

  it("caps the length of the sensitive free-text field", () => {
    expect(routeSymptomSchema.safeParse({ text: "a".repeat(501) }).success).toBe(false);
  });
});

describe("llmRoutingSchema treats model output as untrusted", () => {
  it("drops hallucinated specialty slugs but keeps valid ones", () => {
    const parsed = llmRoutingSchema.parse({
      emergency: false,
      specialties: [
        { slug: "astrology", reason: "made up" },
        { slug: "dermatology", reason: "skin complaint" },
      ],
      matched_conditions: ["Hair Fall", "  "],
    });
    expect(parsed.specialties).toEqual([{ slug: "dermatology", reason: "skin complaint" }]);
    expect(parsed.matched_conditions).toEqual(["hair fall"]);
  });

  it("caps the number of returned specialties at two", () => {
    const parsed = llmRoutingSchema.parse({
      emergency: false,
      specialties: [
        { slug: "dermatology", reason: "a" },
        { slug: "ent", reason: "b" },
        { slug: "dental", reason: "c" },
      ],
      matched_conditions: [],
    });
    expect(parsed.specialties).toHaveLength(2);
  });

  it("rejects structurally wrong output rather than coercing it", () => {
    expect(llmRoutingSchema.safeParse({ specialties: "dermatology" }).success).toBe(false);
    expect(llmRoutingSchema.safeParse("not json at all").success).toBe(false);
  });

  it("tolerates missing optional fields", () => {
    const parsed = llmRoutingSchema.parse({});
    expect(parsed).toEqual({ emergency: false, specialties: [], matched_conditions: [] });
  });
});
