import { doctorSchema, type CredentialProvenance, type Doctor } from "@dr-evide/core";
import { requirePool } from "./pool";
import { audit } from "./audit";
import {
  onDuplicateRegistration,
  withTransaction,
  writeProvenance,
  reviewerLabel,
  type Reviewer,
} from "./applications";
import type { DoctorEditInput, VerificationInput } from "./validation";

// ── Admin users and sessions ────────────────────────────────────────────────
//
// Hashing and token generation live in the web app (lib/admin-auth.ts), which
// owns the cookie. This module only stores what it is handed: a password hash
// it never interprets, and a token hash it never sees the token of.

export interface AdminUser {
  id: number;
  email: string;
  name: string;
}

export interface AdminCredentials extends AdminUser {
  password_hash: string;
  disabled: boolean;
}

export async function findAdminByEmail(email: string): Promise<AdminCredentials | null> {
  const { rows } = await requirePool().query(
    `SELECT id, email, name, password_hash, disabled FROM admin_users WHERE lower(email) = lower($1)`,
    [email]
  );
  return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
}

export async function createAdminSession(
  adminId: number,
  tokenHash: string,
  ttlMs: number
): Promise<void> {
  const p = requirePool();
  await p.query(
    `INSERT INTO admin_sessions (token_hash, admin_id, expires_at)
     VALUES ($1, $2, now() + make_interval(secs => $3))`,
    [tokenHash, adminId, ttlMs / 1000]
  );
  await p.query(`UPDATE admin_users SET last_login_at = now() WHERE id = $1`, [adminId]);
  // Housekeeping on the rare path rather than a cron nobody will set up.
  await p.query(`DELETE FROM admin_sessions WHERE expires_at < now()`);
}

/** The signed-in admin for a session token hash, or null if expired, unknown or disabled. */
export async function getAdminBySession(tokenHash: string): Promise<AdminUser | null> {
  const { rows } = await requirePool().query(
    `SELECT u.id, u.email, u.name
     FROM admin_sessions s JOIN admin_users u ON u.id = s.admin_id
     WHERE s.token_hash = $1 AND s.expires_at > now() AND u.disabled = false`,
    [tokenHash]
  );
  return rows[0] ? { ...rows[0], id: Number(rows[0].id) } : null;
}

export async function deleteAdminSession(tokenHash: string): Promise<void> {
  await requirePool().query(`DELETE FROM admin_sessions WHERE token_hash = $1`, [tokenHash]);
}

// ── Doctors, as an admin sees them ──────────────────────────────────────────

export type DoctorStatus = "published" | "hidden";

export interface AdminDoctor extends Doctor {
  status: DoctorStatus;
  created_at: string;
  updated_at: string;
}

