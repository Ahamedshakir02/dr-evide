import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { getPool } from "../../src/pool";

/**
 * Shared set-up for every integration test: a real Postgres with PostGIS.
 *
 * Each test starts from empty tables plus the seven specialties, so tests can
 * run in any order and nothing depends on sample data. The schema is applied
 * through the same file `npm run db:migrate` uses, so a migration that breaks
 * on a fresh database breaks here first.
 */

const here = dirname(fileURLToPath(import.meta.url));
const SCHEMA = readFileSync(join(here, "..", "..", "schema.sql"), "utf8");

export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? "";

/** Use as `describe.skipIf(!hasDatabase)` so a plain checkout still passes. */
export const hasDatabase = TEST_DATABASE_URL !== "";

/** Every table, children first. Truncated before each test. */
const TABLES = [
  "admin_audit_log",
  "admin_sessions",
  "credential_provenance",
  "score_history",
  "listing_applications",
  "admin_users",
  "doctors",
  "launch_notifications",
  "daily_counters",
];

const SPECIALTIES = [
  ["dermatology", "Dermatology"],
  ["cardiology", "Cardiology"],
  ["general", "General Physician"],
  ["dental", "Dental"],
  ["ent", "ENT"],
  ["pediatrics", "Pediatrics"],
  ["orthopedics", "Orthopedics"],
];

function assertTestDatabase(url: string): void {
  const name = new URL(url).pathname.replace(/^\//, "");
  if (!/test/i.test(name)) {
    throw new Error(
      `Refusing to run integration tests against "${name}": every table is truncated ` +
        `before each test. Point TEST_DATABASE_URL at a database whose name contains "test".`
    );
  }
}

/**
 * Point the app's pool at the test database and bring the schema up to date.
 * Call once per file, in beforeAll.
 */
export async function setUpDatabase(): Promise<void> {
  assertTestDatabase(TEST_DATABASE_URL);
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  await closePool();
  const c = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await c.connect();
  try {
    await c.query(SCHEMA);
  } finally {
    await c.end();
  }
}

/** Empty every table and re-seed specialties. Call in beforeEach. */
export async function resetDatabase(): Promise<void> {
  const p = pool();
  await p.query(`TRUNCATE ${TABLES.join(", ")} RESTART IDENTITY CASCADE`);
  for (const [slug, name] of SPECIALTIES) {
    await p.query(
      `INSERT INTO specialties (slug, name) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`,
      [slug, name]
    );
  }
}

/** Close the app's pool so the next file (or the process) starts clean. */
export async function closePool(): Promise<void> {
  const g = globalThis as unknown as { __drEvidePool?: pg.Pool };
  const p = g.__drEvidePool;
  g.__drEvidePool = undefined;
  await p?.end();
}

export function pool(): pg.Pool {
  const p = getPool();
  if (!p) throw new Error("DATABASE_URL is not set; call setUpDatabase() first.");
  return p;
}

/** Shorthand for a query in an assertion. */
export async function q<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool().query(sql, params)).rows as T[];
}

// ── Fixtures ────────────────────────────────────────────────────────────────

/** Edappal, the launch town, and points at known distances from it. */
export const EDAPPAL = { lat: 10.9855, lng: 76.0105 };

/** Roughly `km` kilometres due north of Edappal (1° latitude ≈ 111.2 km). */
export const northOfEdappal = (km: number) => ({ lat: EDAPPAL.lat + km / 111.2, lng: EDAPPAL.lng });

export interface DoctorFixture {
  full_name?: string;
  specialty_slug?: string;
  nmc_reg_no?: string | null;
  nmc_verified?: boolean;
  lat?: number;
  lng?: number;
  status?: "published" | "hidden";
  is_sample?: boolean;
  town?: string;
  clinic_name?: string;
  conditions?: string[];
  review_count?: number;
  review_avg?: number;
}

let regSeq = 0;

export async function insertDoctor(d: DoctorFixture = {}): Promise<number> {
  regSeq += 1;
  const { rows } = await pool().query(
    `INSERT INTO doctors (full_name, specialty_slug, qualifications, qualification_level,
       nmc_reg_no, nmc_verified, reg_year, clinic_name, address, town, phone, lat, lng,
       status, is_sample, conditions, review_count, review_avg)
     VALUES ($1,$2,'{MBBS}',1,$3,$4,2010,$5,'Main Road',$6,'0494 268 0000',$7,$8,$9,$10,$11,$12,$13)
     RETURNING id`,
    [
      d.full_name ?? `Dr Test ${regSeq}`,
      d.specialty_slug ?? "dermatology",
      d.nmc_reg_no === undefined ? `TCMC-${10000 + regSeq}` : d.nmc_reg_no,
      d.nmc_verified ?? false,
      d.clinic_name ?? "Test Clinic",
      d.town ?? "Edappal",
      d.lat ?? EDAPPAL.lat,
      d.lng ?? EDAPPAL.lng,
      d.status ?? "published",
      d.is_sample ?? false,
      d.conditions ?? [],
      d.review_count ?? 0,
      d.review_avg ?? 0,
    ]
  );
  return Number(rows[0].id);
}

/** An admin row. The hash is opaque to the db package; route tests pass a real one. */
export async function insertAdmin(
  email = "admin@example.com",
  name = "Test Admin",
  passwordHash = "scrypt$1$1$1$AAAA$AAAA",
  disabled = false
): Promise<{ id: number; email: string; name: string }> {
  const { rows } = await pool().query(
    `INSERT INTO admin_users (email, name, password_hash, disabled) VALUES ($1,$2,$3,$4) RETURNING id`,
    [email, name, passwordHash, disabled]
  );
  return { id: Number(rows[0].id), email, name };
}

/** A complete, valid listing-application body, as the public form would send it. */
export function applicationBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  regSeq += 1;
  return {
    full_name: "Dr Anitha Menon",
    specialty_slug: "dermatology",
    qualifications: ["MBBS", "MD Dermatology"],
    qualification_level: 3,
    nmc_reg_no: `TCMC-${50000 + regSeq}`,
    registration_council: "Travancore-Cochin Medical Council",
    reg_year: 2012,
    clinic_name: "Menon Skin Clinic",
    address: "Near Bus Stand, Edappal",
    town: "Edappal",
    phone: "+91 94470 00000",
    fee_inr: 300,
    timings: "Mon–Sat 9am–1pm",
    conditions: ["Acne", "eczema", "acne"],
    map_link: "https://maps.google.com/?q=10.98,76.01",
    contact_email: "Anitha@Example.com",
    consent: true,
    ...overrides,
  };
}
