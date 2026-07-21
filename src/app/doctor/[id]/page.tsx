import { ChevronLeft, CircleCheck, MapPin, Navigation, Phone } from "lucide-react";
import { DEFAULT_LOCATION, DEFAULT_RADIUS_KM, getDoctor } from "@/lib/db";
import { haversineKm, scoreOne } from "@/lib/ranking";
import { SPECIALTIES } from "@/lib/taxonomy";
import { directionsUrl, experienceYears, initials, telHref } from "@/lib/format";
import { TrustRing } from "@/components/TrustRing";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { CredentialRow } from "@/components/CredentialRow";
import { SamplePill, VerifiedPill } from "@/components/Badges";

interface Props {
  params: { id: string };
  searchParams: {
    specialty?: string;
    conditions?: string;
    lat?: string;
    lng?: string;
    radius?: string;
  };
}

export default async function DoctorPage({ params, searchParams }: Props) {
  const doctor = await getDoctor(parseInt(params.id, 10));

  if (!doctor) {
    return (
      <>
        <a className="link-back" href="/">
          <ChevronLeft size={16} aria-hidden="true" /> Back to search
        </a>
        <p className="empty-state">Doctor not found.</p>
      </>
    );
  }

  // Reproduce the search context the results page ranked under, so the ring
  // here shows exactly the number shown on the card that was clicked.
  const lat = parseFloat(searchParams.lat ?? "") || DEFAULT_LOCATION.lat;
  const lng = parseFloat(searchParams.lng ?? "") || DEFAULT_LOCATION.lng;
  const radiusKm = parseFloat(searchParams.radius ?? "") || DEFAULT_RADIUS_KM;
  const conditions = (searchParams.conditions ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const distance_km = haversineKm(lat, lng, doctor.lat, doctor.lng);
  const { trust_score, score_breakdown } = scoreOne(
    { ...doctor, distance_km },
    conditions,
    radiusKm
  );

  const years = experienceYears(doctor);
  const specialty = SPECIALTIES[doctor.specialty_slug];

  const backParams = new URLSearchParams({
    specialty: searchParams.specialty ?? doctor.specialty_slug,
  });
  if (searchParams.conditions) backParams.set("conditions", searchParams.conditions);

  const actions = (
    <>
      {doctor.phone && (
        <a className="sh-btn sh-btn--primary sh-btn--lg" href={telHref(doctor.phone)}>
          <Phone size={20} aria-hidden="true" />
          Call clinic
        </a>
      )}
      <a
        className="sh-btn sh-btn--secondary sh-btn--lg"
        href={directionsUrl(doctor.lat, doctor.lng)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Navigation size={20} aria-hidden="true" />
        Directions
      </a>
    </>
  );

  return (
    <>
      <a className="link-back" href={`/results?${backParams.toString()}`}>
        <ChevronLeft size={16} aria-hidden="true" /> Back to results
      </a>

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
              <div style={{ fontSize: 15, color: "var(--text-muted)", marginBottom: 8 }}>
                {specialty.name}
                {doctor.qualifications.length > 0 && ` · ${doctor.qualifications.join(", ")}`}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <VerifiedPill verified={doctor.nmc_verified} regNo={doctor.nmc_reg_no} />
                {doctor.is_sample && <SamplePill />}
              </div>
            </div>
          </div>

          {/* ── Quick facts — structural panels, kept sharp ──── */}
          <div className="quickfacts" style={{ marginBottom: 18 }}>
            <div className="quickfact">
              <div className="quickfact__value">
                {distance_km.toFixed(1)}
                <span>km</span>
              </div>
              <div className="sh-eyebrow" style={{ fontSize: 10, marginTop: 3 }}>
                {doctor.town ?? "Distance"}
              </div>
            </div>
            <div className="quickfact">
              <div className="quickfact__value">
                {doctor.fee_inr !== null ? `₹${doctor.fee_inr}` : "—"}
              </div>
              <div className="sh-eyebrow" style={{ fontSize: 10, marginTop: 3 }}>
                Consult
              </div>
            </div>
            <div className="quickfact">
              <div className="quickfact__value">{years ?? "—"}</div>
              <div className="sh-eyebrow" style={{ fontSize: 10, marginTop: 3 }}>
                Years
              </div>
            </div>
          </div>

          {/* ── Why this doctor ranks here ───────────────────── */}
          <div className="sh-card" style={{ padding: 20, marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 4,
              }}
            >
              {/* The mock reads "Why she ranks here". Doctor records carry no
                  gender, so this stays neutral rather than guessing. */}
              <span
                style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}
              >
                Why this doctor ranks here
              </span>
              <TrustRing score={trust_score} size={58} showDenominator />
            </div>
            <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
              TrustScore is built from five signals we can verify. Nothing here is editable by
              the doctor or by us.
            </p>

            <ScoreBreakdown breakdown={score_breakdown} />

            <div
              className="pledge"
              style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}
            >
              <CircleCheck size={15} aria-hidden="true" />
              No paid placement. Ever.
            </div>
          </div>

          {/* ── Credentials ──────────────────────────────────── */}
          <div className="sh-eyebrow" style={{ marginBottom: 10 }}>
            Credentials
          </div>
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
              <div className="sh-eyebrow" style={{ margin: "20px 0 10px" }}>
                Commonly treats
              </div>
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

        {/* ── Desktop action card ────────────────────────────── */}
        <div className="action-card only-desktop">
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
                {doctor.fee_inr !== null ? `₹${doctor.fee_inr}` : "—"}
              </span>
              <span style={{ fontSize: 13, color: "var(--text-faint)" }}>clinic consult</span>
            </div>
            <div className="meta-item" style={{ marginBottom: 20 }}>
              <MapPin size={15} aria-hidden="true" />
              {doctor.clinic_name ?? "Clinic"}
              {doctor.town ? `, ${doctor.town}` : ""} · {distance_km.toFixed(1)} km
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{actions}</div>

            {doctor.timings && (
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                <div className="sh-eyebrow" style={{ marginBottom: 8 }}>
                  Timings
                </div>
                <div style={{ fontSize: 14, color: "var(--text-muted)" }}>{doctor.timings}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile action bar ────────────────────────────────── */}
      <div className="action-bar only-mobile">{actions}</div>
    </>
  );
}
