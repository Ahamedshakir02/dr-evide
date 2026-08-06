"use client";

import { ChevronRight, IndianRupee, MapPin } from "lucide-react";
import {
  describeScore,
  experienceYears,
  formatDistance,
  initials,
  specialtyText,
  type RankedDoctor,
} from "@dr-evide/core";
import { useLang } from "@/lib/lang";
import { TrustRing } from "./TrustRing";
import { SamplePill, VerifiedPill } from "./Badges";

interface Props {
  doctor: RankedDoctor;
  href: string;
  /** The year the score was computed against — see as_of_year on /api/doctors. */
  asOfYear: number;
  /**
   * Whether the search carried routed conditions. It changes the maximum the
   * score could have reached, so the qualitative label has to know about it.
   * See describeScore in @dr-evide/core.
   */
  hasMatchedConditions: boolean;
}

/**
 * Result row (Dr Evide.dc.html:194-219 / Dr Evide Web.dc.html:164-182).
 * Identical on both breakpoints apart from padding, which globals.css handles.
 */
export function DoctorCard({ doctor, href, asOfYear, hasMatchedConditions }: Props) {
  const { lang, t } = useLang();
  const years = experienceYears(doctor, asOfYear);
  const { band, strongest } = describeScore(doctor.score_breakdown, {
    hasMatchedConditions,
  });

  return (
    <a className="sh-card sh-card--interactive doc-card" href={href}>
      <div className="doc-card__top">
        <div className="avatar-initials" style={{ width: 56, height: 56, fontSize: 20 }}>
          {initials(doctor.full_name)}
        </div>

        <div className="doc-card__body">
          <div className="doc-card__name">{doctor.full_name}</div>
          <div className="doc-card__sub">
            {specialtyText(doctor.specialty_slug, lang).name}
            {years !== null && ` · ${years} ${t.years}`}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <VerifiedPill verified={doctor.nmc_verified} />
            {doctor.is_sample && <SamplePill />}
          </div>
        </div>

        {/*
          The ring on its own is unanchored: a bare "74" tells nobody whether
          that is unusually good or barely adequate, and the arc reads as a share
          of a 100 that is not actually reachable. The word underneath does the
          anchoring. It is derived from the same breakdown and never feeds the
          sort — see describeScore.
        */}
        <div className="doc-card__score">
          <TrustRing score={doctor.trust_score} size={56} />
          <span className={`score-band score-band--${band}`}>{t.bands[band]}</span>
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
          {t.viewProfile}
          <ChevronRight size={16} aria-hidden="true" />
        </span>
      </div>

      {/* One line of "why", so a number is never the only justification on
          screen. The full five-signal breakdown lives on the profile. */}
      <div className="doc-card__why">
        {t.strongestSignal(t.weightLabels[strongest.key], strongest.value, strongest.max)}
      </div>
    </a>
  );
}
