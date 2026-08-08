import { Pool } from "pg";
import {
  SAMPLE_DOCTORS,
  doctorSchema,
  haversineKm,
  type Doctor,
  type SpecialtySlug,
} from "@dr-evide/core";

/**
 * The doctor query layer.
 *
 * Uses Postgres/PostGIS when DATABASE_URL is set, and the bundled sample data
 * otherwise, so `npm run dev` works with zero setup. The fallback is not a
 * convenience hack — the mobile app relies on the same dataset when it cannot
 * reach a server, and both paths run the identical filter → rank pipeline.
 */

export type DoctorWithDistance = Doctor & { distance_km: number };

/**
 * The pool hangs off globalThis, not a module-level `let`.
 *
 * Next's dev server re-evaluates modules on every save, so a module-scoped pool
 * is a new pool per edit — ten more connections each time, until Postgres stops
 * accepting them. In production the module is evaluated once and this behaves
 * identically to a plain variable.
 */
const globalForPg = globalThis as unknown as { __drEvidePool?: Pool };

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForPg.__drEvidePool) {
    globalForPg.__drEvidePool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // A doctor search is a single indexed lookup; if it has not answered in
      // five seconds the database is unhealthy and the user is better served by
      // an error than a spinner.
      connectionTimeoutMillis: 5_000,
      statement_timeout: 5_000,
      max: 10,
    });
  }
  return globalForPg.__drEvidePool;
}

/**
 * Is the database reachable? For /api/health only.
 *
 * Returns a string rather than throwing, because a health endpoint that throws
 * tells a load balancer less than one that answers.
 */
export async function checkDatabase(): Promise<"sample" | "ok" | "unreachable"> {
  const p = getPool();
  if (!p) return "sample";
  try {
    await p.query("SELECT 1");
    return "ok";
  } catch {
    return "unreachable";
  }
}

/** True when the app is serving fictional sample records rather than real data. */
export const isSampleMode = (): boolean => !process.env.DATABASE_URL;

/**
 * The columns the product is allowed to expose.
 *
 * Explicit rather than SELECT *, which shipped the PostGIS `geom` blob and every
 * future internal column straight to the browser. Adding a column to the schema
 * should be a deliberate decision to publish it, not an automatic one.
 */
const PUBLIC_COLUMNS = `
  id, full_name, specialty_slug, sub_specialties, conditions, qualifications,
  qualification_level, nmc_reg_no, nmc_verified, reg_year, clinic_name,
  address, town, phone, fee_inr, timings, lat, lng,
  review_count, review_avg, review_authenticity, is_sample
`;

export interface SearchParams {
  specialty: SpecialtySlug;
  lat: number;
  lng: number;
  radiusKm: number;
}

export async function findDoctors(params: SearchParams): Promise<DoctorWithDistance[]> {
  const p = getPool();
  return p ? findDoctorsPg(p, params) : findDoctorsSample(params);
}

export async function getDoctor(id: number): Promise<Doctor | null> {
  const p = getPool();

  if (p) {
    const { rows } = await p.query(
      `SELECT ${PUBLIC_COLUMNS} FROM doctors WHERE id = $1`,
      [id]
    );
    return rows[0] ? doctorSchema.parse(rows[0]) : null;
  }

  return SAMPLE_DOCTORS.find((d) => d.id === id) ?? null;
}

/**
 * Doctors whose profiles may be listed in sitemap.xml.
 *
 * `is_sample` is the gate, in SQL rather than filtered afterwards, and it is
 * the same gate the `Physician` markup uses — a fictional person is neither
 * described to a search engine nor offered to one. Returns an empty list in
 * sample mode, which is why a zero-setup checkout still publishes a two-entry
 * sitemap rather than twenty invented doctors.
 *
 * Ordered and capped so a sitemap can never grow past what the spec allows.
 * At 50,000 URLs this would need splitting into an index; the launch area has
 * a few hundred doctors, so the cap is a guard rail rather than a plan.
 */
