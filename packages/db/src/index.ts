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

let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // A doctor search is a single indexed lookup; if it has not answered in
      // five seconds the database is unhealthy and the user is better served by
      // an error than a spinner.
      connectionTimeoutMillis: 5_000,
      statement_timeout: 5_000,
      max: 10,
    });
  }
  return pool;
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
     LIMIT 200`,
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
