"use client";

import { MapPin } from "lucide-react";

export const RADIUS_MIN = 1;
/** Deviation: the mock caps at 15km. Edappal is rural and 15km can return
 *  nothing, so the ceiling is 25. */
export const RADIUS_MAX = 25;
export const RADIUS_DEFAULT = 5;

/**
 * Radius toolbar — Dr Evide Web.dc.html:151-158.
 *
 * The website has one treatment: an inline toolbar that wraps on narrow
 * screens. The app's stacked card version (Dr Evide.dc.html:173-182) lives in
 * mobile/app/results.tsx and stays there.
 */
export function RadiusControl({
  radius,
  count,
  onChange,
}: {
  radius: number;
  count: number;
  onChange: (km: number) => void;
}) {
  return (
    <div className="sh-card radius-toolbar">
      <span className="radius-toolbar__label">
        <MapPin size={17} style={{ color: "var(--accent-text)" }} aria-hidden="true" />
        Within{" "}
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

      <span className="radius-toolbar__count">
        <span className="sh-mono" style={{ fontWeight: 700, color: "var(--text)" }}>
          {count}
        </span>{" "}
        {count === 1 ? "doctor" : "doctors"} found
      </span>
    </div>
  );
}
