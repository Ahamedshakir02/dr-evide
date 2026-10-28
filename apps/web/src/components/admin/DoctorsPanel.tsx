"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ExternalLink, Eye, EyeOff, Search, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { SPECIALTIES, SPECIALTY_SLUGS, isSpecialtySlug } from "@dr-evide/core";
import type { AdminDoctor, AdminDoctorDetail } from "@dr-evide/db";
import { adminFetch, formatWhen, osmLink, parseCoords, VERIFICATION_SOURCE_LABELS } from "./client";
import {
  Banner,
  CoordsInput,
  Fact,
  VerificationFields,
  emptyVerification,
  verificationBody,
  type VerificationDraft,
} from "./shared";
import { splitList } from "../listing/fields";

/**
 * Every real doctor, and what an admin can do to one: edit the public fields,
 * verify or withdraw verification (both write provenance), hide or publish,
 * and delete on request.
 *
 * Review numbers are shown but never editable — they are a quarter of
 * TrustScore, and the API refuses them for that reason.
 */

const specialtyName = (s: string) => (isSpecialtySlug(s) ? SPECIALTIES[s].name : s);

export function DoctorsPanel({
  openId,
  onOpen,
  onClose,
}: {
  openId: number | null;
  onOpen: (id: number) => void;
  onClose: () => void;
}) {
  if (openId) return <DoctorDetail id={openId} onClose={onClose} />;
  return <DoctorList onOpen={onOpen} />;
}

function DoctorList({ onOpen }: { onOpen: (id: number) => void }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [verified, setVerified] = useState("");
  const [doctors, setDoctors] = useState<AdminDoctor[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query: string, st: string, ver: string) => {
    setError(null);
    const qs = new URLSearchParams({ status: st });
    if (query.trim()) qs.set("q", query.trim());
    if (ver) qs.set("verified", ver);
    const r = await adminFetch<{ doctors: AdminDoctor[] }>(`doctors?${qs}`);
    if (r.ok) setDoctors(r.data.doctors);
    else setError(r.error);
  }, []);

  // Filters apply at once; the search box waits for a pause in typing.
  useEffect(() => {
    const t = setTimeout(() => load(q, status, verified), q ? 250 : 0);
    return () => clearTimeout(t);
  }, [q, status, verified, load]);

  return (
    <div>
      <div className="adm-toolbar">
        <div className="adm-search">
          <Search size={16} aria-hidden="true" />
          <input
            className="sh-input"
            type="search"
            placeholder="Name, registration number, town or clinic"
            aria-label="Search doctors"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select className="sh-select adm-select" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Published and hidden</option>
          <option value="published">Published</option>
          <option value="hidden">Hidden</option>
        </select>
        <select
          className="sh-select adm-select"
          aria-label="Verification"
          value={verified}
          onChange={(e) => setVerified(e.target.value)}
        >
          <option value="">Verified or not</option>
          <option value="true">Verified</option>
          <option value="false">Not verified</option>
        </select>
      </div>

      {error && <Banner kind="error">{error}</Banner>}
      {doctors === null && !error && <p className="sh-hint">Loading…</p>}
      {doctors?.length === 0 && (
        <p className="adm-empty">
          No doctors match. New doctors appear here when an application is approved, or when imported with{" "}
          <code>npm run db:import</code>.
        </p>
      )}

      {doctors && doctors.length > 0 && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th scope="col">Doctor</th>
                <th scope="col">Department</th>
                <th scope="col">Town</th>
                <th scope="col">Registration</th>
                <th scope="col">Status</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id}>
                  <td>
                    <button className="adm-linkbtn" onClick={() => onOpen(d.id)}>
                      {d.full_name}
                    </button>
                  </td>
                  <td>{specialtyName(d.specialty_slug)}</td>
                  <td>{d.town ?? "—"}</td>
                  <td>
                    <span className="sh-mono">{d.nmc_reg_no ?? "—"}</span>{" "}
                    {d.nmc_verified ? (
                      <span className="pill pill--verified">Verified</span>
                    ) : (
                      <span className="pill pill--unverified">Not verified</span>
                    )}
                  </td>
                  <td>
                    <span className={`adm-status adm-status--${d.status}`}>{d.status}</span>
                  </td>
                  <td className="adm-nowrap">{formatWhen(d.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {doctors.length === 500 && <p className="sh-hint">Showing the 500 most recently updated. Search to narrow.</p>}
        </div>
      )}
    </div>
  );
}

