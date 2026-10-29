import {
  DEFAULT_LOCATION,
  MOBILE_RADIUS_DEFAULT_KM,
  haversineKm,
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
 * Doctors come from the Next.js API and nowhere else. The app used to fall
 * back to the bundled sample doctors when the server was unreachable, which
 * meant a person with no signal was shown fictional doctors with real-looking
 * phone numbers at the moment they most needed a real one. Now an unreachable
 * server is a LoadError, and the screen says "we couldn't check" with a retry,
 * which is the truth.
 *
 * Routing a symptom is different: the keyword router and the emergency check
 * are code, not data, so they still run on the phone with no network.
 *
 * Point EXPO_PUBLIC_API_URL at your dev machine's LAN address (not localhost —
 * that resolves to the phone itself), e.g. EXPO_PUBLIC_API_URL=http://192.168.1.5:3000
 */

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

/**
 * Re-exported from @dr-evide/core, not redeclared.
 *
 * The phone default is still narrower than the website's — a phone user is
 * usually already out — but that difference is now stated once, in geo.ts,
 * rather than as a local constant here that drifted from the one the API
 * actually applies.
 */
export { DEFAULT_LOCATION, MOBILE_RADIUS_DEFAULT_KM };

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

/**
 * Why doctors could not be loaded.
 *
 *   offline — the request never got an answer (no signal, timeout, DNS).
 *   server  — the server answered with an error, or no API is configured.
 *
 * The two get different copy because they ask different things of the reader:
 * one is "check your connection", the other is "it is not you".
 */
export class LoadError extends Error {
  constructor(public readonly kind: "offline" | "server") {
    super(kind === "offline" ? "Could not reach the server" : "The server returned an error");
    this.name = "LoadError";
  }
}

export interface SearchResult {
  specialty: { slug: SpecialtySlug; name: string; description: string };
  doctors: RankedDoctor[];
  /** The year the scores were computed against, for the "N yrs" line on cards. */
  asOfYear: number;
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

/** apiFetch, with "no answer" and "an error answer" told apart. */
async function request(path: string): Promise<Response> {
  if (!API_URL) throw new LoadError("server");
  let res: Response;
  try {
    res = await apiFetch(path);
  } catch {
    throw new LoadError("offline");
  }
  return res;
}

/** Throws LoadError. An empty list is a real answer, not an error. */
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

  const res = await request(`/api/doctors?${qs.toString()}`);
  if (!res.ok) throw new LoadError("server");
  try {
    const json = await res.json();
    return {
      specialty: json.specialty,
      doctors: json.doctors,
      asOfYear: json.as_of_year ?? currentYear(),
    };
  } catch {
    throw new LoadError("server");
  }
}

/** The doctor, null when the server says there is no such doctor, or throws LoadError. */
export async function getDoctor(id: number): Promise<Doctor | null> {
  if (!Number.isFinite(id)) return null;
  const res = await request(`/api/doctors/${id}`);
  if (res.status === 404 || res.status === 400) return null;
  if (!res.ok) throw new LoadError("server");
  try {
    return (await res.json()).doctor as Doctor;
  } catch {
    throw new LoadError("server");
  }
}

export const currentYear = (): number => new Date().getFullYear();

export { scoreOne, haversineKm };