export interface IndexableDoctor {
  id: number;
  created_at: string;
}

const SITEMAP_URL_CAP = 10_000;

export async function listIndexableDoctors(): Promise<IndexableDoctor[]> {
  const p = getPool();
  if (!p) return [];

  try {
    const { rows } = await p.query(
      `SELECT id, created_at FROM doctors
       WHERE is_sample = false
       ORDER BY id
       LIMIT ${SITEMAP_URL_CAP}`
    );
    return rows.map((r) => ({ id: Number(r.id), created_at: String(r.created_at) }));
  } catch {
    // A sitemap is a nice-to-have; a 500 on /sitemap.xml because the database
    // blinked is not. The two static entries still get served.
    return [];
  }
}

/**
 * The most doctors one search will consider.
 *
 * This is a truncation *before* ranking, and truncation is by distance while
 * ranking is by TrustScore — so past this many candidates the highest-scoring
 * doctor in the radius can be dropped for being marginally farther away than
 * the cut. That directly contradicts "distance is a filter and a tiebreaker,
 * not a quality signal" (see ranking.ts), so the cap has to sit above any
 * plausible real count rather than at a comfortable page size.
 *
 * A radius is capped at 25km (MAX_RADIUS_KM) and the launch area is rural: 200
 * was low enough for a single specialty in a dense town to reach it, 2000 is
 * not, and it is still a bound rather than an unbounded scan. If a search ever
 * hits it, `truncated` on the result says so instead of failing quietly.
 */
const SEARCH_CANDIDATE_CAP = 2_000;

async function findDoctorsPg(
  p: Pool,
  { specialty, lat, lng, radiusKm }: SearchParams
): Promise<DoctorWithDistance[]> {
  const { rows } = await p.query(
    `SELECT ${PUBLIC_COLUMNS},
       ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 AS distance_km
     FROM doctors
     WHERE specialty_slug = $3
       AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $4)
     ORDER BY distance_km
     LIMIT ${SEARCH_CANDIDATE_CAP}`,
    [lng, lat, specialty, radiusKm * 1000]
  );

  // Parsed, not cast: pg returns numerics as strings and arrays as arrays-or-null
  // depending on column type, and the Doctor type asserts nothing at runtime.
  return rows.map((r) => ({
    ...doctorSchema.parse(r),
    distance_km: Number(r.distance_km),
  }));
}

function findDoctorsSample({
  specialty,
  lat,
  lng,
  radiusKm,
}: SearchParams): DoctorWithDistance[] {
  return SAMPLE_DOCTORS.filter((d) => d.specialty_slug === specialty)
    .map((d) => ({ ...d, distance_km: haversineKm(lat, lng, d.lat, d.lng) }))
    .filter((d) => d.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

/**
 * Record an address for the launch email.
 *
 * The only write path in this package, and the only place the product stores a
 * contact detail at all. It returns a result rather than throwing so the route
 * can say something true to the person in front of it: "already on the list"
 * and "this deployment has no database" are different answers from "we lost it",
 * and a form that claims success without a row behind it is the one outcome
 * worth ruling out.
 *
 * `unconfigured` is the honest answer on a sample-data deployment. There is no
 * in-memory fallback on purpose — a list that evaporates on the next deploy
 * would take an address, promise an email, and silently never send one.
 */
export type NotifyResult = "saved" | "duplicate" | "unconfigured" | "failed";

export async function recordLaunchInterest(
  email: string,
  lang: string
): Promise<NotifyResult> {
  const p = getPool();
  if (!p) return "unconfigured";

  try {
    const { rowCount } = await p.query(
      `INSERT INTO launch_notifications (email, lang)
       VALUES ($1, $2)
       ON CONFLICT (lower(email)) DO NOTHING`,
      [email.trim().toLowerCase(), lang]
    );
    return rowCount === 0 ? "duplicate" : "saved";
  } catch {
    // The address is not echoed into a log line. It is the one identifier this
    // product holds, and an error log is the easiest place to leak it from.
    return "failed";
  }
}