function DoctorDetail({ id, onClose }: { id: number; onClose: () => void }) {
  const [doctor, setDoctor] = useState<AdminDoctorDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "verify" | "unverify" | "delete">("view");

  const load = useCallback(async () => {
    const r = await adminFetch<{ doctor: AdminDoctorDetail }>(`doctors/${id}`);
    if (r.ok) {
      setDoctor(r.data.doctor);
      setError(null);
    } else setError(r.error);
  }, [id]);

  useEffect(() => {
    setDoctor(null);
    setMode("view");
    setFlash(null);
    load();
  }, [load]);

  function done(message: string) {
    setFlash(message);
    setMode("view");
    load();
  }

  const back = (
    <button className="link-back adm-linkbtn" onClick={onClose}>
      <ChevronLeft size={16} aria-hidden="true" /> All doctors
    </button>
  );

  if (!doctor) {
    return (
      <div>
        {back}
        {error ? <Banner kind="error">{error}</Banner> : <p className="sh-hint">Loading…</p>}
      </div>
    );
  }

  async function setStatus(status: "published" | "hidden") {
    const r = await adminFetch(`doctors/${id}/status`, { method: "POST", body: { status } });
    if (r.ok) done(status === "hidden" ? "Hidden. The profile no longer appears in search or at its URL." : "Published.");
    else setError(r.error);
  }

  const d = doctor;
  return (
    <div>
      {back}

      <header className="adm-detail__head">
        <div>
          <h2 className="adm-h2">{d.full_name}</h2>
          <p className="sh-hint">
            {specialtyName(d.specialty_slug)} · {d.town ?? "no town"} · added {formatWhen(d.created_at)}
          </p>
          <p className="adm-pills">
            {d.nmc_verified ? (
              <span className="pill pill--verified">Verified</span>
            ) : (
              <span className="pill pill--unverified">Not verified</span>
            )}
            <span className={`adm-status adm-status--${d.status}`}>{d.status}</span>
            {d.is_sample && <span className="pill pill--sample">Sample record</span>}
          </p>
        </div>
        {d.status === "published" && (
          <a className="sh-btn sh-btn--ghost sh-btn--sm" href={`/doctor/${d.id}`} target="_blank" rel="noopener noreferrer">
            Public profile <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </header>

      {flash && <Banner kind="ok">{flash}</Banner>}
      {error && <Banner kind="error">{error}</Banner>}

      {mode === "view" && (
        <div className="adm-actions adm-actions--bar">
          <button className="sh-btn sh-btn--secondary sh-btn--sm" onClick={() => setMode("edit")} disabled={d.is_sample}>
            Edit details
          </button>
          {d.nmc_verified ? (
            <button className="sh-btn sh-btn--secondary sh-btn--sm" onClick={() => setMode("unverify")} disabled={d.is_sample}>
              <ShieldOff size={16} aria-hidden="true" /> Withdraw verification
            </button>
          ) : (
            <button className="sh-btn sh-btn--secondary sh-btn--sm" onClick={() => setMode("verify")} disabled={d.is_sample}>
              <ShieldCheck size={16} aria-hidden="true" /> Verify registration
            </button>
          )}
          {d.status === "published" ? (
            <button className="sh-btn sh-btn--secondary sh-btn--sm" onClick={() => setStatus("hidden")}>
              <EyeOff size={16} aria-hidden="true" /> Hide
            </button>
          ) : (
            <button className="sh-btn sh-btn--secondary sh-btn--sm" onClick={() => setStatus("published")}>
              <Eye size={16} aria-hidden="true" /> Publish
            </button>
          )}
          <button className="sh-btn sh-btn--ghost sh-btn--sm adm-danger-text" onClick={() => setMode("delete")}>
            <Trash2 size={16} aria-hidden="true" /> Delete…
          </button>
        </div>
      )}
      {d.is_sample && (
        <p className="sh-hint">Sample records are fixtures, not people, and cannot be edited or verified here.</p>
      )}

      {mode === "edit" && <EditForm doctor={d} onCancel={() => setMode("view")} onDone={done} />}
      {mode === "verify" && <VerifyForm doctor={d} onCancel={() => setMode("view")} onDone={done} />}
      {mode === "unverify" && <UnverifyForm doctor={d} onCancel={() => setMode("view")} onDone={done} />}
      {mode === "delete" && <DeleteForm doctor={d} onCancel={() => setMode("view")} onDeleted={onClose} />}

      <div className="adm-detail__grid">
        <section>
          <h3 className="sh-eyebrow">Public details</h3>
          <dl className="adm-facts">
            <Fact label="Qualifications">{d.qualifications.join(", ")}</Fact>
            <Fact label="Highest level">{d.qualification_level}</Fact>
            <Fact label="Registration">
              <span className="sh-mono">{d.nmc_reg_no}</span>
              {d.reg_year ? ` · ${d.reg_year}` : ""}
            </Fact>
            <Fact label="Sub-specialties">{d.sub_specialties.length ? d.sub_specialties.join(", ") : null}</Fact>
            <Fact label="Conditions">{d.conditions.length ? d.conditions.join(", ") : null}</Fact>
            <Fact label="Clinic">{d.clinic_name}</Fact>
            <Fact label="Address">{d.address}</Fact>
            <Fact label="Phone">{d.phone}</Fact>
            <Fact label="Fee">{d.fee_inr !== null ? `₹${d.fee_inr}` : null}</Fact>
            <Fact label="Timings">{d.timings}</Fact>
            <Fact label="Location">
              <a href={osmLink(d)} target="_blank" rel="noopener noreferrer">
                {d.lat.toFixed(5)}, {d.lng.toFixed(5)} <ExternalLink size={11} aria-hidden="true" />
              </a>
            </Fact>
            <Fact label="Reviews">
              {d.review_count} (avg {d.review_avg ?? "—"}, authenticity {d.review_authenticity ?? "—"}) · not editable
            </Fact>
          </dl>
        </section>

        <section>
          <h3 className="sh-eyebrow">Verification record</h3>
          {d.provenance.length === 0 ? (
            <p className="sh-hint">Never verified.</p>
          ) : (
            <ol className="adm-timeline">
              {d.provenance.map((p, i) => (
                <li key={i}>
                  <strong>
                    {VERIFICATION_SOURCE_LABELS[p.source as keyof typeof VERIFICATION_SOURCE_LABELS] ?? p.source}
                  </strong>{" "}
                  · {formatWhen(p.verified_at)} · {p.verified_by}
                  {p.evidence_url && (
                    <>
                      {" · "}
                      <a href={p.evidence_url} target="_blank" rel="noopener noreferrer">
                        evidence <ExternalLink size={11} aria-hidden="true" />
                      </a>
                    </>
                  )}
                  {p.note && <div className="sh-hint">{p.note}</div>}
                </li>
              ))}
            </ol>
          )}

          <h3 className="sh-eyebrow">History</h3>
          {d.history.length === 0 ? (
            <p className="sh-hint">No admin changes yet.</p>
          ) : (
            <ol className="adm-timeline">
              {d.history.map((h, i) => (
                <li key={i}>
                  <strong>{h.action.replace(/^doctor\./, "")}</strong> · {formatWhen(h.created_at)} ·{" "}
                  {h.admin_name ?? "an admin"}
                  {typeof h.detail?.fields === "string" && <div className="sh-hint">fields: {h.detail.fields}</div>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

/** Edit form state: everything as the strings the inputs hold. */
function draftFrom(d: AdminDoctor) {
  return {
    full_name: d.full_name,
    specialty_slug: d.specialty_slug as string,
    qualifications: d.qualifications.join(", "),
    qualification_level: String(d.qualification_level),
    sub_specialties: d.sub_specialties.join(", "),
    conditions: d.conditions.join(", "),
    nmc_reg_no: d.nmc_reg_no ?? "",
    reg_year: d.reg_year === null ? "" : String(d.reg_year),
    clinic_name: d.clinic_name ?? "",
    address: d.address ?? "",
    town: d.town ?? "",
    phone: d.phone ?? "",
    fee_inr: d.fee_inr === null ? "" : String(d.fee_inr),
    timings: d.timings ?? "",
    coords: `${d.lat}, ${d.lng}`,
  };
}
type Draft = ReturnType<typeof draftFrom>;

/** The PATCH body: only what changed, in the API's types. */
function changes(before: Draft, after: Draft): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const list = (s: string) => splitList(s);
  const nullable = (s: string) => (s.trim() === "" ? null : s.trim());
  const num = (s: string) => (s.trim() === "" ? null : Number(s));
  for (const k of Object.keys(after) as (keyof Draft)[]) {
    if (after[k] === before[k]) continue;
    switch (k) {
      case "qualifications":
      case "sub_specialties":
      case "conditions":
        out[k] = list(after[k]);
        break;
      case "qualification_level":
        out[k] = Number(after[k]);
        break;
      case "reg_year":
      case "fee_inr":
        out[k] = num(after[k]);
        break;
      case "phone":
        out[k] = nullable(after[k]);
        break;
      case "coords": {
        const c = parseCoords(after.coords);
        out.lat = c?.lat ?? NaN;
        out.lng = c?.lng ?? NaN;
        break;
      }
      default:
        out[k] = after[k].trim();
    }
  }
  return out;
}

function EditForm({
  doctor,
  onCancel,
  onDone,
}: {
  doctor: AdminDoctor;
  onCancel: () => void;
  onDone: (m: string) => void;
}) {
  const [initial] = useState(() => draftFrom(doctor));
  const [draft, setDraft] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setDraft({ ...draft, [k]: e.target.value });

  const regChanged = draft.nmc_reg_no.trim() !== initial.nmc_reg_no;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = changes(initial, draft);
    if (Object.keys(body).length === 0) {
      onCancel();
      return;
    }
    if ("lat" in body && Number.isNaN(body.lat)) {
      setFields({ lat: "Couldn't read coordinates." });
      return;
    }
    setBusy(true);
    setError(null);
    setFields({});
    const r = await adminFetch(`doctors/${doctor.id}`, { method: "PATCH", body });
    setBusy(false);
    if (r.ok) {
      onDone(regChanged && doctor.nmc_verified ? "Saved. The registration number changed, so verification was cleared." : "Saved.");
    } else {
      setError(r.error);
      setFields(r.fields);
    }
  }

  const input = (k: keyof Draft, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="sh-field">
      <label className="sh-label" htmlFor={`ed-${k}`}>
        {label}
      </label>
      <input
        id={`ed-${k}`}
        className="sh-input"
        value={draft[k]}
        onChange={set(k)}
        aria-invalid={fields[k] ? true : undefined}
        {...extra}
      />
      {fields[k] && <p className="sh-hint sh-hint--error">{fields[k]}</p>}
    </div>
  );

  return (
    <form className="adm-form" onSubmit={submit}>
      <h3 className="adm-form__title">Edit details</h3>
      <div className="adm-grid2">
        {input("full_name", "Full name", { required: true, maxLength: 120 })}
        <div className="sh-field">
          <label className="sh-label" htmlFor="ed-specialty">
            Department
          </label>
          <select id="ed-specialty" className="sh-select" value={draft.specialty_slug} onChange={set("specialty_slug")}>
            {SPECIALTY_SLUGS.map((s) => (
              <option key={s} value={s}>
                {SPECIALTIES[s].name}
              </option>
            ))}
          </select>
        </div>
        {input("qualifications", "Qualifications (comma-separated)", { required: true })}
        <div className="sh-field">
          <label className="sh-label" htmlFor="ed-level">
            Highest level
          </label>
          <select id="ed-level" className="sh-select" value={draft.qualification_level} onChange={set("qualification_level")}>
            <option value="1">1 · MBBS / BDS</option>
            <option value="2">2 · PG diploma</option>
            <option value="3">3 · MD / MS / MDS / DNB</option>
            <option value="4">4 · DM / MCh / super-specialty</option>
          </select>
        </div>
        {input("nmc_reg_no", "Registration number", { required: true, maxLength: 30 })}
        {input("reg_year", "Year registered", { inputMode: "numeric", maxLength: 4 })}
        {input("sub_specialties", "Sub-specialties (comma-separated)")}
        {input("conditions", "Conditions (comma-separated)")}
        {input("clinic_name", "Clinic", { maxLength: 120 })}
        {input("town", "Town", { maxLength: 60 })}
        {input("address", "Address", { maxLength: 300 })}
        {input("phone", "Phone", { type: "tel", maxLength: 20 })}
        {input("fee_inr", "Fee (₹)", { inputMode: "numeric", maxLength: 6 })}
        {input("timings", "Timings", { maxLength: 200 })}
      </div>
      <CoordsInput value={draft.coords} onChange={(v) => setDraft({ ...draft, coords: v })} error={fields.lat ?? fields.lng} />

      {regChanged && doctor.nmc_verified && (
        <p className="adm-warn" role="status">
          Changing the registration number clears verification. Verify the new number afterwards.
        </p>
      )}
      {error && <Banner kind="error">{error}</Banner>}
      <div className="adm-actions">
        <button className="sh-btn sh-btn--primary sh-btn--sm" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function VerifyForm({
  doctor,
  onCancel,
  onDone,
}: {
  doctor: AdminDoctor;
  onCancel: () => void;
  onDone: (m: string) => void;
}) {
  const [v, setV] = useState<VerificationDraft>(emptyVerification);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await adminFetch(`doctors/${doctor.id}/verify`, { method: "POST", body: verificationBody(v) });
    setBusy(false);
    if (r.ok) onDone("Verified. The evidence link is on the record.");
    else {
      setError(r.error);
      setFields(r.fields);
    }
  }

  return (
    <form className="adm-form" onSubmit={submit}>
      <h3 className="adm-form__title">Verify registration</h3>
      <VerificationFields value={v} onChange={setV} regNo={doctor.nmc_reg_no} fields={fields} />
      {error && <Banner kind="error">{error}</Banner>}
      <div className="adm-actions">
        <button className="sh-btn sh-btn--primary sh-btn--sm" disabled={busy || !v.evidence_url.trim()}>
          {busy ? "Saving…" : "Mark verified"}
        </button>
        <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function UnverifyForm({
  doctor,
  onCancel,
  onDone,
}: {
  doctor: AdminDoctor;
  onCancel: () => void;
  onDone: (m: string) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await adminFetch(`doctors/${doctor.id}/unverify`, { method: "POST", body: { note: note.trim() } });
    setBusy(false);
    if (r.ok) onDone("Verification withdrawn. The earlier record stays in the history.");
    else setError(r.fields.note ?? r.error);
  }

  return (
    <form className="adm-form" onSubmit={submit}>
      <h3 className="adm-form__title">Withdraw verification</h3>
      <div className="sh-field">
        <label className="sh-label" htmlFor="unverify-note">
          Why
        </label>
        <input
          id="unverify-note"
          className="sh-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={500}
          required
        />
      </div>
      {error && <Banner kind="error">{error}</Banner>}
      <div className="adm-actions">
        <button className="sh-btn sh-btn--danger sh-btn--sm" disabled={busy || note.trim().length < 3}>
          {busy ? "Saving…" : "Withdraw verification"}
        </button>
        <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Permanent removal, for a doctor who asked to be taken off. Asks twice: once
 * by opening this form, and again by typing the name, so a slip of the mouse
 * on the wrong row cannot delete someone.
 */
function DeleteForm({
  doctor,
  onCancel,
  onDeleted,
}: {
  doctor: AdminDoctor;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matches = typed.trim() === doctor.full_name.trim();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!matches) return;
    setBusy(true);
    const r = await adminFetch(`doctors/${doctor.id}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) onDeleted();
    else setError(r.error);
  }

  return (
    <form className="adm-form adm-form--danger" onSubmit={submit}>
      <h3 className="adm-form__title">Delete permanently</h3>
      <p className="sh-hint">
        This removes the doctor, their verification record and their listing application. It cannot be undone. To
        take a profile down for now, use Hide instead.
      </p>
      <div className="sh-field">
        <label className="sh-label" htmlFor="delete-confirm">
          Type <strong>{doctor.full_name}</strong> to confirm
        </label>
        <input
          id="delete-confirm"
          className="sh-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {error && <Banner kind="error">{error}</Banner>}
      <div className="adm-actions">
        <button className="sh-btn sh-btn--danger sh-btn--sm" disabled={busy || !matches}>
          <Trash2 size={16} aria-hidden="true" /> {busy ? "Deleting…" : "Delete this doctor"}
        </button>
        <button type="button" className="sh-btn sh-btn--ghost sh-btn--sm" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </form>
  );
}
