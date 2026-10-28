import type { PoolClient } from "pg";
import { requirePool } from "./pool";
import { audit } from "./audit";
import {
  CONSENT_VERSION,
  type ApprovalInput,
  type ListingApplicationInput,
  type VerificationInput,
} from "./validation";

/**
 * A doctor's request to be listed, from /list-your-practice to a public profile.
 *
 * pending ──approve──▶ approved (creates the doctors row, optionally verified)
 *        └─reject───▶ rejected (kept, with the reason)
 *
 * Nothing in an application is public. Approval copies the public fields into
 * `doctors`; the contact email never leaves this table.
 */

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface ListingApplication extends Omit<ListingApplicationInput, "consent"> {
  id: number;
  consent_version: string;
  status: ApplicationStatus;
  review_note: string | null;
  reviewed_by: number | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  doctor_id: number | null;
  created_at: string;
}

export type SubmitResult =
  | { status: "saved"; id: number }
  /** Already listed, or already waiting for review. Not an error to the doctor. */
  | { status: "duplicate" };

export async function submitApplication(input: ListingApplicationInput): Promise<SubmitResult> {
  const p = requirePool();

  const dup = await p.query(
    `SELECT 1 FROM doctors WHERE nmc_reg_no = $1 AND is_sample = false
     UNION ALL
     SELECT 1 FROM listing_applications WHERE nmc_reg_no = $1 AND status = 'pending'
     LIMIT 1`,
    [input.nmc_reg_no]
  );
  if (dup.rowCount) return { status: "duplicate" };

  const { rows } = await p.query(
    `INSERT INTO listing_applications (
       full_name, specialty_slug, qualifications, qualification_level, nmc_reg_no,
       registration_council, reg_year, clinic_name, address, town, phone, fee_inr,
       timings, conditions, map_link, contact_email, consent, consent_version
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17)
     RETURNING id`,
    [
      input.full_name, input.specialty_slug, input.qualifications, input.qualification_level,
      input.nmc_reg_no, input.registration_council, input.reg_year, input.clinic_name,
      input.address, input.town, input.phone, input.fee_inr, input.timings, input.conditions,
      input.map_link, input.contact_email, CONSENT_VERSION,
    ]
  );
  return { status: "saved", id: Number(rows[0].id) };
}

const APPLICATION_COLUMNS = `
  a.id, a.full_name, a.specialty_slug, a.qualifications, a.qualification_level,
  a.nmc_reg_no, a.registration_council, a.reg_year, a.clinic_name, a.address,
  a.town, a.phone, a.fee_inr, a.timings, a.conditions, a.map_link, a.contact_email,
  a.consent_version, a.status, a.review_note, a.reviewed_by, u.name AS reviewed_by_name,
  a.reviewed_at, a.doctor_id, a.created_at
`;

export async function listApplications(
  status: ApplicationStatus | "all" = "pending",
  limit = 100
): Promise<ListingApplication[]> {
  const { rows } = await requirePool().query(
    `SELECT ${APPLICATION_COLUMNS}
     FROM listing_applications a LEFT JOIN admin_users u ON u.id = a.reviewed_by
     WHERE ($1 = 'all' OR a.status = $1)
     ORDER BY a.created_at ${status === "pending" ? "ASC" : "DESC"}
     LIMIT $2`,
    [status, Math.min(Math.max(limit, 1), 500)]
  );
  return rows.map(toApplication);
}

export async function getApplication(id: number): Promise<ListingApplication | null> {
  const { rows } = await requirePool().query(
    `SELECT ${APPLICATION_COLUMNS}
     FROM listing_applications a LEFT JOIN admin_users u ON u.id = a.reviewed_by
     WHERE a.id = $1`,
    [id]
  );
  return rows[0] ? toApplication(rows[0]) : null;
}

export async function countPendingApplications(): Promise<number> {
  const { rows } = await requirePool().query(
    `SELECT count(*)::int AS n FROM listing_applications WHERE status = 'pending'`
  );
  return rows[0].n;
}

export type ReviewResult =
  | { status: "ok"; doctor_id?: number }
  | { status: "not_found" }
  /** Already approved or rejected — two admins clicking at once. */
  | { status: "conflict" }
  /** Another listed doctor already holds this registration number. */
  | { status: "duplicate_registration" };

export interface Reviewer {
  id: number;
  name: string;
  email: string;
}

