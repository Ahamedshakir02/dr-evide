import { cache } from "react";
import type { Metadata } from "next";
import { ChevronLeft, MapPin, Navigation, Phone } from "lucide-react";
import { notFound } from "next/navigation";
import {
  directionsUrl,
  experienceYears,
  formatFee,
  initials,
  isSpecialtySlug,
  telHref,
} from "@dr-evide/core";
import { getDoctor } from "@dr-evide/db";
import { SITE_URL } from "@/lib/site-url";
import {
  buildPhysicianJsonLd,
  doctorDescription,
  doctorTitle,
} from "@/lib/structured-data";
import { ClinicDistance, ProfileScore } from "@/components/ProfileScore";
import { CredentialRow } from "@/components/CredentialRow";
import { SamplePill, VerifiedPill } from "@/components/Badges";
import { SampleDataBanner } from "@/components/SampleDataBanner";
import { ExperienceYears, SpecialtyName, Txt } from "@/components/Txt";

/**
 * Doctor profile.
 *
 * Server-rendered for everything that describes the person — name, credentials,
 * fee, clinic, timings — and client-rendered for everything that depends on the
 * search that led here. That split is not stylistic: the search carries routed
 * condition keywords and a precise location, and those used to travel in the
 * query string. See lib/search-context.ts.
 */

// Next 15: params and searchParams are Promises and must be awaited.
interface Props {
  params: Promise<{ id: string }>;
  /** Only the specialty, which is a department rather than a complaint. */
  searchParams: Promise<{ specialty?: string }>;
}

/**
 * generateMetadata and the page body both need the doctor, and Next calls them
 * separately. React's `cache` collapses that to one query per request; without
 * it every profile view costs two identical round trips.
 */
