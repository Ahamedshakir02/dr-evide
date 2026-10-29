import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  approvalSchema,
  approveApplication,
  countPendingApplications,
  findDoctors,
  getApplication,
  getDoctorForAdmin,
  listApplications,
  listingApplicationSchema,
  rejectApplication,
  submitApplication,
  type Reviewer,
} from "../../src/index";
import {
  EDAPPAL,
  applicationBody,
  closePool,
  hasDatabase,
  insertAdmin,
  insertDoctor,
  pool,
  q,
  resetDatabase,
  setUpDatabase,
} from "./harness";

/**
 * A doctor's application, from the public form to a public profile. These run
 * the real SQL, the real transactions and the real constraints.
 */

const submit = (overrides: Record<string, unknown> = {}) =>
  submitApplication(listingApplicationSchema.parse(applicationBody(overrides)));

const approval = (extra: Record<string, unknown> = {}) =>
  approvalSchema.parse({ ...EDAPPAL, ...extra });

const evidence = {
  source: "state-council",
  evidence_url: "https://tcmc.kerala.gov.in/register/12345",
  note: "Checked by phone",
};

describe.skipIf(!hasDatabase)("listing applications", () => {
  let admin: Reviewer;

  beforeAll(setUpDatabase);
  beforeEach(async () => {
    await resetDatabase();
    admin = await insertAdmin("reviewer@example.com", "Reviewer");
  });
  afterAll(closePool);

  describe("submitting", () => {
    it("saves a pending application with the consent version, lowercased email and deduplicated conditions", async () => {
      const r = await submit();
      expect(r.status).toBe("saved");
      const app = await getApplication((r as { id: number }).id);
      expect(app).toMatchObject({
        status: "pending",
        consent_version: "2026-10-v1",
        contact_email: "anitha@example.com",
        conditions: ["acne", "eczema"],
        doctor_id: null,
      });
      expect(await countPendingApplications()).toBe(1);
    });

    it("treats a second application for the same registration number as a duplicate while the first is pending", async () => {
      await submit({ nmc_reg_no: "TCMC-777" });
      expect(await submit({ nmc_reg_no: "TCMC-777" })).toEqual({ status: "duplicate" });
      expect(await countPendingApplications()).toBe(1);
    });

    it("treats an application from an already listed doctor as a duplicate", async () => {
      await insertDoctor({ nmc_reg_no: "TCMC-888" });
      expect(await submit({ nmc_reg_no: "TCMC-888" })).toEqual({ status: "duplicate" });
    });

    it("does not count a sample doctor's registration number as already listed", async () => {
      await insertDoctor({ nmc_reg_no: "TCMC-999", is_sample: true });
      expect((await submit({ nmc_reg_no: "TCMC-999" })).status).toBe("saved");
    });

    it("lets a doctor apply again after a rejection", async () => {
      const first = (await submit({ nmc_reg_no: "TCMC-555" })) as { id: number };
      await rejectApplication(first.id, "Registration number did not match the register.", admin);
      expect((await submit({ nmc_reg_no: "TCMC-555" })).status).toBe("saved");
    });

    /**
     * Regression (qa-report bug 2): a double-tapped Submit used to file the same
     * doctor several times. listing_applications_pending_reg_idx now stops it.
     */
    it("files only one application when the same doctor submits several times at once", async () => {
      const reg = "TCMC-RACE";
      // Open five connections first, as a busy server would have, so the five
      // submissions really do overlap instead of queueing behind connect().
      await Promise.all(Array.from({ length: 5 }, () => pool().query("SELECT pg_sleep(0.05)")));
      const results = await Promise.all(Array.from({ length: 5 }, () => submit({ nmc_reg_no: reg })));
      expect(results.filter((r) => r.status === "saved")).toHaveLength(1);
      expect(await q(`SELECT id FROM listing_applications WHERE nmc_reg_no = $1`, [reg])).toHaveLength(1);
    });
  });

  describe("listing", () => {
    it("lists pending oldest first and reviewed newest first", async () => {
      const a = (await submit()) as { id: number };
      const b = (await submit()) as { id: number };
      const c = (await submit()) as { id: number };
      await q(`UPDATE listing_applications SET created_at = now() - interval '1 hour' * (4 - id)`);
      expect((await listApplications("pending")).map((x) => x.id)).toEqual([a.id, b.id, c.id]);

      await rejectApplication(a.id, "Not a doctor.", admin);
      await rejectApplication(c.id, "Duplicate.", admin);
      expect((await listApplications("rejected")).map((x) => x.id)).toEqual([c.id, a.id]);
      expect((await listApplications("all")).length).toBe(3);
    });

    it("names the reviewer on a reviewed application", async () => {
      const a = (await submit()) as { id: number };
      await rejectApplication(a.id, "Not a doctor.", admin);
      expect(await getApplication(a.id)).toMatchObject({
        status: "rejected",
        reviewed_by: admin.id,
        reviewed_by_name: "Reviewer",
        review_note: "Not a doctor.",
      });
    });
  });

  describe("approving", () => {
    it("creates a published doctor at the pinned location, findable by search", async () => {
      const a = (await submit({ nmc_reg_no: "TCMC-1001" })) as { id: number };
      const r = await approveApplication(a.id, approval(), admin);
      expect(r.status).toBe("ok");
      const doctorId = (r as { doctor_id: number }).doctor_id;

      const found = await findDoctors({ specialty: "dermatology", ...EDAPPAL, radiusKm: 5 });
      expect(found.map((d) => d.id)).toEqual([doctorId]);
      expect(found[0]).toMatchObject({
        full_name: "Dr Anitha Menon",
        nmc_reg_no: "TCMC-1001",
        nmc_verified: false,
        qualifications: ["MBBS", "MD Dermatology"],
        conditions: ["acne", "eczema"],
        is_sample: false,
      });

      const app = await getApplication(a.id);
      expect(app).toMatchObject({ status: "approved", doctor_id: doctorId, reviewed_by: admin.id });
    });

    it("never copies the contact email onto the public doctor row", async () => {
      const a = (await submit()) as { id: number };
      const r = (await approveApplication(a.id, approval(), admin)) as { doctor_id: number };
      const [row] = await q(`SELECT to_jsonb(d) AS j FROM doctors d WHERE id = $1`, [r.doctor_id]);
      expect(JSON.stringify(row.j)).not.toContain("anitha@example.com");
    });

    it("applies the admin's corrections", async () => {
      const a = (await submit()) as { id: number };
      const r = (await approveApplication(
        a.id,
        approval({ edits: { full_name: "Dr Anitha K Menon", fee_inr: 400, town: "Kuttippuram" } }),
        admin
      )) as { doctor_id: number };
      const [d] = await q(`SELECT full_name, fee_inr, town FROM doctors WHERE id = $1`, [r.doctor_id]);
      expect(d).toEqual({ full_name: "Dr Anitha K Menon", fee_inr: 400, town: "Kuttippuram" });
    });

    it("marks the doctor verified and records who checked what, when verification is given", async () => {
      const a = (await submit()) as { id: number };
      const r = (await approveApplication(a.id, approval({ verification: evidence }), admin)) as {
        doctor_id: number;
      };
      const detail = await getDoctorForAdmin(r.doctor_id);
      expect(detail?.nmc_verified).toBe(true);
      expect(detail?.provenance).toHaveLength(1);
      expect(detail?.provenance[0]).toMatchObject({
        source: "state-council",
        evidence_url: evidence.evidence_url,
        verified_by: "Reviewer <reviewer@example.com>",
      });
    });

    it("writes an audit line in the same transaction", async () => {
      const a = (await submit()) as { id: number };
      const r = (await approveApplication(a.id, approval(), admin)) as { doctor_id: number };
      const log = await q(`SELECT admin_id, action, target_type, target_id, detail FROM admin_audit_log`);
      expect(log).toEqual([
        {
          admin_id: admin.id,
          action: "application.approve",
          target_type: "application",
          target_id: a.id,
          detail: { doctor_id: r.doctor_id, verified: false },
        },
      ]);
    });

    it("is not_found for an unknown application", async () => {
      expect(await approveApplication(4242, approval(), admin)).toEqual({ status: "not_found" });
    });

    it("is a conflict the second time, and creates only one doctor", async () => {
      const a = (await submit()) as { id: number };
      await approveApplication(a.id, approval(), admin);
      expect(await approveApplication(a.id, approval(), admin)).toEqual({ status: "conflict" });
      expect(await q(`SELECT id FROM doctors`)).toHaveLength(1);
    });

    it("creates exactly one doctor when two admins approve at the same moment", async () => {
      const a = (await submit()) as { id: number };
      const results = await Promise.all([
        approveApplication(a.id, approval(), admin),
        approveApplication(a.id, approval(), admin),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual(["conflict", "ok"]);
      expect(await q(`SELECT id FROM doctors`)).toHaveLength(1);
    });

    it("refuses a registration number another listed doctor already holds, and changes nothing", async () => {
      await insertDoctor({ nmc_reg_no: "TCMC-2002" });
      const a = (await submit()) as { id: number };
      const r = await approveApplication(a.id, approval({ edits: { nmc_reg_no: "TCMC-2002" } }), admin);
      expect(r).toEqual({ status: "duplicate_registration" });
      expect((await getApplication(a.id))?.status).toBe("pending");
      expect(await q(`SELECT 1 FROM admin_audit_log`)).toHaveLength(0);
    });

    it("rolls back the new doctor if a later step fails", async () => {
      const a = (await submit()) as { id: number };
      // A reviewer id that is not in admin_users breaks the reviewed_by foreign
      // key on the final UPDATE, after the doctor row has been inserted.
      const ghost = { id: 99_999, name: "Ghost", email: "ghost@example.com" };
      await expect(approveApplication(a.id, approval(), ghost)).rejects.toThrow();
      expect(await q(`SELECT id FROM doctors`)).toHaveLength(0);
      expect((await getApplication(a.id))?.status).toBe("pending");
    });
  });

  describe("rejecting", () => {
    it("keeps the application with the reason, and creates no doctor", async () => {
      const a = (await submit()) as { id: number };
      expect(await rejectApplication(a.id, "Could not verify.", admin)).toEqual({ status: "ok" });
      expect(await q(`SELECT id FROM doctors`)).toHaveLength(0);
      expect(await q(`SELECT action FROM admin_audit_log`)).toEqual([{ action: "application.reject" }]);
    });

    it("is a conflict once reviewed, and not_found for an unknown id", async () => {
      const a = (await submit()) as { id: number };
      await approveApplication(a.id, approval(), admin);
      expect(await rejectApplication(a.id, "Changed my mind.", admin)).toEqual({ status: "conflict" });
      expect(await rejectApplication(4242, "Nope.", admin)).toEqual({ status: "not_found" });
    });
  });
});