/** Who signed off, as written to credential_provenance.verified_by. */
export const reviewerLabel = (r: Reviewer) => `${r.name} <${r.email}>`;

export async function approveApplication(
  id: number,
  input: ApprovalInput,
  reviewer: Reviewer
): Promise<ReviewResult> {
  return withTransaction(async (c) => {
    const { rows } = await c.query(
      `SELECT * FROM listing_applications WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const app = rows[0];
    if (!app) return { status: "not_found" };
    if (app.status !== "pending") return { status: "conflict" };

    const e = input.edits;
    const reg = e.nmc_reg_no ?? app.nmc_reg_no;
    const taken = await c.query(
      `SELECT 1 FROM doctors WHERE nmc_reg_no = $1 AND is_sample = false`,
      [reg]
    );
    if (taken.rowCount) return { status: "duplicate_registration" };

    const verified = input.verification !== null;
    const doctor = await c.query(
      `INSERT INTO doctors (
         full_name, specialty_slug, sub_specialties, conditions, qualifications,
         qualification_level, nmc_reg_no, nmc_verified, reg_year, clinic_name,
         address, town, phone, fee_inr, timings, lat, lng, is_sample, status
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,false,'published')
       RETURNING id`,
      [
        e.full_name ?? app.full_name,
        e.specialty_slug ?? app.specialty_slug,
        e.sub_specialties ?? [],
        e.conditions ?? app.conditions,
        e.qualifications ?? app.qualifications,
        e.qualification_level ?? app.qualification_level,
        reg,
        verified,
        e.reg_year !== undefined ? e.reg_year : app.reg_year,
        e.clinic_name !== undefined ? e.clinic_name : app.clinic_name,
        e.address !== undefined ? e.address : app.address,
        e.town !== undefined ? e.town : app.town,
        e.phone !== undefined ? e.phone : app.phone,
        e.fee_inr !== undefined ? e.fee_inr : app.fee_inr,
        e.timings !== undefined ? e.timings : app.timings,
        input.lat,
        input.lng,
      ]
    );
    const doctorId = Number(doctor.rows[0].id);

    if (input.verification) {
      await writeProvenance(c, doctorId, input.verification, reviewer);
    }

    await c.query(
      `UPDATE listing_applications
       SET status = 'approved', reviewed_by = $2, reviewed_at = now(), doctor_id = $3, review_note = $4
       WHERE id = $1`,
      [id, reviewer.id, doctorId, input.note]
    );
    await audit(c, reviewer.id, "application.approve", "application", id, {
      doctor_id: doctorId,
      verified,
    });
    return { status: "ok", doctor_id: doctorId };
  });
}

export async function rejectApplication(
  id: number,
  note: string,
  reviewer: Reviewer
): Promise<ReviewResult> {
  return withTransaction(async (c) => {
    const { rowCount } = await c.query(
      `UPDATE listing_applications
       SET status = 'rejected', reviewed_by = $2, reviewed_at = now(), review_note = $3
       WHERE id = $1 AND status = 'pending'`,
      [id, reviewer.id, note]
    );
    if (!rowCount) {
      const exists = await c.query(`SELECT 1 FROM listing_applications WHERE id = $1`, [id]);
      return { status: exists.rowCount ? "conflict" : "not_found" };
    }
    await audit(c, reviewer.id, "application.reject", "application", id, {});
    return { status: "ok" };
  });
}

export async function writeProvenance(
  c: PoolClient,
  doctorId: number,
  v: VerificationInput,
  reviewer: Reviewer
): Promise<void> {
  await c.query(
    `INSERT INTO credential_provenance (doctor_id, source, evidence_url, verified_by, note)
     VALUES ($1,$2,$3,$4,$5)`,
    [doctorId, v.source, v.evidence_url, reviewerLabel(reviewer), v.note]
  );
}

export async function withTransaction<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await requirePool().connect();
  try {
    await c.query("BEGIN");
    const out = await fn(c);
    await c.query("COMMIT");
    return out;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

function toApplication(r: Record<string, unknown>): ListingApplication {
  return {
    ...(r as unknown as ListingApplication),
    id: Number(r.id),
    qualification_level: Number(r.qualification_level),
    reg_year: r.reg_year === null ? null : Number(r.reg_year),
    fee_inr: r.fee_inr === null ? null : Number(r.fee_inr),
    reviewed_at: r.reviewed_at ? new Date(r.reviewed_at as string).toISOString() : null,
    created_at: new Date(r.created_at as string).toISOString(),
  };
}