export interface AuditEntry {
  action: string;
  admin_name: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface AdminDoctorDetail extends AdminDoctor {
  provenance: CredentialProvenance[];
  history: AuditEntry[];
}

const ADMIN_COLUMNS = `
  id, full_name, specialty_slug, sub_specialties, conditions, qualifications,
  qualification_level, nmc_reg_no, nmc_verified, reg_year, clinic_name,
  address, town, phone, fee_inr, timings, lat, lng,
  review_count, review_avg, review_authenticity, is_sample,
  status, created_at, updated_at
`;

function toAdminDoctor(r: Record<string, unknown>): AdminDoctor {
  return {
    ...doctorSchema.parse(r),
    status: r.status as DoctorStatus,
    created_at: new Date(r.created_at as string).toISOString(),
    updated_at: new Date(r.updated_at as string).toISOString(),
  };
}

export interface DoctorFilter {
  q?: string;
  status?: DoctorStatus | "all";
  verified?: boolean;
  includeSample?: boolean;
}

export async function listDoctorsForAdmin(f: DoctorFilter = {}): Promise<AdminDoctor[]> {
  const q = f.q?.trim() ? `%${f.q.trim().replace(/[%_\\]/g, "\\$&")}%` : null;
  const { rows } = await requirePool().query(
    `SELECT ${ADMIN_COLUMNS} FROM doctors
     WHERE ($1::text IS NULL OR full_name ILIKE $1 OR nmc_reg_no ILIKE $1 OR town ILIKE $1 OR clinic_name ILIKE $1)
       AND ($2 = 'all' OR status = $2)
       AND ($3::boolean IS NULL OR nmc_verified = $3)
       AND ($4::boolean OR is_sample = false)
     ORDER BY updated_at DESC
     LIMIT 500`,
    [q, f.status ?? "all", f.verified ?? null, f.includeSample ?? false]
  );
  return rows.map(toAdminDoctor);
}

export async function getDoctorForAdmin(id: number): Promise<AdminDoctorDetail | null> {
  const p = requirePool();
  const { rows } = await p.query(`SELECT ${ADMIN_COLUMNS} FROM doctors WHERE id = $1`, [id]);
  if (!rows[0]) return null;

  const [prov, hist] = await Promise.all([
    p.query(
      `SELECT doctor_id, source, evidence_url, verified_by, verified_at, note
       FROM credential_provenance WHERE doctor_id = $1 ORDER BY verified_at DESC, id DESC`,
      [id]
    ),
    p.query(
      `SELECT l.action, u.name AS admin_name, l.detail, l.created_at
       FROM admin_audit_log l LEFT JOIN admin_users u ON u.id = l.admin_id
       -- The approval that created the doctor is logged against the
       -- application, with the new doctor's id in detail; include it so the
       -- history starts where the doctor did.
       WHERE (l.target_type = 'doctor' AND l.target_id = $1)
          OR (l.target_type = 'application' AND l.action = 'application.approve'
              AND (l.detail->>'doctor_id')::int = $1)
       ORDER BY l.created_at DESC LIMIT 100`,
      [id]
    ),
  ]);

  return {
    ...toAdminDoctor(rows[0]),
    provenance: prov.rows.map((r) => ({
      ...r,
      doctor_id: Number(r.doctor_id),
      verified_at: new Date(r.verified_at).toISOString(),
    })),
    history: hist.rows.map((r) => ({ ...r, created_at: new Date(r.created_at).toISOString() })),
  };
}

export type DoctorWriteResult =
  | { status: "ok" }
  | { status: "not_found" }
  | { status: "duplicate_registration" }
  /** Sample records are fixtures, not people; the admin console does not edit them. */
  | { status: "sample" };

const EDITABLE = [
  "full_name", "specialty_slug", "sub_specialties", "conditions", "qualifications",
  "qualification_level", "nmc_reg_no", "reg_year", "clinic_name", "address", "town",
  "phone", "fee_inr", "timings", "lat", "lng",
] as const satisfies readonly (keyof DoctorEditInput)[];

/**
 * Edit a doctor's public fields.
 *
 * Changing the registration number clears verification in the same statement:
 * the provenance on file was for the old number, and a verified badge that
 * outlives the thing it verified is exactly the failure provenance exists to
 * prevent.
 */
export async function updateDoctor(
  id: number,
  edits: DoctorEditInput,
  admin: Reviewer
): Promise<DoctorWriteResult> {
  return onDuplicateRegistration(() => withTransaction(async (c) => {
    const cur = await c.query(`SELECT nmc_reg_no, is_sample FROM doctors WHERE id = $1 FOR UPDATE`, [id]);
    if (!cur.rows[0]) return { status: "not_found" };
    if (cur.rows[0].is_sample) return { status: "sample" };

    const fields = EDITABLE.filter((k) => edits[k] !== undefined);
    if (fields.length === 0) return { status: "ok" };

    const regChanged = edits.nmc_reg_no !== undefined && edits.nmc_reg_no !== cur.rows[0].nmc_reg_no;
    if (regChanged) {
      const taken = await c.query(
        `SELECT 1 FROM doctors WHERE nmc_reg_no = $1 AND id <> $2 AND is_sample = false`,
        [edits.nmc_reg_no, id]
      );
      if (taken.rowCount) return { status: "duplicate_registration" };
    }

    const sets = fields.map((k, i) => `${k} = $${i + 2}`);
    if (regChanged) sets.push("nmc_verified = false");
    sets.push("updated_at = now()");
    await c.query(`UPDATE doctors SET ${sets.join(", ")} WHERE id = $1`, [
      id,
      ...fields.map((k) => edits[k]),
    ]);

    if (regChanged) {
      await c.query(
        `INSERT INTO credential_provenance (doctor_id, source, evidence_url, verified_by, note)
         VALUES ($1, 'manual-review', NULL, $2, 'Registration number changed; verification cleared.')`,
        [id, reviewerLabel(admin)]
      );
    }
    await audit(c, admin.id, "doctor.update", "doctor", id, {
      fields: fields.join(","),
      verification_cleared: regChanged,
    });
    return { status: "ok" as const };
  }));
}

export async function verifyDoctor(
  id: number,
  v: VerificationInput,
  admin: Reviewer
): Promise<DoctorWriteResult> {
  return withTransaction(async (c) => {
    const { rows } = await c.query(`SELECT is_sample FROM doctors WHERE id = $1 FOR UPDATE`, [id]);
    if (!rows[0]) return { status: "not_found" };
    if (rows[0].is_sample) return { status: "sample" };
    await c.query(`UPDATE doctors SET nmc_verified = true, updated_at = now() WHERE id = $1`, [id]);
    await writeProvenance(c, id, v, admin);
    await audit(c, admin.id, "doctor.verify", "doctor", id, { source: v.source });
    return { status: "ok" };
  });
}

export async function unverifyDoctor(
  id: number,
  note: string,
  admin: Reviewer
): Promise<DoctorWriteResult> {
  return withTransaction(async (c) => {
    const { rows } = await c.query(
      `SELECT is_sample, nmc_verified FROM doctors WHERE id = $1 FOR UPDATE`,
      [id]
    );
    if (!rows[0]) return { status: "not_found" };
    if (rows[0].is_sample) return { status: "sample" };
    // Nothing to withdraw: a "verification withdrawn" line for a doctor who
    // was never verified would make the provenance history say something false.
    if (!rows[0].nmc_verified) return { status: "ok" };
    await c.query(`UPDATE doctors SET nmc_verified = false, updated_at = now() WHERE id = $1`, [id]);
    // Append-only: the earlier "verified" row stays, and this one says it no longer holds.
    await c.query(
      `INSERT INTO credential_provenance (doctor_id, source, evidence_url, verified_by, note)
       VALUES ($1, 'manual-review', NULL, $2, $3)`,
      [id, reviewerLabel(admin), `Verification withdrawn: ${note}`]
    );
    await audit(c, admin.id, "doctor.unverify", "doctor", id, {});
    return { status: "ok" };
  });
}

export async function setDoctorStatus(
  id: number,
  status: DoctorStatus,
  admin: Reviewer
): Promise<DoctorWriteResult> {
  return withTransaction(async (c) => {
    const { rows } = await c.query(`SELECT is_sample FROM doctors WHERE id = $1 FOR UPDATE`, [id]);
    if (!rows[0]) return { status: "not_found" };
    await c.query(`UPDATE doctors SET status = $2, updated_at = now() WHERE id = $1`, [id, status]);
    await audit(c, admin.id, status === "hidden" ? "doctor.hide" : "doctor.publish", "doctor", id, {});
    return { status: "ok" };
  });
}

/**
 * Remove a doctor entirely — the "delete me" request the privacy page promises
 * to honour. Provenance and score history cascade. The audit line keeps only
 * the id and the fact of removal, not the name: the person asked to be gone.
 * Their listing application goes too, since it holds the same details plus a
 * contact email.
 */
export async function deleteDoctor(id: number, admin: Reviewer): Promise<DoctorWriteResult> {
  return withTransaction(async (c) => {
    await c.query(`DELETE FROM listing_applications WHERE doctor_id = $1`, [id]);
    const { rowCount } = await c.query(`DELETE FROM doctors WHERE id = $1`, [id]);
    if (!rowCount) return { status: "not_found" };
    await audit(c, admin.id, "doctor.delete", "doctor", id, {});
    return { status: "ok" };
  });
}
