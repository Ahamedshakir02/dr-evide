"use client";

import { useId } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import {
  REGISTER_LINKS,
  VERIFICATION_SOURCE_LABELS,
  nearKerala,
  osmLink,
  parseCoords,
} from "./client";

/** Pieces both the review queue and the doctor editor use. */

export function Banner({ kind, children }: { kind: "error" | "ok"; children: React.ReactNode }) {
  return (
    <p className={kind === "error" ? "adm-error" : "adm-ok"} role={kind === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}

/**
 * One box for the clinic's position: "lat, lng" or a Google Maps link.
 *
 * Shows what it understood, with a link to check the pin on OpenStreetMap,
 * and a warning (not a block) when the point is nowhere near Kerala — a
 * swapped lat/lng lands in the Arabian Sea or Somalia, and is the mistake
 * this is most likely to catch.
 */
export function CoordsInput({
  value,
  onChange,
  error,
  label = "Clinic location",
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  label?: string;
}) {
  const id = useId();
  const parsed = parseCoords(value);
  return (
    <div className="sh-field">
      <label className="sh-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="sh-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="10.7812, 76.0123  or a Google Maps link"
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-hint`}
        spellCheck={false}
      />
      <p className="sh-hint" id={`${id}-hint`}>
        {parsed ? (
          <>
            <MapPin size={12} aria-hidden="true" /> {parsed.lat.toFixed(5)}, {parsed.lng.toFixed(5)} ·{" "}
            <a href={osmLink(parsed)} target="_blank" rel="noopener noreferrer">
              check the pin <ExternalLink size={11} aria-hidden="true" />
            </a>
            {!nearKerala(parsed) && (
              <strong className="adm-warn"> This is not near Kerala. Are latitude and longitude swapped?</strong>
            )}
          </>
        ) : value.trim() ? (
          "Couldn't read coordinates from that. In Google Maps, right-click the clinic and click the numbers to copy them."
        ) : (
          "In Google Maps, right-click the clinic and click the numbers to copy them, then paste here."
        )}
      </p>
      {error && <p className="sh-hint sh-hint--error">{error}</p>}
    </div>
  );
}

export interface VerificationDraft {
  source: keyof typeof VERIFICATION_SOURCE_LABELS;
  evidence_url: string;
  note: string;
}

/**
 * A blank verification, checked against the register the doctor named. A
 * state council registration (TCMC, KMC, a dental council) is not on the NMC
 * register, so defaulting to "NMC registry" for it pre-fills the wrong answer.
 */
export const emptyVerification = (council?: string | null): VerificationDraft => ({
  source: council && !/\b(nmc|national medical commission|mci)\b/i.test(council) ? "state-council" : "nmc-registry",
  evidence_url: "",
  note: "",
});

/**
 * Provenance for marking a registration verified. The API refuses a
 * verification without an evidence link, so the form asks for one up front
 * and says why.
 */
export function VerificationFields({
  value,
  onChange,
  regNo,
  fields,
}: {
  value: VerificationDraft;
  onChange: (v: VerificationDraft) => void;
  regNo?: string | null;
  fields: Record<string, string>;
}) {
  const id = useId();
  return (
    <div className="adm-verify">
      <p className="sh-hint">
        Look up {regNo ? <strong className="sh-mono">{regNo}</strong> : "the registration number"} on{" "}
        {REGISTER_LINKS.map((l, i) => (
          <span key={l.href}>
            {i > 0 && " or "}
            <a href={l.href} target="_blank" rel="noopener noreferrer">
              {l.label} <ExternalLink size={11} aria-hidden="true" />
            </a>
          </span>
        ))}
        , check the name matches, then paste the link to the record you checked.
      </p>
      <div className="adm-row">
        <div className="sh-field">
          <label className="sh-label" htmlFor={`${id}-src`}>
            Checked against
          </label>
          <select
            id={`${id}-src`}
            className="sh-select"
            value={value.source}
            onChange={(e) => onChange({ ...value, source: e.target.value as VerificationDraft["source"] })}
          >
            {Object.entries(VERIFICATION_SOURCE_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="sh-field adm-grow">
          <label className="sh-label" htmlFor={`${id}-url`}>
            Evidence link
          </label>
          <input
            id={`${id}-url`}
            className="sh-input"
            type="url"
            value={value.evidence_url}
            onChange={(e) => onChange({ ...value, evidence_url: e.target.value })}
            placeholder="https://…"
            aria-invalid={fields.evidence_url ? true : undefined}
          />
          {fields.evidence_url && <p className="sh-hint sh-hint--error">{fields.evidence_url}</p>}
        </div>
      </div>
      <div className="sh-field">
        <label className="sh-label" htmlFor={`${id}-note`}>
          Note <span className="field-optional">(optional)</span>
        </label>
        <input
          id={`${id}-note`}
          className="sh-input"
          value={value.note}
          onChange={(e) => onChange({ ...value, note: e.target.value })}
          maxLength={500}
        />
      </div>
    </div>
  );
}

export function verificationBody(v: VerificationDraft) {
  return { source: v.source, evidence_url: v.evidence_url.trim(), note: v.note.trim() || null };
}

/** A label/value pair in a details list. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="adm-fact">
      <dt>{label}</dt>
      <dd>{children ?? "—"}</dd>
    </div>
  );
}
