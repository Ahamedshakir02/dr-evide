import raw from "./sample-doctors.json";
import type { Doctor } from "./types";

/**
 * The bundled fallback dataset — 20 fictional doctors at real locations around
 * Edappal.
 *
 * One copy, imported by the web app (when DATABASE_URL is unset), the mobile
 * app (when the server is unreachable), and the seed script. v1 kept three
 * copies of this file.
 *
 * Every record is `is_sample: true` and every name carries "(SAMPLE)". Nothing
 * here describes a real person, and nothing here may be presented as if it did.
 *
 * The cast is checked, not assumed: data.test.ts parses every record through
 * doctorSchema, so a malformed edit fails CI rather than production.
 */
export const SAMPLE_DOCTORS = raw.doctors as Doctor[];

export const SAMPLE_DATA_NOTE = raw._note;
