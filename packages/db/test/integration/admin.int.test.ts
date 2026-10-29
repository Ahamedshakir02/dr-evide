import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  approvalSchema,
  approveApplication,
  createAdminSession,
  deleteAdminSession,
  deleteDoctor,
  doctorEditSchema,
  findAdminByEmail,
  findDoctors,
  getAdminBySession,
  getDoctor,
  getDoctorForAdmin,
  incrementCounter,
  listDoctorsForAdmin,
  listingApplicationSchema,
  readCounters,
  readDataSummary,
  setDoctorStatus,
  submitApplication,
  unverifyDoctor,
  updateDoctor,
  verifyDoctor,
  type Reviewer,
} from "../../src/index";
import {
  EDAPPAL,
  applicationBody,
  closePool,
  hasDatabase,
  insertAdmin,
  insertDoctor,
  q,
  resetDatabase,
  setUpDatabase,
} from "./harness";

const evidence = {
  source: "nmc-registry" as const,
  evidence_url: "https://www.nmc.org.in/information-desk/indian-medical-register/?reg=1",
  note: null,
};

describe.skipIf(!hasDatabase)("admin data layer", () => {
  let admin: Reviewer;

  beforeAll(setUpDatabase);
  beforeEach(async () => {
    await resetDatabase();
    admin = await insertAdmin("Ops@Example.com", "Ops");
  });
  afterAll(closePool);

  describe("accounts and sessions", () => {
    it("finds an admin by email regardless of case", async () => {
      expect(await findAdminByEmail("ops@example.com")).toMatchObject({ id: admin.id, disabled: false });
      expect(await findAdminByEmail("nobody@example.com")).toBeNull();
    });

    it("refuses a second admin with the same email in another case", async () => {
      await expect(insertAdmin("OPS@example.com")).rejects.toThrow(/duplicate key/);
    });

    it("resolves a live session, and stops once it is deleted", async () => {
      await createAdminSession(admin.id, "hash-1", 60_000);
      expect(await getAdminBySession("hash-1")).toEqual({
        id: admin.id,
        email: "Ops@Example.com",
        name: "Ops",
      });
      const [{ last_login_at }] = await q(`SELECT last_login_at FROM admin_users WHERE id = $1`, [admin.id]);
      expect(last_login_at).not.toBeNull();

      await deleteAdminSession("hash-1");
      expect(await getAdminBySession("hash-1")).toBeNull();
    });

    it("refuses an expired session and sweeps it on the next sign-in", async () => {
      await createAdminSession(admin.id, "old", 60_000);
      await q(`UPDATE admin_sessions SET expires_at = now() - interval '1 second' WHERE token_hash = 'old'`);
      expect(await getAdminBySession("old")).toBeNull();

      await createAdminSession(admin.id, "new", 60_000);
      expect(await q(`SELECT token_hash FROM admin_sessions`)).toEqual([{ token_hash: "new" }]);
    });

    it("refuses the sessions of a disabled admin at once", async () => {
      await createAdminSession(admin.id, "h", 60_000);
      await q(`UPDATE admin_users SET disabled = true WHERE id = $1`, [admin.id]);
      expect(await getAdminBySession("h")).toBeNull();
    });
  });

  describe("editing a doctor", () => {
    const edit = (x: Record<string, unknown>) => doctorEditSchema.parse(x);

    it("changes only the fields given and logs which ones", async () => {
      const id = await insertDoctor({ full_name: "Dr Old", town: "Edappal" });
      expect(await updateDoctor(id, edit({ full_name: "Dr New", fee_inr: 250 }), admin)).toEqual({ status: "ok" });
      const d = await getDoctorForAdmin(id);
      expect(d).toMatchObject({ full_name: "Dr New", fee_inr: 250, town: "Edappal" });
      expect(d?.history[0]).toMatchObject({
        action: "doctor.update",
        admin_name: "Ops",
        detail: { fields: "full_name,fee_inr", verification_cleared: false },
      });
    });

    it("moves the doctor on the map when lat/lng change", async () => {
      const id = await insertDoctor();
      await updateDoctor(id, edit({ lat: EDAPPAL.lat + 0.5 }), admin);
      expect(await findDoctors({ specialty: "dermatology", ...EDAPPAL, radiusKm: 10 })).toEqual([]);
    });

    it("clears verification, with a provenance line, when the registration number changes", async () => {
      const id = await insertDoctor({ nmc_reg_no: "TCMC-1" });
      await verifyDoctor(id, evidence, admin);
      await updateDoctor(id, edit({ nmc_reg_no: "TCMC-2" }), admin);
      const d = await getDoctorForAdmin(id);
      expect(d?.nmc_verified).toBe(false);
      expect(d?.provenance.map((p) => p.note)).toEqual([
        "Registration number changed; verification cleared.",
        null,
      ]);
    });

    it("keeps verification when the same registration number is sent back unchanged", async () => {
      const id = await insertDoctor({ nmc_reg_no: "TCMC-1" });
      await verifyDoctor(id, evidence, admin);
      await updateDoctor(id, edit({ nmc_reg_no: "TCMC-1", fee_inr: 100 }), admin);
      expect((await getDoctorForAdmin(id))?.nmc_verified).toBe(true);
    });

    it("refuses a registration number another doctor holds", async () => {
      await insertDoctor({ nmc_reg_no: "TCMC-1" });
      const id = await insertDoctor({ nmc_reg_no: "TCMC-2" });
      expect(await updateDoctor(id, edit({ nmc_reg_no: "TCMC-1" }), admin)).toEqual({
        status: "duplicate_registration",
      });
    });

    it("refuses to edit or verify sample records", async () => {
      const id = await insertDoctor({ is_sample: true, nmc_reg_no: null });
      expect(await updateDoctor(id, edit({ full_name: "Dr Real" }), admin)).toEqual({ status: "sample" });
      expect(await verifyDoctor(id, evidence, admin)).toEqual({ status: "sample" });
      expect(await unverifyDoctor(id, "nope", admin)).toEqual({ status: "sample" });
    });

    it("is not_found for an unknown doctor", async () => {
      expect(await updateDoctor(4242, edit({ full_name: "Dr X" }), admin)).toEqual({ status: "not_found" });
      expect(await verifyDoctor(4242, evidence, admin)).toEqual({ status: "not_found" });
      expect(await setDoctorStatus(4242, "hidden", admin)).toEqual({ status: "not_found" });
      expect(await deleteDoctor(4242, admin)).toEqual({ status: "not_found" });
    });

    it("rejects review fields and nmc_verified at the schema", () => {
      expect(doctorEditSchema.safeParse({ review_avg: 5 }).success).toBe(false);
      expect(doctorEditSchema.safeParse({ nmc_verified: true }).success).toBe(false);
    });
  });

  describe("verification", () => {
    it("is append-only: withdrawing keeps the earlier record", async () => {
      const id = await insertDoctor();
      await verifyDoctor(id, evidence, admin);
      expect((await getDoctor(id))?.nmc_verified).toBe(true);
      await unverifyDoctor(id, "Council says lapsed", admin);
      const d = await getDoctorForAdmin(id);
      expect(d?.nmc_verified).toBe(false);
      expect(d?.provenance).toHaveLength(2);
      expect(d?.provenance[0].note).toBe("Verification withdrawn: Council says lapsed");
      expect(d?.history.map((h) => h.action)).toEqual(["doctor.unverify", "doctor.verify"]);
    });
  });

  describe("hiding and deleting", () => {
    it("takes a doctor off public search and puts them back", async () => {
      const id = await insertDoctor();
      const search = () => findDoctors({ specialty: "dermatology", ...EDAPPAL, radiusKm: 5 });
      await setDoctorStatus(id, "hidden", admin);
      expect(await search()).toEqual([]);
      await setDoctorStatus(id, "published", admin);
      expect((await search()).map((d) => d.id)).toEqual([id]);
    });

    it("deletes the doctor, their provenance and their application, keeping only an anonymous audit line", async () => {
      const { id: appId } = (await submitApplication(
        listingApplicationSchema.parse(applicationBody())
      )) as { id: number };
      const { doctor_id } = (await approveApplication(
        appId,
        approvalSchema.parse({ ...EDAPPAL, verification: evidence }),
        admin
      )) as { doctor_id: number };

      expect(await deleteDoctor(doctor_id, admin)).toEqual({ status: "ok" });
      expect(await q(`SELECT 1 FROM doctors`)).toHaveLength(0);
      expect(await q(`SELECT 1 FROM credential_provenance`)).toHaveLength(0);
      expect(await q(`SELECT 1 FROM listing_applications`)).toHaveLength(0);

      const log = await q<{ action: string; detail: unknown }>(
        `SELECT action, detail FROM admin_audit_log WHERE target_type = 'doctor'`
      );
      expect(log).toEqual([{ action: "doctor.delete", detail: {} }]);
      expect(JSON.stringify(await q(`SELECT * FROM admin_audit_log`))).not.toMatch(/Anitha|anitha@/);
    });
  });

  describe("search and filter for the console", () => {
    it("filters by text, status and verification, and hides samples unless asked", async () => {
      const a = await insertDoctor({ full_name: "Dr Priya", town: "Ponnani" });
      const b = await insertDoctor({ full_name: "Dr Rahul", status: "hidden", nmc_verified: true });
      const s = await insertDoctor({ full_name: "Dr Sample", is_sample: true, nmc_reg_no: null });

      const ids = async (f: Parameters<typeof listDoctorsForAdmin>[0]) =>
        (await listDoctorsForAdmin(f)).map((d) => d.id).sort();

      expect(await ids({})).toEqual([a, b].sort());
      expect(await ids({ includeSample: true })).toEqual([a, b, s].sort());
      expect(await ids({ q: "ponn" })).toEqual([a]);
      expect(await ids({ status: "hidden" })).toEqual([b]);
      expect(await ids({ verified: true })).toEqual([b]);
    });

    it("treats % and _ in the search box as text, not wildcards", async () => {
      await insertDoctor({ full_name: "Dr Priya" });
      expect(await listDoctorsForAdmin({ q: "%" })).toEqual([]);
      expect(await listDoctorsForAdmin({ q: "_" })).toEqual([]);
    });
  });

  describe("stats", () => {
    it("adds up daily counters and reads them back for today", async () => {
      await incrementCounter("search.performed.dermatology");
      await incrementCounter("search.performed.dermatology", 2);
      await incrementCounter("contact.call");
      const rows = await readCounters(1);
      expect(rows.map(({ name, value }) => ({ name, value }))).toEqual([
        { name: "contact.call", value: 1 },
        { name: "search.performed.dermatology", value: 3 },
      ]);
      expect(rows[0].day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("summarises real doctors only", async () => {
      await insertDoctor({ specialty_slug: "dental", nmc_verified: true });
      await insertDoctor({ specialty_slug: "dental" });
      await insertDoctor({ specialty_slug: "ent", status: "hidden" });
      await insertDoctor({ is_sample: true, nmc_reg_no: null });
      await submitApplication(listingApplicationSchema.parse(applicationBody()));
      await q(`INSERT INTO launch_notifications (email) VALUES ('a@b.co')`);

      expect(await readDataSummary()).toEqual({
        doctors_published: 2,
        doctors_verified: 1,
        doctors_hidden: 1,
        applications_pending: 1,
        launch_list: 1,
        by_specialty: { dental: 2 },
      });
    });
  });
});
