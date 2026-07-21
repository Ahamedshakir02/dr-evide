import { Pool } from "pg";
import { haversineKm } from "./ranking";
import type { Doctor, SpecialtySlug } from "./types";
import sampleData from "../../db/sample-doctors.json";

/**
 * Data access layer. Uses Postgres/PostGIS when DATABASE_URL is set,
 * otherwise falls back to bundled sample data so `npm run dev` works
 * with zero setup.
 */

let pool: Pool | null = null;
function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}

export interface SearchParams {
  specialty: SpecialtySlug;
  lat: number;
  lng: number;
  radiusKm: number;
}

export async function findDoctors(
  params: SearchParams
): Promise<(Doctor & { distance_km: number })[]> {
  const p = getPool();
  if (p) return findDoctorsPg(p, params);
  return findDoctorsSample(params);
}

export async function getDoctor(id: number): Promise<Doctor | null> {
  const p = getPool();
  if (p) {
    const { rows } = await p.query("SELECT * FROM doctors WHERE id = $1", [id]);
    return rows[0] ?? null;
  }
  return (sampleData.doctors as Doctor[]).find((d) => d.id === id) ?? null;
}

async function findDoctorsPg(
  p: Pool,
  { specialty, lat, lng, radiusKm }: SearchParams
): Promise<(Doctor & { distance_km: number })[]> {
  const { rows } = await p.query(
    `SELECT *,
       ST_Distance(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) / 1000.0 AS distance_km
     FROM doctors
     WHERE specialty_slug = $3
       AND ST_DWithin(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $4)
     ORDER BY distance_km`,
    [lng, lat, specialty, radiusKm * 1000]
  );
  return rows.map((r) => ({ ...r, distance_km: Number(r.distance_km) }));
}

function findDoctorsSample({
  specialty,
  lat,
  lng,
  radiusKm,
}: SearchParams): (Doctor & { distance_km: number })[] {
  return (sampleData.doctors as Doctor[])
    .filter((d) => d.specialty_slug === specialty)
    .map((d) => ({ ...d, distance_km: haversineKm(lat, lng, d.lat, d.lng) }))
    .filter((d) => d.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);
}

/** Default map center: Edappal, Kerala. */
export const DEFAULT_LOCATION = { lat: 10.9855, lng: 76.0105 };
export const DEFAULT_RADIUS_KM = 15;
