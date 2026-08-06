import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { DEFAULT_LOCATION } from "@dr-evide/core";

/**
 * Where the person actually is.
 *
 * The app shipped without this. Every screen passed `DEFAULT_LOCATION` — the
 * Edappal town centre — so a product whose entire premise is "find the right
 * doctor *near you*" meant "near the town centre" on the one device where the
 * phrase matters most.
 *
 * It was not only a wording problem. The `accessibility` component of TrustScore
 * (10 points) includes a nearness term measured from the search origin, so a
 * wrong origin produces a genuinely different score. The website measured from
 * the user and the app measured from the town square, which means the same
 * doctor could score differently in the two places — exactly the divergence
 * packages/core was created to end.
 *
 * Fails soft, always. Permission denied, location services off, no fix, an
 * airplane-mode phone in a concrete building: every one of them lands on the
 * Edappal centre and the search still runs. Nobody is ever blocked from finding
 * a doctor because they would not share their location.
 */

export interface Coords {
  lat: number;
  lng: number;
  /** False when this is the Edappal fallback rather than a real fix. */
  precise: boolean;
}

export const FALLBACK_COORDS: Coords = { ...DEFAULT_LOCATION, precise: false };

/**
 * Module-level cache.
 *
 * The results screen and the profile screen must measure from the same origin,
 * or the distance on the card and the distance on the profile disagree — and so
 * do the two TrustScores. Caching here is what keeps them consistent within a
 * session without threading coordinates through navigation params, where they
 * would end up in the router's history.
 */
let cached: Coords | null = null;
let inFlight: Promise<Coords> | null = null;

/**
 * Six seconds, matching the API client.
 *
 * `getCurrentPositionAsync` can sit indefinitely on a device with no GPS fix,
 * and a spinner that never resolves is worse than a slightly wrong radius.
 */
const TIMEOUT_MS = 6_000;

export async function getUserLocation(): Promise<Coords> {
  if (cached) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return FALLBACK_COORDS;

      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        TIMEOUT_MS
      );
      if (!position) return FALLBACK_COORDS;

      return {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        precise: true,
      };
    } catch {
      // Location services disabled, hardware unavailable, permission revoked
      // mid-call. All the same answer: search from the town centre.
      return FALLBACK_COORDS;
    }
  })();

  cached = await inFlight;
  inFlight = null;

  // A fallback is not worth caching for the session — the person may grant
  // permission from Settings and come back, and they should not have to
  // restart the app for it to take effect.
  if (!cached.precise) {
    const result = cached;
    cached = null;
    return result;
  }
  return cached;
}

/**
 * The fallback first, then the real fix when it arrives.
 *
 * Deliberately never returns null: a screen must be able to render and search
 * immediately, and refine once, rather than holding a spinner while a GPS
 * chip decides.
 */
export function useUserLocation(): Coords {
  const [coords, setCoords] = useState<Coords>(cached ?? FALLBACK_COORDS);

  useEffect(() => {
    let alive = true;
    void getUserLocation().then((next) => {
      if (alive) setCoords(next);
    });
    return () => {
      alive = false;
    };
  }, []);

  return coords;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}
