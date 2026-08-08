import { experienceYears, specialtyText, type Doctor, type SpecialtySlug } from "@dr-evide/core";

/**
 * schema.org markup for a doctor profile.
 *
 * A `Physician` node is a public, machine-readable assertion that a named
 * person practises a named speciality at a named address. Search engines
 * republish it, aggregators scrape it, and nobody who reads it downstream ever
 * sees the page's own caveats. So this file is stricter than the page is:
 *
 *   - **A sample doctor produces no markup at all.** Every seeded record is
 *     fictional and carries "(SAMPLE)" in its name. A disclaimer banner is
 *     enough for a human looking at the page; it is worth nothing at all once
 *     the claim has been lifted out of the page as structured data. `null` is
 *     the only correct output here, and it is checked in test/.
 *   - **Credentials appear only when they have been verified.** `hasCredential`
 *     and the NMC registration number are the two fields that make a claim
 *     about a person rather than about a place. An unverified doctor still gets
 *     a node — their name, department and clinic are facts about a business
 *     location — but no assertion this product cannot stand behind.
 *   - **No `aggregateRating`, deliberately.** We hold review counts and averages,
 *     and emitting them would light up star ratings in search results, which is
 *     the single highest-value piece of markup on this page. Three reasons not
 *     to. The review data is third-party and its terms have not been reviewed
 *     (see the launch list). The number we show is an average multiplied by an
 *     authenticity factor, so the raw average is not what the page says and the
 *     adjusted one is not a rating anyone else would recognise. And TrustScore
 *     is not a rating at all — dressing a composite of credentials, experience
 *     and distance up as stars would strip out the explanation that makes it
 *     honest, which is the whole product.
 */

/**
 * Our departments, in schema.org's `MedicalSpecialty` vocabulary.
 *
 * A separate table rather than a field on SPECIALTIES: this is a website
 * concern — the app has no search results to rank in — and core is for what
 * both apps need. Kept honest by a test that fails when a department is added
 * here without a mapping, which is the drift that would otherwise sit unnoticed
 * until someone checked a rich-results report.
 */
export const SCHEMA_SPECIALTY: Record<SpecialtySlug, string> = {
  dermatology: "Dermatology",
  cardiology: "Cardiovascular",
  general: "PrimaryCare",
  dental: "Dentistry",
  ent: "Otolaryngologic",
  pediatrics: "Pediatric",
  orthopedics: "Musculoskeletal",
};

export interface PhysicianJsonLd {
  "@context": "https://schema.org";
  "@type": "Physician";
  [key: string]: unknown;
}

/**
 * Build the `Physician` node for a doctor, or `null` if this one must not be
 * published. Callers render the result inside a ld+json script tag; a `null`
 * means render nothing, never render an empty object.
 */
export function buildPhysicianJsonLd(
  doctor: Doctor,
  { siteUrl }: { siteUrl: string }
): PhysicianJsonLd | null {
  // The gate. Never publish a fictional person as a real one.
  if (doctor.is_sample) return null;

  const url = `${siteUrl}/doctor/${doctor.id}`;

  const node: PhysicianJsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    // A stable identity for the node, so a profile that moves host or gains a
    // trailing slash is still recognised as the same practitioner.
    "@id": url,
    url,
    name: doctor.full_name,
    medicalSpecialty: SCHEMA_SPECIALTY[doctor.specialty_slug],
    address: {
      "@type": "PostalAddress",
      ...(doctor.address ? { streetAddress: doctor.address } : {}),
      ...(doctor.town ? { addressLocality: doctor.town } : {}),
      addressRegion: "Kerala",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: doctor.lat,
      longitude: doctor.lng,
    },
  };

  if (doctor.clinic_name) {
    node.worksFor = { "@type": "MedicalOrganization", name: doctor.clinic_name };
  }

  if (doctor.phone) node.telephone = doctor.phone;

  /**
   * Credential claims, and only for a doctor whose registration has actually
   * been checked. `nmc_verified` is the proxy available on the row; the record
   * of who checked it, against what and when lives in `credential_provenance`,
   * and nothing may be published here that is not answerable there.
   */
  if (doctor.nmc_verified) {
    if (doctor.qualifications.length > 0) {
      node.hasCredential = doctor.qualifications.map((q) => ({
        "@type": "EducationalOccupationalCredential",
        credentialCategory: "degree",
        name: q,
      }));
    }
    if (doctor.nmc_reg_no) {
      node.identifier = {
        "@type": "PropertyValue",
        name: "NMC registration number",
        value: doctor.nmc_reg_no,
      };
    }
  }

  return node;
}

/**
 * The profile's `<title>`, minus the " · Dr Evide" the root layout's template
 * appends. Every profile shared one title before this, so a doctor's page and
 * the front page were indistinguishable in a search result.
 *
 * English, not the reader's language: the title is rendered on the server and
 * the language toggle is a client-side preference, so there is no correct
 * per-reader answer available here. English is also what the `specialties`
 * table stores, which keeps this consistent with the canonical name.
 *
 * The department name, not a practitioner noun — "Dermatology", not
 * "Dermatologist". The taxonomy has no practitioner nouns, and adding a
 * parallel set of them would mean inventing them in Malayalam too, for a
 * vocabulary only the website's `<title>` would ever read. Worth revisiting as
 * a deliberate taxonomy change if search demand justifies it; not worth
 * growing core sideways during an SEO pass.
 */
export function doctorTitle(doctor: Doctor): string {
  const specialty = specialtyText(doctor.specialty_slug, "en").name;
  return doctor.town
    ? `${doctor.full_name} — ${specialty} in ${doctor.town}`
    : `${doctor.full_name} — ${specialty}`;
}

/**
 * The profile's meta description.
 *
 * Assembled from what is actually on the row rather than a template with holes
 * in it — a description reading "MBBS,  · years' experience" is worse than a
 * shorter one. Clauses drop out entirely when the data behind them is missing.
 */
export function doctorDescription(doctor: Doctor, asOfYear: number): string {
  const specialty = specialtyText(doctor.specialty_slug, "en").name;
  const where = doctor.town ? ` in ${doctor.town}, Kerala` : " in Kerala";

  const facts: string[] = [];
  if (doctor.qualifications.length > 0) facts.push(doctor.qualifications.join(", "));

  const years = experienceYears(doctor, asOfYear);
  if (years !== null && years > 0) facts.push(`${years} years' experience`);

  if (doctor.clinic_name) {
    facts.push(doctor.clinic_name + (doctor.town ? `, ${doctor.town}` : ""));
  }

  const opening = `${doctor.full_name} practises ${specialty}${where}.`;
  const detail = facts.length > 0 ? ` ${facts.join(" · ")}.` : "";

  return `${opening}${detail} See verified credentials, consultation fee and directions on Dr Evide — doctors ranked by credentials, never by who paid.`;
}
