"use client";

import { CircleCheck } from "lucide-react";
import {
  describeScore,
  haversineKm,
  scoreOne,
  type Doctor,
  type SpecialtySlug,
} from "@dr-evide/core";
import { TrustRing } from "./TrustRing";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { useSearchContext } from "@/lib/hooks";
import { useLang } from "@/lib/lang";

/**
 * "Why this doctor ranks here", computed in the browser.
 *
 * This used to be server-rendered from `?conditions=…&lat=…&lng=…` on the URL —
 * which is how a health complaint and a precise location ended up in browser
 * history and every access log in front of the app. The search now lives in
 * sessionStorage, so the component that needs it has to be a client one.
 *
 * That is a smaller change than it looks, because scoring is a pure function
 * with no clock, network or environment access: `scoreOne` produces the same
 * number here that it produces inside /api/doctors, from the same inputs. The
 * card the person clicked and this panel cannot disagree.
 */
export function ProfileScore({
  doctor,
  specialty,
}: {
  doctor: Doctor;
  specialty: SpecialtySlug;
}) {
  const ctx = useSearchContext(specialty);
  const { t } = useLang();

  /**
   * One clock reading, shared with the "N years" line on the header above, so
   * the score and the experience figure can never disagree about the year.
   */
  const asOfYear = new Date().getFullYear();

  const distance_km = haversineKm(ctx.lat, ctx.lng, doctor.lat, doctor.lng);
  const { trust_score, score_breakdown } = scoreOne(
    { ...doctor, distance_km },
    { matchedConditions: ctx.conditions, radiusKm: ctx.radiusKm, asOfYear }
  );
  const { band } = describeScore(score_breakdown, {
    hasMatchedConditions: ctx.conditions.length > 0,
  });

  return (
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
        {/* The mock reads "Why she ranks here". Doctor records carry no gender,
            so this stays neutral rather than guessing. */}
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17 }}>
          {t.whyRanksHere}
        </span>
        <div className="doc-card__score">
          <TrustRing score={trust_score} size={58} showDenominator />
          <span className={`score-band score-band--${band}`}>{t.bands[band]}</span>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 16px" }}>
        {t.whyRanksBlurb}
      </p>

      <ScoreBreakdown breakdown={score_breakdown} />

      <div
        className="pledge"
        style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}
      >
        <CircleCheck size={15} aria-hidden="true" />
        {t.noPaidPlacement}
      </div>
    </div>
  );
}

/**
 * "· 3.4 km" in the action card.
 *
 * Split out for the same reason as the panel above: the origin it measures from
 * is part of the search, and the search is no longer in the URL.
 */
export function ClinicDistance({
  doctor,
  specialty,
}: {
  doctor: Pick<Doctor, "lat" | "lng">;
  specialty: SpecialtySlug;
}) {
  const ctx = useSearchContext(specialty);
  return <>{haversineKm(ctx.lat, ctx.lng, doctor.lat, doctor.lng).toFixed(1)} km</>;
}
