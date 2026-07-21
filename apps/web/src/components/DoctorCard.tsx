import { ChevronRight, IndianRupee, MapPin } from "lucide-react";
import {
  SPECIALTIES,
  experienceYears,
  formatDistance,
  initials,
  type RankedDoctor,
} from "@dr-evide/core";
import { TrustRing } from "./TrustRing";
import { SamplePill, VerifiedPill } from "./Badges";

interface Props {
  doctor: RankedDoctor;
  href: string;
  /** The year the score was computed against — see as_of_year on /api/doctors. */
  asOfYear: number;
}

/**
 * Result row (Dr Evide.dc.html:194-219 / Dr Evide Web.dc.html:164-182).
 * Identical on both breakpoints apart from padding, which globals.css handles.
 */
export function DoctorCard({ doctor, href, asOfYear }: Props) {
  const years = experienceYears(doctor, asOfYear);
  return (
    <a className="sh-card sh-card--interactive doc-card" href={href}>
      <div className="doc-card__top">
        <div className="avatar-initials" style={{ width: 56, height: 56, fontSize: 20 }}>
          {initials(doctor.full_name)}
        </div>

        <div className="doc-card__body">
          <div className="doc-card__name">{doctor.full_name}</div>
          <div className="doc-card__sub">
            {SPECIALTIES[doctor.specialty_slug].name}
            {years !== null && ` · ${years} yrs`}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <VerifiedPill verified={doctor.nmc_verified} />
            {doctor.is_sample && <SamplePill />}
          </div>
        </div>

        <div style={{ textAlign: "center", flex: "none" }}>
          <TrustRing score={doctor.trust_score} size={56} />
          <div className="sh-eyebrow" style={{ fontSize: 10, marginTop: 4 }}>
            Trust
          </div>
        </div>
      </div>

      <div className="doc-card__foot">
        <span className="meta-item">
          <MapPin size={16} aria-hidden="true" />
          {formatDistance(doctor.distance_km)}
          {doctor.town ? ` · ${doctor.town}` : ""}
        </span>
        {doctor.fee_inr !== null && (
          <span className="meta-item">
            <IndianRupee size={16} aria-hidden="true" />
            <b className="sh-mono">{doctor.fee_inr.toLocaleString("en-IN")}</b>
          </span>
        )}
        <span className="doc-card__cta">
          View profile
          <ChevronRight size={16} aria-hidden="true" />
        </span>
      </div>
    </a>
  );
}
