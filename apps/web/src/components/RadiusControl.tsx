"use client";

import { MapPin } from "lucide-react";
import { MAX_RADIUS_KM, MIN_RADIUS_KM, WEB_RADIUS_DEFAULT_KM } from "@dr-evide/core";
import { useLang } from "@/lib/lang";

/**
 * Radius toolbar — Dr Evide Web.dc.html:151-158.
 *
 * The website has one treatment: an inline toolbar that wraps on narrow
 * screens. The app's stacked card version (Dr Evide.dc.html:173-182) lives in
 * mobile/app/results.tsx and stays there.
 *
 * The bounds are re-exported from @dr-evide/core rather than declared here.
 * They used to be local constants, and the local default (5km) silently
 * disagreed with the one doctorSearchSchema applies (15km) — so the slider and
 * a bare API call searched different areas. See geo.ts.
 */

export const RADIUS_MIN = MIN_RADIUS_KM;
export const RADIUS_MAX = MAX_RADIUS_KM;
export const RADIUS_DEFAULT = WEB_RADIUS_DEFAULT_KM;

export function RadiusControl({
  radius,
  count,
  loading,
  onChange,
}: {
  radius: number;
  count: number;
  /** Suppresses the count while a search is in flight, so it never reads stale. */
  loading?: boolean;
  onChange: (km: number) => void;
}) {
  const { t } = useLang();
  return (
    <div className="sh-card radius-toolbar">
      <span className="radius-toolbar__label">
        <MapPin size={17} style={{ color: "var(--accent-text)" }} aria-hidden="true" />
        {t.within}{" "}
        <span className="sh-mono" style={{ color: "var(--accent-text)", fontWeight: 700 }}>
          {radius} km
        </span>
      </span>

      <input
        type="range"
        min={RADIUS_MIN}
        max={RADIUS_MAX}
        value={radius}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Search radius: ${radius} kilometres`}
        className="radius-toolbar__slider"
      />

      {/*
        aria-live, because this is the only feedback a screen reader gets that
        dragging the slider did anything — the list below is out of the reading
        order at that moment.
      */}
      <span className="radius-toolbar__count" aria-live="polite">
        {loading ? (
          t.searching
        ) : (
          <>
            <span className="sh-mono" style={{ fontWeight: 700, color: "var(--text)" }}>
              {count}
            </span>{" "}
            {t.doctorsFound(count)}
          </>
        )}
      </span>
    </div>
  );
}
