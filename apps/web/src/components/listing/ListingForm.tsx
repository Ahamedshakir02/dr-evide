"use client";

import { useRef, useState } from "react";
import { Check, Send } from "lucide-react";
import { SPECIALTY_SLUGS, SPECIALTIES } from "@dr-evide/core";
import { Field, splitList } from "./fields";

/**
 * The listing application form, posting to POST /api/listing-applications.
 *
 * Uncontrolled inputs read through FormData on submit, so a 400 leaves every
 * value where the doctor typed it and only the messages change. The server's
 * zod schema (packages/db/src/validation.ts) is the one set of rules; the
 * browser's own `required`/`maxLength` here are a courtesy, never the check.
 *
 * `website` is a honeypot. It is hidden from people and from screen readers,
 * skipped by the tab order, and filled by bots that fill everything. The
 * server answers a filled one as if it worked.
 */

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

/** Matches qualification_level in packages/db/schema.sql. */
const LEVELS = [
  { value: 1, label: "MBBS / BDS" },
  { value: 2, label: "Postgraduate diploma (e.g. DCH, DDVL, DLO)" },
  { value: 3, label: "MD / MS / MDS / DNB" },
  { value: 4, label: "DM / MCh / super-specialty" },
] as const;

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "saved" }
  | { kind: "duplicate" }
  | { kind: "error"; message: string; fields: Record<string, string> };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const numOrNull = (s: string) => (s === "" ? null : Number(s));

