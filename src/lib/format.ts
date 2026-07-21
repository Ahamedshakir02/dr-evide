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

/** Years since NMC registration — the experience proxy used by ranking. */
export function experienceYears(d: Pick<Doctor, "reg_year">): number | null {
  return d.reg_year ? Math.max(0, new Date().getFullYear() - d.reg_year) : null;
}

export function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}
