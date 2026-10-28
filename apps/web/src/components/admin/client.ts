"use client";

/**
 * How the admin console talks to /api/admin.
 *
 * Every call goes through `adminFetch`, which turns the API's shapes into one
 * result type the panels can switch on. A 401 anywhere means the session
 * expired or was revoked: the page reloads, and the server renders the
 * sign-in form instead of a console that can no longer do anything.
 *
 * Same-origin fetches carry the session cookie and an Origin header on their
 * own, which is what requireAdmin's CSRF check wants. Every write sends
 * `content-type: application/json`, body or not: the API refuses a write
 * with any other type (415), which is what stops a plain HTML form on
 * another site from posting here.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; fields: Record<string, string> };

export async function adminFetch<T>(
  path: string,
  init: { method?: string; body?: unknown } = {}
): Promise<ApiResult<T>> {
  const method = init.method ?? "GET";
  const write = method !== "GET" && method !== "HEAD";
  let res: Response;
  try {
    res = await fetch(`/api/admin/${path}`, {
      method,
      headers: write ? { "content-type": "application/json" } : undefined,
      body: write ? JSON.stringify(init.body ?? {}) : undefined,
      cache: "no-store",
    });
  } catch {
    return { ok: false, status: 0, error: "Couldn't reach the server. Check your connection.", fields: {} };
  }

  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.ok) return { ok: true, data: data as T };

  if (res.status === 401) {
    // Let the server decide what to show; it will render the sign-in form.
    window.location.reload();
  }
  const fields: Record<string, string> = {};
  for (const [k, v] of Object.entries((data.fields as Record<string, string>) ?? {})) {
    fields[k.split(".")[0] ?? k] ??= v;
  }
  return {
    ok: false,
    status: res.status,
    error: typeof data.error === "string" ? data.error : `Request failed (${res.status}).`,
    fields,
  };
}

/** "2026-10-28T02:02:20Z" → "28 Oct 2026, 7:32 am", in the timezone the team works in. */
export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

/**
 * Coordinates from what an admin is likely to paste.
 *
 *   "10.7812, 76.0123"                       — right-click → copy in Google Maps
 *   …/maps/place/…/@10.78,76.01,17z/…!3d10.7812!4d76.0123   — a place link
 *   …?q=10.7812,76.0123  /  ?ll=…  /  ?query=…
 *
 * `!3d…!4d…` is the place's own pin and wins over `@…`, which is only where
 * the map happened to be centred. Short links (maps.app.goo.gl) carry no
 * coordinates at all and return null: open them and copy the pin instead.
 */
export function parseCoords(input: string | null | undefined): { lat: number; lng: number } | null {
  if (!input) return null;
  const s = decodeURIComponentSafe(input.trim());
  const patterns = [
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/,
    /[?&](?:q|ll|query|destination)=(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/,
    /@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/,
    /^\(?\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*\)?$/,
  ];
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      const lat = Number(m[1]);
      const lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return { lat, lng };
    }
  }
  return null;
}

function decodeURIComponentSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/** Roughly Kerala and its borders. Outside it is allowed, but worth a second look. */
export const nearKerala = (c: { lat: number; lng: number }) =>
  c.lat > 7.5 && c.lat < 13.5 && c.lng > 74 && c.lng < 78;

export const osmLink = (c: { lat: number; lng: number }) =>
  `https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=17/${c.lat}/${c.lng}`;

/** The public registers a reviewer checks a registration number against. */
export const REGISTER_LINKS = [
  { label: "NMC Indian Medical Register", href: "https://www.nmc.org.in/information-desk/indian-medical-register/" },
] as const;

export const VERIFICATION_SOURCE_LABELS = {
  "nmc-registry": "NMC registry",
  "state-council": "State medical council",
  "manual-review": "Manual review (document seen)",
} as const;
