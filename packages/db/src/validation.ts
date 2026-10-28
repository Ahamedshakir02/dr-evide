import { z } from "zod";
import { specialtySlugSchema } from "@dr-evide/core";

/**
 * Input schemas for the write paths: a doctor's listing application, and the
 * admin actions that turn one into a public profile.
 *
 * In this package rather than core because neither app's search runs them —
 * they are the boundary of the database, and every function that writes takes
 * their output, so a route that forgets to validate cannot reach SQL with a
 * raw body.
 */

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((s) => (s ? s : null));

const currentYear = () => new Date().getFullYear();

/** One @, something either side, a dot in the domain. See api/notify for why no stricter. */
export const emailSchema = z
  .string()
  .trim()
  .max(254)
  .regex(/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/, "Enter a valid email address.")
  .transform((s) => s.toLowerCase());

/** Indian numbers are written every way; digits, spaces, +, -, brackets. */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+0-9 ()-]{7,20}$/, "Enter a phone number with digits only.")
  .refine((s) => s.replace(/\D/g, "").length >= 7, "Enter a full phone number.");

/**
 * Registration numbers differ by council (TCMC, KMC, NMC); letters, digits and
 * the separators councils actually print. What it is never matters to the
 * code — a person checks it against the register before it is marked verified.
 */
export const regNoSchema = z
  .string()
  .trim()
  .min(3, "Enter your registration number.")
  .max(30)
  .regex(/^[A-Za-z0-9/.\- ]+$/, "Use only letters, digits, / . and -.");

const keywordList = (maxItems: number) =>
  z
    .array(text(60))
    .max(maxItems)
    .default([])
    .transform((xs) => [...new Set(xs.map((x) => x.toLowerCase()).filter(Boolean))]);

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .url()
  .refine((u) => /^https?:\/\//i.test(u), "Use an http(s) link.");

/** Bumped whenever the consent wording on /list-your-practice changes. */
export const CONSENT_VERSION = "2026-10-v1";

export const listingApplicationSchema = z.object({
  full_name: text(120).min(3, "Enter your full name as registered."),
  specialty_slug: specialtySlugSchema,
  qualifications: z
    .array(text(60).min(2))
    .min(1, "List at least one qualification, e.g. MBBS.")
    .max(10),
  qualification_level: z.coerce.number().int().min(1).max(4),
  nmc_reg_no: regNoSchema,
  registration_council: optionalText(120),
  reg_year: z.coerce
    .number()
    .int()
    .min(1950)
    .refine((y) => y <= currentYear(), "Registration year cannot be in the future.")
    .optional()
    .nullable()
    .transform((y) => y ?? null),
  clinic_name: optionalText(120),
  address: text(300).min(5, "Enter the clinic address."),
  town: text(60).min(2, "Enter the town."),
  phone: phoneSchema,
  fee_inr: z.coerce.number().int().min(0).max(100_000).optional().nullable().transform((n) => n ?? null),
  timings: optionalText(200),
  conditions: keywordList(20),
  map_link: httpUrl.optional().nullable().or(z.literal("")).transform((s) => s || null),
  contact_email: emailSchema,
  consent: z.literal(true, {
    errorMap: () => ({ message: "We can only list you with your consent." }),
  }),
});

export type ListingApplicationInput = z.infer<typeof listingApplicationSchema>;

export const VERIFICATION_SOURCES = ["nmc-registry", "state-council", "manual-review"] as const;

/**
 * Marking a registration verified. Needs a link to the public record that was
 * checked: "an admin said so" is not provenance.
 */
export const verificationSchema = z.object({
  source: z.enum(VERIFICATION_SOURCES),
  evidence_url: httpUrl,
  note: optionalText(500),
});

export type VerificationInput = z.infer<typeof verificationSchema>;

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

/**
 * The fields an admin may set on a doctor.
 *
 * Deliberately excludes review_count, review_avg and review_authenticity: they
 * are 25% of TrustScore, and a number a person can type into a form is a
 * number someone can be asked to change. Reviews come from a review pipeline
 * or not at all. nmc_verified is excluded too — it changes only through
 * verify/unverify, which write provenance.
 */
export const doctorEditSchema = z
  .object({
    full_name: text(120).min(3),
    specialty_slug: specialtySlugSchema,
    sub_specialties: keywordList(10),
    conditions: keywordList(20),
    qualifications: z.array(text(60).min(2)).min(1).max(10),
    qualification_level: z.coerce.number().int().min(1).max(4),
    nmc_reg_no: regNoSchema,
    reg_year: z.coerce.number().int().min(1950).max(currentYear()).nullable(),
    clinic_name: optionalText(120),
    address: optionalText(300),
    town: optionalText(60),
    phone: phoneSchema.nullable(),
    fee_inr: z.coerce.number().int().min(0).max(100_000).nullable(),
    timings: optionalText(200),
    lat: latitude,
    lng: longitude,
  })
  .partial()
  .strict();

export type DoctorEditInput = z.infer<typeof doctorEditSchema>;

/**
 * Approving an application. An admin must place the clinic on the map — a
 * doctor's typed address does not geocode reliably in rural Kerala, and a pin
 * in the wrong town is a wrong distance on every search. Any field the admin
 * corrected is passed in `edits`.
 */
export const approvalSchema = z.object({
  lat: latitude,
  lng: longitude,
  edits: doctorEditSchema.omit({ lat: true, lng: true }).default({}),
  verification: verificationSchema.nullable().default(null),
  note: optionalText(500),
});

export type ApprovalInput = z.infer<typeof approvalSchema>;

export const rejectionSchema = z.object({
  note: text(500).min(3, "Say why, so the doctor can be told."),
});

export const unverifySchema = z.object({
  note: text(500).min(3, "Say why the registration is no longer treated as verified."),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
});
