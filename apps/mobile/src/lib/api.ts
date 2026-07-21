import {
  DEFAULT_LOCATION,
  SAMPLE_DOCTORS,
  SPECIALTIES,
  haversineKm,
  rankDoctors,
  routeByKeywords,
  scoreOne,
  type Doctor,
  type RankedDoctor,
  type RoutingResult,
  type SpecialtySlug,
} from "@dr-evide/core";

/**
 * Data access for the app.
 *
 * Talks to the Next.js API when it can reach it and falls back to the bundled
 * sample doctors when it can't, mirroring how the web app degrades with no
 * DATABASE_URL — so the app still works on a phone with no signal, which in the
 * launch area is a normal Tuesday rather than an edge case.
 *
 * Both paths run the identical filter → rank pipeline from @dr-evide/core, so a
 * doctor scores the same offline as online. That used to be a promise kept by
 * copy-pasting ranking.ts between two directories; now it is kept by there
 * being one file.
 *
 * Point EXPO_PUBLIC_API_URL at your dev machine's LAN address (not localhost —
 * that resolves to the phone itself), e.g. EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/** The phone default. Narrower than the web's 15km — a phone user is usually already out. */
export const DEFAULT_RADIUS_KM = 5;

export { DEFAULT_LOCATION };

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
  /** The year the scores were computed against, for the "N yrs" line on cards. */
  asOfYear: number;
  /** True when this came from bundled data rather than the server. */
  offline: boolean;
}

/**
 * Route a symptom description.
 *
 * The server path adds LLM routing; the offline path is keyword-only. Both run
 * the same emergency check first — routeByKeywords does it internally — so a red
 * flag reaches 108 with or without a network.
 */
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
  return routeByKeywords(text);
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
      return {
        specialty: json.specialty,
        doctors: json.doctors,
        asOfYear: json.as_of_year ?? currentYear(),
        offline: false,
      };
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
  return SAMPLE_DOCTORS.find((d) => d.id === id) ?? null;
}

/** Same filter → rank pipeline the server runs, against the bundled data. */
function searchSample(
  specialty: SpecialtySlug,
  conditions: string[],
  lat: number,
  lng: number,
  radiusKm: number
): Omit<SearchResult, "offline"> {
  const asOfYear = currentYear();
  const withDistance = SAMPLE_DOCTORS.filter((d) => d.specialty_slug === specialty)
    .map((d) => ({ ...d, distance_km: haversineKm(lat, lng, d.lat, d.lng) }))
    .filter((d) => d.distance_km <= radiusKm);

  return {
    specialty: { slug: specialty, ...SPECIALTIES[specialty] },
    doctors: rankDoctors(withDistance, { matchedConditions: conditions, radiusKm, asOfYear }),
    asOfYear,
  };
}

export const currentYear = (): number => new Date().getFullYear();

export { scoreOne, haversineKm };
