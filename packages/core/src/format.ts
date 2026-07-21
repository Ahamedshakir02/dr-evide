import type { Doctor } from "./types";

/**
 * Avatar initials. Strips the honorific and the "(SAMPLE)" marker so
 * "Dr. Anitha Menon (SAMPLE)" reads as "AM" — the marker still shows in the
 * name itself and in the sample pill, it just shouldn't pollute the avatar.
 */
export function initials(fullName: string): string {
  return fullName
    .replace(/\(SAMPLE\)/gi, "")
    .replace(/^(dr\.?|prof\.?)\s+/i, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Years since NMC registration — the experience proxy used by ranking.
 *
 * `asOfYear` is passed in rather than read from the clock, for the same reason
 * RankingContext does it: this number is rendered next to a TrustScore and the
 * two must never disagree about what year it is.
 */
export function experienceYears(d: Pick<Doctor, "reg_year">, asOfYear: number): number | null {
  return d.reg_year ? Math.max(0, asOfYear - d.reg_year) : null;
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

/** ₹ with no decimals — consultation fees in Kerala are always whole rupees. */
export function formatFee(feeInr: number | null): string | null {
  return feeInr == null ? null : `₹${feeInr.toLocaleString("en-IN")}`;
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
