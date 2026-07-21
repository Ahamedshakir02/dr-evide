/** Edappal town centre — the launch area, and the fallback when we have no user location. */
export const DEFAULT_LOCATION = { lat: 10.9855, lng: 76.0105 };

/** Web default. The mobile app narrows this to 5km; a phone user is usually already out. */
export const DEFAULT_RADIUS_KM = 15;

export const MIN_RADIUS_KM = 1;
export const MAX_RADIUS_KM = 100;

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance in km.
 *
 * Used only for the bundled sample data — when DATABASE_URL is set, PostGIS
 * does this with ST_Distance on a geography column and gets the spheroid right.
 * Over a 15km radius in Kerala the difference is metres, well inside the error
 * of the coordinates themselves.
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const toRad = (deg: number) => (deg * Math.PI) / 180;
