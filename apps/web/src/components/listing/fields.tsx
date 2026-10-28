"use client";

import { useId } from "react";

/**
 * A labelled input with its hint and error, wired for screen readers.
 *
 * The control is passed as a render function so it receives the id, name and
 * aria attributes, and each form keeps full control over the element itself.
 * Shared by the listing form and the admin console.
 */
export interface FieldProps {
  id: string;
  name: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

export function Field({
  name,
  label,
  hint,
  error,
  optional,
  children,
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: (p: FieldProps) => React.ReactNode;
}) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errId = `${id}-err`;
  const describedBy = [hint && hintId, error && errId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="sh-field">
      <label className="sh-label" htmlFor={id}>
        {label}
        {optional && <span className="field-optional"> (optional)</span>}
      </label>
      {children({
        id,
        name,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {hint && (
        <p className="sh-hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="sh-hint sh-hint--error" id={errId}>
          {error}
        </p>
      )}
    </div>
  );
}

/** "MBBS, MD (Derm)" → ["MBBS", "MD (Derm)"]. Commas and new lines both separate. */
export function splitList(s: string): string[] {
  return s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter(Boolean);
}
