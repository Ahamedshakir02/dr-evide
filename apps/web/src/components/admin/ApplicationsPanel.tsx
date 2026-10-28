"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, RefreshCw, X } from "lucide-react";
import { SPECIALTIES, isSpecialtySlug } from "@dr-evide/core";
import type { ListingApplication } from "@dr-evide/db";
import { adminFetch, formatWhen, parseCoords } from "./client";
import {
  Banner,
  CoordsInput,
  Fact,
  VerificationFields,
  emptyVerification,
  verificationBody,
  type VerificationDraft,
} from "./shared";

/**
 * The review queue: listing applications from /list-your-practice.
 *
 * Pending ones come oldest first (the API orders them), because the doctor
 * who has waited longest should be answered first. Approving needs a map
 * position — the API will not create a doctor without one — and can verify
 * the registration in the same step if the reviewer has checked it.
 */
type Filter = "pending" | "approved" | "rejected" | "all";
const FILTERS: Filter[] = ["pending", "approved", "rejected", "all"];

export function ApplicationsPanel({ onOpenDoctor }: { onOpenDoctor: (id: number) => void }) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [apps, setApps] = useState<ListingApplication[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const r = await adminFetch<{ applications: ListingApplication[] }>(`applications?status=${filter}`);
    if (r.ok) setApps(r.data.applications);
    else setError(r.error);
  }, [filter]);

  useEffect(() => {
    setApps(null);
    load();
  }, [load]);

  function reviewed(message: string) {
    setFlash(message);
    load();
  }

  return (
    <div>
      <div className="adm-toolbar">
        <div className="adm-chips" role="group" aria-label="Show applications">
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`sh-btn sh-btn--sm ${filter === f ? "sh-btn--primary" : "sh-btn--secondary"}`}
              aria-pressed={filter === f}
              onClick={() => {
                setFlash(null);
                setFilter(f);
              }}
            >
              {f[0]!.toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <button className="sh-btn sh-btn--ghost sh-btn--sm" onClick={load}>
          <RefreshCw size={15} aria-hidden="true" /> Refresh
        </button>
      </div>

      {flash && <Banner kind="ok">{flash}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}

      {apps === null && !error && <p className="sh-hint">Loading…</p>}
      {apps?.length === 0 && (
        <p className="adm-empty">
          {filter === "pending" ? "Nothing waiting for review." : `No ${filter === "all" ? "" : filter + " "}applications.`}
        </p>
      )}

      <div className="adm-list">
        {apps?.map((a) => (
          <ApplicationCard key={a.id} app={a} onReviewed={reviewed} onOpenDoctor={onOpenDoctor} />
        ))}
      </div>
    </div>
  );
}

function ApplicationCard({
  app,
  onReviewed,
  onOpenDoctor,
}: {
  app: ListingApplication;
  onReviewed: (message: string) => void;
  onOpenDoctor: (id: number) => void;
}) {
  const [mode, setMode] = useState<"view" | "approve" | "reject">("view");
  const specialty = isSpecialtySlug(app.specialty_slug) ? SPECIALTIES[app.specialty_slug].name : app.specialty_slug;

  return (
    <article className="sh-card adm-card">
      <header className="adm-card__head">
        <div>
          <h2 className="adm-card__title">{app.full_name}</h2>
          <p className="sh-hint">
            {specialty} · {app.town} · applied {formatWhen(app.created_at)}
          </p>
        </div>
        <span className={`adm-status adm-status--${app.status}`}>{app.status}</span>
      </header>

      <dl className="adm-facts">
        <Fact label="Qualifications">{app.qualifications.join(", ")}</Fact>
        <Fact label="Highest level">{app.qualification_level}</Fact>
        <Fact label="Registration">
          <span className="sh-mono">{app.nmc_reg_no}</span>
          {app.registration_council ? ` · ${app.registration_council}` : ""}
          {app.reg_year ? ` · ${app.reg_year}` : ""}
        </Fact>
        <Fact label="Clinic">{app.clinic_name}</Fact>
        <Fact label="Address">{app.address}</Fact>
        <Fact label="Phone">
          <a href={`tel:${app.phone}`}>{app.phone}</a>
        </Fact>
        <Fact label="Fee">{app.fee_inr !== null ? `₹${app.fee_inr}` : null}</Fact>
        <Fact label="Timings">{app.timings}</Fact>
        <Fact label="Conditions">{app.conditions.length ? app.conditions.join(", ") : null}</Fact>
        <Fact label="Map link">
          {app.map_link ? (
            <a href={app.map_link} target="_blank" rel="noopener noreferrer">
              Open <ExternalLink size={11} aria-hidden="true" />
            </a>
          ) : null}
        </Fact>
        <Fact label="Contact (private)">
          <a href={`mailto:${app.contact_email}`}>{app.contact_email}</a>
        </Fact>
        <Fact label="Consent">version {app.consent_version}</Fact>
      </dl>

      {app.status !== "pending" && (
        <p className="sh-hint adm-reviewed">
          {app.status === "approved" ? "Approved" : "Rejected"} by {app.reviewed_by_name ?? "an admin"} on{" "}
          {formatWhen(app.reviewed_at)}
          {app.review_note ? ` — “${app.review_note}”` : ""}
          {app.doctor_id && (
            <>
              {" · "}
              <button className="adm-linkbtn" onClick={() => onOpenDoctor(app.doctor_id!)}>
                View doctor
              </button>
            </>
          )}
        </p>
      )}

      {app.status === "pending" && mode === "view" && (
        <div className="adm-actions">
          <button className="sh-btn sh-btn--primary sh-btn--sm" onClick={() => setMode("approve")}>
            <Check size={16} aria-hidden="true" /> Approve…
          </button>
          <button className="sh-btn sh-btn--secondary sh-btn--sm" onClick={() => setMode("reject")}>
            <X size={16} aria-hidden="true" /> Reject…
          </button>
        </div>
      )}

      {mode === "approve" && (
        <ApproveForm app={app} onCancel={() => setMode("view")} onDone={onReviewed} />
      )}
      {mode === "reject" && <RejectForm app={app} onCancel={() => setMode("view")} onDone={onReviewed} />}
    </article>
  );
}

