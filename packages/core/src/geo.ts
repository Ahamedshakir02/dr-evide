/** Edappal town centre — the launch area, and the fallback when we have no user location. */
export const DEFAULT_LOCATION = { lat: 10.9855, lng: 76.0105 };

/**
 * Search radius bounds — the one definition.
 *
 * These lived in three places and disagreed. `doctorSearchSchema` defaulted to
 * 15km and the README documented 15km, while the web slider opened at 5km and
 * capped at 25km, and the mobile screen declared its own 25km cap next to a
 * comment describing "the web's 15km". A bare /api/doctors call and the same
 * search made through the UI returned different result sets, which is exactly
 * the class of drift packages/core exists to prevent — it just happened to be
 * numbers rather than a module.
 *
 * The two platform defaults genuinely differ and that difference is kept, but
 * it is stated once, here, rather than rediscovered per file.
 */
export const MIN_RADIUS_KM = 1;

/**
 * Hard ceiling, applied by the UI sliders and by schema clamping alike.
 *
 * Lowered from 100. Nothing in either app could ever ask for more than 25, so
 * the only caller a 100km ceiling served was an anonymous one pointing a
 * PostGIS radius scan at the database.
 */
export const MAX_RADIUS_KM = 25;

/**
 * Website default, and the default `doctorSearchSchema` applies when a request
 * omits the parameter. Someone at a desk is planning a trip they have not made
 * yet, so the wider net is the useful one.
 */
export const WEB_RADIUS_DEFAULT_KM = 15;

/** Phone default. Narrower on purpose — a phone user is usually already out. */
export const MOBILE_RADIUS_DEFAULT_KM = 5;

/** @deprecated Use WEB_RADIUS_DEFAULT_KM or MOBILE_RADIUS_DEFAULT_KM. */
export const DEFAULT_RADIUS_KM = WEB_RADIUS_DEFAULT_KM;

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