const loadDoctor = cache(async (rawId: string) => {
  const id = parseInt(rawId, 10);
  return Number.isNaN(id) ? null : getDoctor(id);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const doctor = await loadDoctor(id);

  // notFound() belongs to the page, which renders the 404. Metadata for a
  // missing doctor only has to avoid inheriting the site-wide default and
  // announcing a person who is not there.
  if (!doctor) return { title: "Doctor not found" };

  const canonical = `/doctor/${doctor.id}`;
  const title = doctorTitle(doctor);
  const description = doctorDescription(doctor, new Date().getFullYear());

  return {
    title,
    description,
    /**
     * Canonical without the query string. `?specialty=` exists only to point
     * "back to results" at the right department — it changes no content, and
     * left unset it would split one profile into seven URLs competing with
     * each other.
     */
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}${canonical}`,
      type: "profile",
    },
    /**
     * Every seeded doctor is fictional. Indexing one would publish an invented
     * person, at a real-sounding clinic in a real town, into the results
     * someone gets for a genuine search — and the "Sample data" banner that
     * makes the page honest does not travel with the listing. The flag comes
     * off the row, so this stops applying the day real data is loaded rather
     * than when someone remembers to delete it.
     */
    robots: doctor.is_sample ? { index: false, follow: false } : undefined,
  };
}

export default async function DoctorPage(props: Props) {
  const [{ id: rawId }, searchParams] = await Promise.all([props.params, props.searchParams]);

  const doctor = await loadDoctor(rawId);

  // A missing doctor is a 404, not a page that renders "not found" with a 200.
  // Crawlers and monitoring both read the status code, never the copy.
  if (!doctor) notFound();

  const asOfYear = new Date().getFullYear();
  const years = experienceYears(doctor, asOfYear);

  /** Where "back to results" goes. Falls back to the doctor's own department. */
  const backSlug = isSpecialtySlug(searchParams.specialty)
    ? searchParams.specialty
    : doctor.specialty_slug;

  /** Null for every sample doctor — see lib/structured-data.ts. */
  const jsonLd = buildPhysicianJsonLd(doctor, { siteUrl: SITE_URL });

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // The content is built from typed fields and serialised by
          // JSON.stringify, never concatenated. `<` is escaped because a
          // clinic name containing "</script>" would otherwise close this
          // element early and put the rest of the row into the document.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}

      <a className="link-back" href={`/results?specialty=${backSlug}`}>
        <ChevronLeft size={16} aria-hidden="true" /> <Txt k="backToResults" />
      </a>

      {doctor.is_sample && (
        <div style={{ marginTop: 16 }}>
          <SampleDataBanner />
        </div>
      )}

      <div className="profile-grid" style={{ marginTop: 20 }}>
        <div>
          {/* ── Header ──────────────────────────────────────── */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 20 }}>
            <div className="avatar-initials" style={{ width: 76, height: 76, fontSize: 27 }}>
              {initials(doctor.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: 26,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                  margin: "0 0 4px",
                }}
              >
                {doctor.full_name}
              </h1>
              {/* "Dermatologist · MBBS, MD · 12 years" — Dr Evide Web.dc.html:275.
                  Years live here on the website, not in a quick-facts panel. */}
              <div style={{ fontSize: 16, color: "var(--text-muted)", marginBottom: 10 }}>
                <SpecialtyName slug={doctor.specialty_slug} />
                {doctor.qualifications.length > 0 && ` · ${doctor.qualifications.join(", ")}`}
                <ExperienceYears years={years} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <VerifiedPill verified={doctor.nmc_verified} regNo={doctor.nmc_reg_no} />
                {doctor.is_sample && <SamplePill />}
              </div>
            </div>
          </div>

          {/* The 3-up km / consult / years panels are the app's profile
              treatment (Dr Evide.dc.html:313-326). On the website those facts
              live in the action card to the right, as the web design has them. */}

          <ProfileScore doctor={doctor} specialty={doctor.specialty_slug} />

          {/* ── Credentials ──────────────────────────────────── */}
          <h2 className="sh-eyebrow" style={{ marginBottom: 10 }}>
            <Txt k="credentials" />
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {doctor.qualifications.map((q) => (
              <CredentialRow
                key={q}
                title={q}
                verified={doctor.nmc_verified}
                note={
                  doctor.nmc_verified
                    ? `Verified with NMC registry${doctor.reg_year ? ` · ${doctor.reg_year}` : ""}`
                    : "Awaiting NMC registry check"
                }
              />
            ))}
            {/* Sub-specialties are declared by the doctor, never registry-checked. */}
            {doctor.sub_specialties.map((s) => (
              <CredentialRow key={s} title={s} verified={false} />
            ))}
          </div>

          {doctor.conditions.length > 0 && (
            <>
              <h2 className="sh-eyebrow" style={{ margin: "20px 0 10px" }}>
                <Txt k="commonlyTreats" />
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {doctor.conditions.map((c) => (
                  <span key={c} className="sh-tag">
                    {c}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Action card — Dr Evide Web.dc.html:315-333 ──────────
            Sticky beside the content on wide screens, reflowing underneath it
            on narrow. The app's sticky bottom Directions/Call bar
            (Dr Evide.dc.html:395-404) stays in the app. */}
        <div className="action-card">
          <div className="sh-card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <span className="sh-mono" style={{ fontSize: 26, fontWeight: 700 }}>
                {formatFee(doctor.fee_inr) ?? "—"}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-faint)" }}>
                <Txt k="clinicConsult" />
              </span>
            </div>
            <div className="meta-item" style={{ marginBottom: 20 }}>
              <MapPin size={15} aria-hidden="true" />
              {doctor.clinic_name ?? "Clinic"}
              {doctor.town ? `, ${doctor.town}` : ""} ·{" "}
              <ClinicDistance doctor={doctor} specialty={doctor.specialty_slug} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {doctor.phone && (
                <a className="sh-btn sh-btn--primary sh-btn--lg" href={telHref(doctor.phone)}>
                  <Phone size={20} aria-hidden="true" />
                  <Txt k="callClinic" />
                </a>
              )}
              <a
                className="sh-btn sh-btn--secondary sh-btn--lg"
                href={directionsUrl(doctor.lat, doctor.lng)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation size={20} aria-hidden="true" />
                <Txt k="getDirections" />
              </a>
            </div>

            {doctor.timings && (
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                <h2 className="sh-eyebrow" style={{ marginBottom: 8 }}>
                  <Txt k="timings" />
                </h2>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{doctor.timings}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