function ApproveForm({
  app,
  onCancel,
  onDone,
}: {
  app: ListingApplication;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  // Pre-filled when the doctor's map link carries coordinates; the reviewer still has to look.
  const [coords, setCoords] = useState(() => {
    const c = parseCoords(app.map_link);
    return c ? `${c.lat}, ${c.lng}` : "";
  });
  const [verify, setVerify] = useState(false);
  const [v, setV] = useState<VerificationDraft>(emptyVerification);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = parseCoords(coords);
    if (!c) {
      setFields({ lat: "Place the clinic on the map: paste its coordinates or a Maps link that has them." });
      return;
    }
    setBusy(true);
    setError(null);
    setFields({});
    const r = await adminFetch<{ doctor_id: number }>(`applications/${app.id}/approve`, {
      method: "POST",
      body: {
        lat: c.lat,
        lng: c.lng,
        verification: verify ? verificationBody(v) : null,
        note: note.trim() || null,
      },
    });
    setBusy(false);
    if (r.ok) {
      onDone(`${app.full_name} approved and published${verify ? " as verified" : ""}.`);
      return;
    }
    setError(r.error);
    // The verification fields are nested under "verification" in the API's paths.
    setFields(r.fields.verification ? { evidence_url: r.fields.verification } : r.fields);
  }

  return (
    <form className="adm-form" onSubmit={submit}>
      <h3 className="adm-form__title">Approve and publish</h3>
      <CoordsInput value={coords} onChange={setCoords} error={fields.lat ?? fields.lng} />

      <label className="sh-check">
        <input type="checkbox" checked={verify} onChange={(e) => setVerify(e.target.checked)} />
        <span className="sh-check__box" aria-hidden="true">
          <Check size={14} />
        </span>
        <span>I have checked the registration against the public register</span>
      </label>
      {verify ? (
        <VerificationFields value={v} onChange={setV} regNo={app.nmc_reg_no} fields={fields} />
      ) : (
        <p className="sh-hint">
          Left unchecked, the doctor is listed as “not yet verified” and ranks lower until someone verifies them.
        </p>
      )}

      <div className="sh-field">
        <label className="sh-label" htmlFor={`approve-note-${app.id}`}>
          Note <span className="field-optional">(optional, internal)</span>
        </label>
        <input
          id={`approve-note-${app.id}`}
          className="sh-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
        />
      </div>

      {error && <Banner kind="error">{error}</Banner>}
      <div className="adm-actions">
        <button className="sh-btn sh-btn--primary sh-btn--sm" disabled={busy}>
          {busy ? "Publishing…" : "Approve and publish"}
        </button>
        <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function RejectForm({
  app,
  onCancel,
  onDone,
}: {
  app: ListingApplication;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await adminFetch(`applications/${app.id}/reject`, { method: "POST", body: { note: note.trim() } });
    setBusy(false);
    if (r.ok) onDone(`${app.full_name}'s application rejected. Remember to email them the reason.`);
    else setError(r.fields.note ?? r.error);
  }

  return (
    <form className="adm-form" onSubmit={submit}>
      <h3 className="adm-form__title">Reject</h3>
      <div className="sh-field">
        <label className="sh-label" htmlFor={`reject-note-${app.id}`}>
          Reason
        </label>
        <textarea
          id={`reject-note-${app.id}`}
          className="sh-textarea"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          required
        />
        <p className="sh-hint">
          Kept with the application, so whoever emails {app.contact_email} can tell them why.
        </p>
      </div>
      {error && <Banner kind="error">{error}</Banner>}
      <div className="adm-actions">
        <button className="sh-btn sh-btn--danger sh-btn--sm" disabled={busy || note.trim().length < 3}>
          {busy ? "Rejecting…" : "Reject application"}
        </button>
        <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
