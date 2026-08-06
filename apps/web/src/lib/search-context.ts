"use client";

import {
  DEFAULT_LOCATION,
  WEB_RADIUS_DEFAULT_KM,
  isSpecialtySlug,
  type SpecialtySlug,
} from "@dr-evide/core";

/**
 * The current search, held in sessionStorage instead of the URL.
 *
 * Why this module exists:
 *
 * The routed condition keywords ("chest pain", "hair fall") are derived from a
 * free-text health complaint, which makes them sensitive personal data under
 * the DPDP Act 2023. /api/route-symptom is careful with them — classified in
 * memory, never persisted, never logged, `no-store` on the response — and then
 * v2 put them straight into a query string:
 *
 *     /results?specialty=cardiology&conditions=chest+pain
 *
 * A query string is the least private place in a web app. It lands in browser
 * history on a phone that is often shared, in the access log of every proxy in
 * front of the app, and — until the Referrer-Policy added in next.config.mjs —
 * in the `Referer` header of all ~20 OpenStreetMap tile requests the results
 * map fires, plus every click through to Google Maps.
 *
 * sessionStorage costs us shareable result links, which is the right trade: a
 * URL that reproduces someone's symptom search is not a link they should be
 * able to send by accident.
 *
 * Scope notes:
 *   - Per tab, cleared when the tab closes. Opening a profile in a new tab
 *     loses the context and the page falls back to defaults, which is why every
 *     reader here has to tolerate `null`.
 *   - Coordinates live here too. Precise location is not health data, but it is
 *     the other half of the pair the DPDP Act exists to keep apart, and there
 *     is no reason for it to outlive the tab either.
 */

const KEY = "dr-evide:search";

export interface SearchContext {
  specialty: SpecialtySlug;
  /** Routed condition keywords, already lowercased. */
  conditions: string[];
  radiusKm: number;
  /** The user's location, when they granted it. */
  lat: number;
  lng: number;
}

/**
 * What every reader falls back to when there is no stored context — a direct
 * link, a new tab, a crawler, or a browser with storage disabled.
 *
 * Deliberately identical to the defaults in `doctorSearchSchema`, so a profile
 * opened cold shows the same score the API would compute for the same doctor
 * with no search behind it.
 */
export function defaultSearchContext(specialty: SpecialtySlug): SearchContext {
  return {
    specialty,
    conditions: [],
    radiusKm: WEB_RADIUS_DEFAULT_KM,
    lat: DEFAULT_LOCATION.lat,
    lng: DEFAULT_LOCATION.lng,
  };
}

export function saveSearchContext(ctx: SearchContext): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(ctx));
  } catch {
    // Private mode, storage disabled, or quota. Losing the context degrades the
    // search to defaults; it must never break the page for someone unwell.
  }
}

/**
 * Read the stored context, or null.
 *
 * Parsed defensively rather than cast: sessionStorage is writable by anything
 * running on the origin, and this value feeds a scoring call. A malformed or
 * tampered entry is discarded, not repaired.
 */
export function readSearchContext(): SearchContext | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Record<string, unknown>;

    if (!isSpecialtySlug(o.specialty)) return null;
    if (!isFinite(o.lat) || !isFinite(o.lng) || !isFinite(o.radiusKm)) return null;

    return {
      specialty: o.specialty,
      conditions: Array.isArray(o.conditions)
        ? o.conditions.filter((c): c is string => typeof c === "string").slice(0, 12)
        : [],
      radiusKm: o.radiusKm as number,
      lat: o.lat as number,
      lng: o.lng as number,
    };
  } catch {
    return null;
  }
}

/** The context for a specialty: stored if it matches, defaults otherwise. */
export function searchContextFor(specialty: SpecialtySlug): SearchContext {
  const stored = readSearchContext();
  return stored && stored.specialty === specialty
    ? stored
    : defaultSearchContext(specialty);
}

const isFinite = (v: unknown): boolean => typeof v === "number" && Number.isFinite(v);