export function ListingForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const formRef = useRef<HTMLFormElement>(null);

  const fieldErrors = state.kind === "error" ? state.fields : {};

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState({ kind: "sending" });

    const body = {
      full_name: str(fd, "full_name"),
      specialty_slug: str(fd, "specialty_slug"),
      qualifications: splitList(str(fd, "qualifications")),
      qualification_level: Number(str(fd, "qualification_level")),
      nmc_reg_no: str(fd, "nmc_reg_no"),
      registration_council: str(fd, "registration_council"),
      reg_year: numOrNull(str(fd, "reg_year")),
      clinic_name: str(fd, "clinic_name"),
      address: str(fd, "address"),
      town: str(fd, "town"),
      phone: str(fd, "phone"),
      fee_inr: numOrNull(str(fd, "fee_inr")),
      timings: str(fd, "timings"),
      conditions: splitList(str(fd, "conditions")),
      map_link: str(fd, "map_link"),
      contact_email: str(fd, "contact_email"),
      consent: fd.get("consent") === "on",
      website: str(fd, "website"),
    };

    // The obvious gaps are caught here, with plain wording, before a request
    // is spent: the endpoint allows five submissions an hour, and its own
    // messages for an empty select or phone read as validator output.
    const missing = missingFields(body);
    if (Object.keys(missing).length > 0) {
      setState({ kind: "error", message: "Some fields need attention.", fields: missing });
      focusFirst(missing);
      return;
    }

    let res: Response;
    try {
      res = await fetch("/api/listing-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      setState({
        kind: "error",
        message: "We couldn't reach the server. Check your connection and try again — nothing you typed has been lost.",
        fields: {},
      });
      return;
    }

    const data = (await res.json().catch(() => ({}))) as {
      status?: string;
      error?: string;
      fields?: Record<string, string>;
    };

    if (res.status === 201 && data.status === "saved") {
      setState({ kind: "saved" });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (res.ok && data.status === "duplicate") {
      setState({ kind: "duplicate" });
      return;
    }

    const fields = normaliseFields(data.fields ?? {});
    let message = data.error ?? "Something went wrong. Please try again.";
    if (res.status === 503) {
      message = "Applications can't be accepted on this site right now. Please try again later.";
    }
    setState({ kind: "error", message, fields });

    focusFirst(fields);
  }

  /** Put the reader on the first thing to fix rather than at the bottom of a long form. */
  function focusFirst(fields: Record<string, string>) {
    const first = FIELD_ORDER.find((k) => fields[k]) ?? Object.keys(fields)[0];
    if (!first) return;
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
    });
  }

  if (state.kind === "saved") {
    return (
      <div className="sh-card lyp__done" role="status">
        <Check size={28} aria-hidden="true" className="lyp__done-icon" />
        <h2>Thank you. Your application is in.</h2>
        <p>
          A person will check your registration against the public register and
          review the details. We will email you at the address you gave when
          your listing is live, or if we need anything from you.
        </p>
        <p>Nothing you sent is public until then.</p>
      </div>
    );
  }

  const sending = state.kind === "sending";

  return (
    <form ref={formRef} className="lyp__form" onSubmit={submit} noValidate>
      {state.kind === "duplicate" && (
        <p className="lyp__notice" role="status">
          We already have a listing or an application waiting for review with
          this registration number. If something needs changing,{" "}
          {CONTACT_EMAIL ? (
            <a href={`mailto:${CONTACT_EMAIL}?subject=Dr%20Evide%20listing`}>email us</a>
          ) : (
            "email us"
          )}{" "}
          rather than applying again.
        </p>
      )}

      <fieldset className="lyp__group">
        <legend>You</legend>
        <Field name="full_name" label="Full name, as registered" error={fieldErrors.full_name}>
          {(p) => <input {...p} className="sh-input" required maxLength={120} autoComplete="name" />}
        </Field>
        <Field name="specialty_slug" label="Department" error={fieldErrors.specialty_slug}>
          {(p) => (
            <select {...p} className="sh-select" required defaultValue="">
              <option value="" disabled>
                Choose one
              </option>
              {SPECIALTY_SLUGS.map((s) => (
                <option key={s} value={s}>
                  {SPECIALTIES[s].name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field
          name="qualifications"
          label="Qualifications"
          hint="Separate with commas, e.g. MBBS, MD (Dermatology)"
          error={fieldErrors.qualifications}
        >
          {(p) => <input {...p} className="sh-input" required maxLength={600} />}
        </Field>
        <Field
          name="qualification_level"
          label="Highest qualification"
          error={fieldErrors.qualification_level}
        >
          {(p) => (
            <select {...p} className="sh-select" required defaultValue="1">
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </fieldset>

      <fieldset className="lyp__group">
        <legend>Registration</legend>
        <p className="sh-hint">
          We check this against the public register before your listing is
          marked verified.
        </p>
        <div className="lyp__row">
          <Field name="nmc_reg_no" label="Registration number" error={fieldErrors.nmc_reg_no}>
            {(p) => <input {...p} className="sh-input" required maxLength={30} />}
          </Field>
          <Field
            name="reg_year"
            label="Year registered"
            optional
            error={fieldErrors.reg_year}
          >
            {(p) => (
              <input
                {...p}
                className="sh-input"
                inputMode="numeric"
                pattern="[0-9]{4}"
                maxLength={4}
              />
            )}
          </Field>
        </div>
        <Field
          name="registration_council"
          label="Council"
          optional
          hint="e.g. Travancore-Cochin Medical Council, NMC, Kerala Dental Council"
          error={fieldErrors.registration_council}
        >
          {(p) => <input {...p} className="sh-input" maxLength={120} />}
        </Field>
      </fieldset>

      <fieldset className="lyp__group">
        <legend>Clinic</legend>
        <Field name="clinic_name" label="Clinic or hospital name" optional error={fieldErrors.clinic_name}>
          {(p) => <input {...p} className="sh-input" maxLength={120} autoComplete="organization" />}
        </Field>
        <Field name="address" label="Address" error={fieldErrors.address}>
          {(p) => <textarea {...p} className="sh-textarea" rows={2} required maxLength={300} />}
        </Field>
        <div className="lyp__row">
          <Field name="town" label="Town" error={fieldErrors.town}>
            {(p) => <input {...p} className="sh-input" required maxLength={60} />}
          </Field>
          <Field name="phone" label="Clinic phone" hint="Shown to patients" error={fieldErrors.phone}>
            {(p) => (
              <input {...p} className="sh-input" type="tel" required maxLength={20} autoComplete="tel" />
            )}
          </Field>
        </div>
        <Field
          name="map_link"
          label="Google Maps link to the clinic"
          optional
          hint="Helps us put the pin in the right place. Open the clinic in Google Maps, tap Share, and paste the link."
          error={fieldErrors.map_link}
        >
          {(p) => <input {...p} className="sh-input" type="url" inputMode="url" maxLength={500} />}
        </Field>
        <div className="lyp__row">
          <Field name="fee_inr" label="Consultation fee (₹)" optional error={fieldErrors.fee_inr}>
            {(p) => <input {...p} className="sh-input" inputMode="numeric" pattern="[0-9]*" maxLength={6} />}
          </Field>
          <Field
            name="timings"
            label="Timings"
            optional
            hint="e.g. Mon–Sat 9am–1pm, 5pm–8pm"
            error={fieldErrors.timings}
          >
            {(p) => <input {...p} className="sh-input" maxLength={200} />}
          </Field>
        </div>
        <Field
          name="conditions"
          label="Conditions you commonly treat"
          optional
          hint="Separate with commas, up to 20. Used to match what people describe."
          error={fieldErrors.conditions}
        >
          {(p) => <input {...p} className="sh-input" maxLength={1200} />}
        </Field>
      </fieldset>

      <fieldset className="lyp__group">
        <legend>Contact</legend>
        <Field
          name="contact_email"
          label="Your email"
          hint="Private. Used only to tell you about your listing."
          error={fieldErrors.contact_email}
        >
          {(p) => (
            <input
              {...p}
              className="sh-input"
              type="email"
              inputMode="email"
              required
              maxLength={254}
              autoComplete="email"
            />
          )}
        </Field>

        {/* Honeypot. Off-screen rather than display:none, which some bots check for. */}
        <div className="lyp__hp" aria-hidden="true">
          <label htmlFor="lyp-website">Website</label>
          <input id="lyp-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="sh-field">
          <label className="sh-check lyp__consent">
            <input
              type="checkbox"
              name="consent"
              required
              aria-invalid={fieldErrors.consent ? true : undefined}
              aria-describedby={fieldErrors.consent ? "consent-error" : undefined}
            />
            <span className="sh-check__box" aria-hidden="true">
              <Check size={14} />
            </span>
            <span>
              I am the doctor named above, and I consent to Dr Evide publishing
              the details in this form, except my email, on its website and
              app. I can ask for them to be corrected or removed at any time.
            </span>
          </label>
          {fieldErrors.consent && (
            <p className="sh-hint sh-hint--error" id="consent-error">
              {fieldErrors.consent}
            </p>
          )}
        </div>
      </fieldset>

      {state.kind === "error" && (
        <p className="lyp__error" role="alert">
          {state.message}
        </p>
      )}

      <button className="sh-btn sh-btn--primary sh-btn--lg" disabled={sending}>
        {sending ? "Sending…" : "Send application"}
        {!sending && <Send size={18} aria-hidden="true" />}
      </button>
      <p className="sh-hint">
        Ranking is never for sale. Nothing a doctor or anyone else pays for can
        change a position.
      </p>
    </form>
  );
}

/** Form order, so focus lands on the first problem a reader would meet. */
const FIELD_ORDER = [
  "full_name", "specialty_slug", "qualifications", "qualification_level", "nmc_reg_no",
  "reg_year", "registration_council", "clinic_name", "address", "town", "phone",
  "map_link", "fee_inr", "timings", "conditions", "contact_email", "consent",
];

/** Required fields left empty, each with the message a person would write. */
function missingFields(b: {
  full_name: string;
  specialty_slug: string;
  qualifications: string[];
  nmc_reg_no: string;
  address: string;
  town: string;
  phone: string;
  contact_email: string;
  consent: boolean;
}): Record<string, string> {
  const out: Record<string, string> = {};
  if (!b.full_name) out.full_name = "Enter your full name as registered.";
  if (!b.specialty_slug) out.specialty_slug = "Choose your department.";
  if (b.qualifications.length === 0) out.qualifications = "List at least one qualification, e.g. MBBS.";
  if (!b.nmc_reg_no) out.nmc_reg_no = "Enter your registration number.";
  if (!b.address) out.address = "Enter the clinic address.";
  if (!b.town) out.town = "Enter the town.";
  if (!b.phone) out.phone = "Enter the clinic phone number.";
  if (!b.contact_email) out.contact_email = "Enter your email address.";
  if (!b.consent) out.consent = "We can only list you with your consent.";
  return out;
}

/**
 * Server field messages, keyed by input. "qualifications.0" → "qualifications",
 * first message wins. A department zod rejects as an enum gets the same
 * wording as the local check, not "Invalid enum value. Expected …".
 */
function normaliseFields(fields: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    const key = k.split(".")[0] ?? k;
    out[key] ??= key === "specialty_slug" ? "Choose your department." : v;
  }
  return out;
}
