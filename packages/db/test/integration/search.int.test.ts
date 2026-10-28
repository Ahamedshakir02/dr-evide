import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkDatabase,
  dataMode,
  findDoctors,
  getDoctor,
  listIndexableDoctors,
  recordLaunchInterest,
} from "../../src/index";
import {
  EDAPPAL,
  closePool,
  hasDatabase,
  insertDoctor,
  northOfEdappal,
  q,
  resetDatabase,
  setUpDatabase,
} from "./harness";

/**
 * The public read path against real PostGIS: radius, specialty, and the
 * published / sample gates that decide what a member of the public sees.
 */

describe.skipIf(!hasDatabase)("public doctor search (PostGIS)", () => {
  beforeAll(setUpDatabase);
  beforeEach(resetDatabase);
  afterEach(() => vi.unstubAllEnvs());
  afterAll(closePool);

  const search = (radiusKm = 10, specialty = "dermatology" as const) =>
    findDoctors({ specialty, ...EDAPPAL, radiusKm });

  it("reports the database as the data source and as reachable", async () => {
    expect(dataMode()).toBe("database");
    expect(await checkDatabase()).toBe("ok");
  });

  it("returns doctors inside the radius, nearest first, with real distances", async () => {
    const near = await insertDoctor({ full_name: "Near", ...northOfEdappal(2) });
    const mid = await insertDoctor({ full_name: "Mid", ...northOfEdappal(6) });
    await insertDoctor({ full_name: "Far", ...northOfEdappal(14) });

    const found = await search(10);
    expect(found.map((d) => d.id)).toEqual([near, mid]);
    expect(found[0].distance_km).toBeCloseTo(2, 0);
    expect(found[1].distance_km).toBeCloseTo(6, 0);
    expect(typeof found[0].lat).toBe("number");
  });

  it("only returns the requested specialty", async () => {
    await insertDoctor({ specialty_slug: "cardiology" });
    const derm = await insertDoctor({ specialty_slug: "dermatology" });
    expect((await search()).map((d) => d.id)).toEqual([derm]);
  });

  it("never exposes internal columns such as geom, status or timestamps", async () => {
    await insertDoctor();
    const [d] = await search();
    expect(d).not.toHaveProperty("geom");
    expect(d).not.toHaveProperty("status");
    expect(d).not.toHaveProperty("created_at");
  });

  it("hides doctors an admin has taken down, from search and from the profile page", async () => {
    const hidden = await insertDoctor({ status: "hidden" });
    expect(await search()).toEqual([]);
    expect(await getDoctor(hidden)).toBeNull();
  });

  it("shows sample doctors in development but never in production", async () => {
    const sample = await insertDoctor({ is_sample: true, nmc_reg_no: null });

    vi.stubEnv("NODE_ENV", "development");
    expect((await search()).map((d) => d.id)).toEqual([sample]);
    expect(await getDoctor(sample)).not.toBeNull();

    vi.stubEnv("NODE_ENV", "production");
    expect(await search()).toEqual([]);
    expect(await getDoctor(sample)).toBeNull();
  });

  it("returns null for a doctor that does not exist", async () => {
    expect(await getDoctor(999_999)).toBeNull();
  });

  it("lists only real, published doctors in the sitemap", async () => {
    const real = await insertDoctor();
    await insertDoctor({ status: "hidden" });
    await insertDoctor({ is_sample: true, nmc_reg_no: null });
    expect((await listIndexableDoctors()).map((d) => d.id)).toEqual([real]);
  });

  it("refuses two real doctors with the same registration number", async () => {
    await insertDoctor({ nmc_reg_no: "TCMC-1" });
    await expect(insertDoctor({ nmc_reg_no: "TCMC-1" })).rejects.toThrow(/duplicate key/);
    // Sample rows are fixtures and may share placeholder numbers.
    await insertDoctor({ nmc_reg_no: "TCMC-1", is_sample: true });
  });
});

describe.skipIf(!hasDatabase)("launch notification list", () => {
  beforeAll(setUpDatabase);
  beforeEach(resetDatabase);
  afterAll(closePool);

  it("stores an address once, case-insensitively, lowercased", async () => {
    expect(await recordLaunchInterest("  Reader@Example.COM ", "ml")).toBe("saved");
    expect(await recordLaunchInterest("reader@example.com", "en")).toBe("duplicate");
    expect(await q(`SELECT email, lang FROM launch_notifications`)).toEqual([
      { email: "reader@example.com", lang: "ml" },
    ]);
  });
});
