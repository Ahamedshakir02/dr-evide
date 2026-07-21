import { getDoctor } from "@/lib/db";
import { SPECIALTIES } from "@/lib/taxonomy";

export default async function DoctorPage({ params }: { params: { id: string } }) {
  const doctor = await getDoctor(parseInt(params.id, 10));

  if (!doctor) {
    return (
      <>
        <a className="back-link" href="/">← Back to search</a>
        <p className="empty-state">Doctor not found.</p>
      </>
    );
  }

  const experienceYears = doctor.reg_year
    ? new Date().getFullYear() - doctor.reg_year
    : null;

  return (
    <>
      <a className="back-link" href={`/results?specialty=${doctor.specialty_slug}`}>
        ← Back to results
      </a>
      <h1>{doctor.full_name}</h1>
      <p className="subtitle">
        {SPECIALTIES[doctor.specialty_slug]?.name}
        {doctor.sub_specialties.length > 0 && <> · {doctor.sub_specialties.join(", ")}</>}
      </p>
      <p>
        {doctor.nmc_verified ? (
          <span className="badge verified">NMC verified — Reg. {doctor.nmc_reg_no}</span>
        ) : (
          <span className="badge unverified">Credentials not yet verified</span>
        )}
        {doctor.is_sample && <span className="badge sample">Sample data — not a real person</span>}
      </p>

      <div className="profile-section">
        <h2>Credentials</h2>
        <dl>
          <dt>Qualifications</dt>
          <dd>{doctor.qualifications.join(", ")}</dd>
          {experienceYears !== null && (
            <>
              <dt>Experience</dt>
              <dd>{experienceYears}+ years (registered {doctor.reg_year})</dd>
            </>
          )}
          {doctor.conditions.length > 0 && (
            <>
              <dt>Commonly treats</dt>
              <dd>{doctor.conditions.join(", ")}</dd>
            </>
          )}
        </dl>
      </div>

      <div className="profile-section">
        <h2>Clinic</h2>
        <dl>
          <dt>Clinic</dt>
          <dd>{doctor.clinic_name ?? "—"}</dd>
          <dt>Address</dt>
          <dd>
            {doctor.address ?? "—"}
            {doctor.town ? `, ${doctor.town}` : ""}
          </dd>
          {doctor.timings && (
            <>
              <dt>Timings</dt>
              <dd>{doctor.timings}</dd>
            </>
          )}
          {doctor.fee_inr && (
            <>
              <dt>Consultation fee</dt>
              <dd>₹{doctor.fee_inr}</dd>
            </>
          )}
        </dl>
        <p style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {doctor.phone && (
            <a className="btn" href={`tel:${doctor.phone.replace(/\s/g, "")}`}>
              Call clinic
            </a>
          )}
          <a
            className="btn btn-secondary"
            href={`https://www.google.com/maps/dir/?api=1&destination=${doctor.lat},${doctor.lng}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Directions
          </a>
        </p>
      </div>

      <div className="profile-section">
        <h2>Reviews</h2>
        <p>
          <b>{doctor.review_avg.toFixed(1)} / 5</b> from {doctor.review_count} reviews
          {doctor.review_authenticity < 0.85 && (
            <>
              {" "}
              <span className="badge unverified">some reviews down-weighted as low-trust</span>
            </>
          )}
        </p>
      </div>
    </>
  );
}
