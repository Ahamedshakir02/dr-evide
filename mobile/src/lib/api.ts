import { haversineKm, rankDoctors, scoreOne } from "./ranking";
import { routeSymptomLocal } from "./routing";
import { SPECIALTIES } from "./taxonomy";
import sampleData from "./sample-doctors.json";
import type { Doctor, RankedDoctor, RoutingResult, SpecialtySlug } from "./types";

/**
 * Data access. Talks to the Next.js API when it can reach it, and falls back
 * to the bundled sample doctors when it can't — mirroring how the web app's
 * src/lib/db.ts degrades when DATABASE_URL is unset, so the app always runs
 * on a phone even with no server.
 *
 * Point EXPO_PUBLIC_API_URL at your dev machine's LAN address (not
 * localhost — that resolves to the phone itself), e.g.
 *   EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
 */
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/** Edappal town centre — mirrors DEFAULT_LOCATION in the web app's db.ts. */
export const DEFAULT_LOCATION = { lat: 10.9855, lng: 76.0105 };
export const DEFAULT_RADIUS_KM = 5;

const TIMEOUT_MS = 6000;

/** Fetch that gives up rather than hanging a screen on an unreachable server. */
async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!API_URL) throw new Error("No API configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${API_URL}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface SearchResult {
  specialty: { slug: SpecialtySlug; name: string; description: string };
  doctors: RankedDoctor[];
  /** True when this came from bundled data rather than the server. */
  offline: boolean;
}

export async function routeSymptom(text: string): Promise<RoutingResult> {
  try {
    const res = await apiFetch("/api/route-symptom", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (res.ok) return (await res.json()) as RoutingResult;
  } catch {
    // fall through to the on-device router
  }
  return routeSymptomLocal(text);
}

export async function findDoctors(params: {
  specialty: SpecialtySlug;
  conditions: string[];
  lat: number;
  lng: number;
  radiusKm: number;
}): Promise<SearchResult> {
  const { specialty, conditions, lat, lng, radiusKm } = params;

  const qs = new URLSearchParams({
    specialty,
    radius: String(radiusKm),
    lat: String(lat),
    lng: String(lng),
  });
  if (conditions.length) qs.set("conditions", conditions.join(","));

  try {
    const res = await apiFetch(`/api/doctors?${qs.toString()}`);
    if (res.ok) {
      const json = await res.json();
      return { specialty: json.specialty, doctors: json.doctors, offline: false };
    }
  } catch {
    // fall through to bundled data
  }

  return { ...searchSample(specialty, conditions, lat, lng, radiusKm), offline: true };
}

export async function getDoctor(id: number): Promise<Doctor | null> {
  try {
    const res = await apiFetch(`/api/doctors/${id}`);
    if (res.ok) return (await res.json()).doctor as Doctor;
  } catch {
    // fall through to bundled data
  }
  return (sampleData.doctors as Doctor[]).find((d) => d.id === id) ?? null;
}

/** Same filter → rank pipeline the server runs, against the bundled data. */
function searchSample(
  specialty: SpecialtySlug,
  conditions: string[],
  lat: number,
  lng: number,
  radiusKm: number
): Omit<SearchResult, "offline"> {
  const withDistance = (sampleData.doctors as Doctor[])
    .filter((d) => d.specialty_slug === specialty)
    .map((d) => ({ ...d, distance_km: haversineKm(lat, lng, d.lat, d.lng) }))
    .filter((d) => d.distance_km <= radiusKm);

  return {
    specialty: { slug: specialty, ...SPECIALTIES[specialty] },
    doctors: rankDoctors(withDistance, conditions, radiusKm),
  };
}

export { scoreOne, haversineKm };
