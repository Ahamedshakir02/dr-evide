"use client";

import { MapPin } from "lucide-react";

export const RADIUS_MIN = 1;
/** Deviation: the mock caps at 15km. Edappal is rural and 15km can return
 *  nothing, so the ceiling is 25. */
export const RADIUS_MAX = 25;
export const RADIUS_DEFAULT = 5;

interface Props {
  radius: number;
  count: number;
  onChange: (km: number) => void;
  /** "card" = stacked (mobile), "toolbar" = inline (desktop). */
  variant?: "card" | "toolbar";
}

/** Radius picker — Dr Evide.dc.html:173-182 (card), Web:151-158 (toolbar). */
export function RadiusControl({ radius, count, onChange, variant = "card" }: Props) {
  const slider = (
    <input
      type="range"
      min={RADIUS_MIN}
      max={RADIUS_MAX}
      value={radius}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label={`Search radius: ${radius} kilometres`}
      style={{ width: "100%", flex: variant === "toolbar" ? 1 : undefined }}
    />
  );

  const within = (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontSize: variant === "toolbar" ? 15 : 14,
        fontWeight: 600,
        color: "var(--text)",
        whiteSpace: "nowrap",
      }}
    >
      <MapPin size={16} style={{ color: "var(--accent-text)" }} aria-hidden="true" />
      Within{" "}
      <span className="sh-mono" style={{ color: "var(--accent-text)", fontWeight: 700 }}>
        {radius} km
      </span>
    </span>
  );

  const found = (
    <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
      <span className="sh-mono" style={{ fontWeight: 700, color: "var(--text)" }}>
        {count}
      </span>{" "}
      {count === 1 ? "doctor" : "doctors"}
    </span>
  );

  if (variant === "toolbar") {
    return (
      <div className="sh-card radius-toolbar">
        {within}
        {slider}
        {found}
      </div>
    );
  }

  return (
    <div className="radius-card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        {within}
        {found}
      </div>
      {slider}
    </div>
  );
}
