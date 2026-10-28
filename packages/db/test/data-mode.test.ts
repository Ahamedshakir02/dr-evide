import { afterEach, describe, expect, it, vi } from "vitest";
import { DataUnavailableError, dataMode, findDoctors, getDoctor, isSampleMode } from "../src/index";

/**
 * Production must never fall back to fictional doctors by accident. A missing
 * DATABASE_URL is a deploy mistake, and before v0.5 it served twenty invented
 * people to the public behind a banner.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

const search = { specialty: "dermatology" as const, lat: 10.8, lng: 76.0, radiusKm: 25 };

describe("dataMode", () => {
  it("uses sample data in development with no database", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(dataMode()).toBe("sample");
    expect(isSampleMode()).toBe(true);
    expect((await findDoctors(search)).length).toBeGreaterThan(0);
  });

  it("refuses to serve anyone in production with no database", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(dataMode()).toBe("unconfigured");
    expect(isSampleMode()).toBe(false);
    await expect(findDoctors(search)).rejects.toBeInstanceOf(DataUnavailableError);
    await expect(getDoctor(1)).rejects.toBeInstanceOf(DataUnavailableError);
  });

  it("allows sample data in production only when asked for by name", async () => {
    vi.stubEnv("DATABASE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_SAMPLE_DATA", "true");
    expect(dataMode()).toBe("sample");
    expect((await findDoctors(search)).length).toBeGreaterThan(0);
  });

  it("is the database whenever one is configured", () => {
    vi.stubEnv("DATABASE_URL", "postgres://u:p@localhost:5432/db");
    vi.stubEnv("NODE_ENV", "production");
    expect(dataMode()).toBe("database");
    expect(isSampleMode()).toBe(false);
  });
});
