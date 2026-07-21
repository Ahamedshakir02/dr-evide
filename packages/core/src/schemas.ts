import { z } from "zod";
import { DEFAULT_LOCATION, DEFAULT_RADIUS_KM, MAX_RADIUS_KM, MIN_RADIUS_KM } from "./geo";
import { SPECIALTY_SLUGS } from "./taxonomy";
import type { SpecialtySlug } from "./types";

/**
 * Runtime validation for every boundary the product does not control: HTTP
 * query strings, JSON request bodies, model output, and database rows.
 *
 * TypeScript types are erased at runtime; a `Doctor` interface asserts nothing
 * about what a `SELECT *` actually returned. These schemas are what make the
 * types true.
 */

/**
 * The cast preserves the literal union: `z.enum` needs a non-empty tuple type,
 * and widening to `[string, ...string[]]` would make every parsed slug a plain
 * `string`, quietly defeating SpecialtySlug everywhere downstream.
 */
export const specialtySlugSchema = z.enum(
  SPECIALTY_SLUGS as [SpecialtySlug, ...SpecialtySlug[]]
);

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

/**
 * Query string for GET /api/doctors.
 *
 * Every field has a default, so a bare /api/doctors still returns something
 * useful (Edappal, 15km) rather than a 400. Radius is clamped rather than
 * rejected: a user dragging a slider should never be able to produce an error.
 */
export const doctorSearchSchema = z.object({
  specialty: specialtySlugSchema,
  lat: latitude.default(DEFAULT_LOCATION.lat),
  lng: longitude.default(DEFAULT_LOCATION.lng),
  radius: z.coerce
    .number()
    .catch(DEFAULT_RADIUS_KM)
    .transform((n) => Math.min(Math.max(n, MIN_RADIUS_KM), MAX_RADIUS_KM))
    .default(DEFAULT_RADIUS_KM),
  conditions: z
    .string()
    .default("")
    .transform((s) =>
      s
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12)
    ),
});

export type DoctorSearchInput = z.infer<typeof doctorSearchSchema>;

/**
 * Body for POST /api/route-symptom.
 *
 * Capped at 500 characters. This field is the most sensitive thing the product
 * handles — free-text symptoms are sensitive personal data under the DPDP Act
 * 2023 — so the cap is a storage-and-exposure limit, not a UX one.
 */
export const routeSymptomSchema = z.object({
  text: z.string().trim().min(3, "Please describe your problem in a few words.").max(500),
});

export const doctorIdSchema = z.coerce.number().int().positive();

/**
 * A doctor row, as it must look before it is scored or serialised.
 *
 * Applied to database rows too. PostGIS hands back a `geom` blob and Postgres
 * hands back numerics as strings; this schema is where those become the shape
 * the rest of the code claims they already are.
 */
export const doctorSchema = z.object({
  id: z.number().int(),
  full_name: z.string(),
  specialty_slug: specialtySlugSchema,
  sub_specialties: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  qualification_level: z.coerce.number().int().min(1).max(4).catch(1),
  nmc_reg_no: z.string().nullable().default(null),
  nmc_verified: z.boolean().default(false),
  reg_year: z.coerce.number().int().nullable().default(null),
  clinic_name: z.string().nullable().default(null),
  address: z.string().nullable().default(null),
  town: z.string().nullable().default(null),
  phone: z.string().nullable().default(null),
  fee_inr: z.coerce.number().int().nullable().default(null),
  timings: z.string().nullable().default(null),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  review_count: z.coerce.number().int().min(0).default(0),
  review_avg: z.coerce.number().min(0).max(5).default(0),
  review_authenticity: z.coerce.number().min(0).max(1).default(1),
  is_sample: z.boolean().default(false),
});

/**
 * What the routing model is allowed to return.
 *
 * The model is untrusted input. v1 called JSON.parse() on the response and read
 * fields off the result; anything malformed threw somewhere further down. Slugs
 * outside the taxonomy are dropped rather than failing the whole parse, so one
 * hallucinated department does not cost the user their other, valid one.
 */
export const llmRoutingSchema = z.object({
  emergency: z.boolean().default(false),
  specialties: z
    .array(
      z.object({
        slug: z.string(),
        reason: z.string().max(400),
      })
    )
    .default([])
    .transform((list) =>
      list
        .filter((s): s is { slug: SpecialtySlug; reason: string } =>
          (SPECIALTY_SLUGS as readonly string[]).includes(s.slug)
        )
        .slice(0, 2)
    ),
  matched_conditions: z
    .array(z.string())
    .default([])
    .transform((xs) => xs.map((x) => x.trim().toLowerCase()).filter(Boolean).slice(0, 12)),
});
