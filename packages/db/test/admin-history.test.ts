import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

/**
 * Runs against a real Postgres when TEST_DATABASE_URL is set (CI's integration
 * job, or locally); skipped otherwise. Uses its own throwaway schema.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("doctor history in the admin console", () => {
  let db: typeof import("../src/index");
  const admin = { id: 0, name: "History Test", email: "history@example.com" };

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", url!);
    db = await import("../src/index");
    const pool = db.getPool()!;
    const schema = readFileSync(fileURLToPath(new URL("../schema.sql", import.meta.url)), "utf8");
    await pool.query(schema);
    await pool.query(
      `INSERT INTO specialties (slug, name) VALUES ('dermatology', 'Dermatology') ON CONFLICT DO NOTHING`
    );
    const { rows } = await pool.query(
      `INSERT INTO admin_users (email, name, password_hash) VALUES ($1, $2, 'x')
       ON CONFLICT (lower(email)) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      [admin.email, admin.name]
    );
    admin.id = Number(rows[0].id);
  });

  afterAll(async () => {
    await db?.getPool()?.end();
    vi.unstubAllEnvs();
  });

  it("starts with the approval that created the doctor", async () => {
    const reg = `HIST-${Date.now()}`;
    const submitted = await db.submitApplication(
      db.listingApplicationSchema.parse({
        full_name: "Dr History Test",
        specialty_slug: "dermatology",
        qualifications: ["MBBS"],
        qualification_level: 1,
        nmc_reg_no: reg,
        address: "Main Road",
        town: "Edappal",
        phone: "+91 98470 00000",
        contact_email: "doc@example.com",
        consent: true,
      })
    );
    if (submitted.status !== "saved") throw new Error("submit failed");

    const approved = await db.approveApplication(
      submitted.id,
      db.approvalSchema.parse({ lat: 10.79, lng: 76.01 }),
      admin
    );
    if (approved.status !== "ok" || !approved.doctor_id) throw new Error("approve failed");

    await db.setDoctorStatus(approved.doctor_id, "hidden", admin);
    const doctor = await db.getDoctorForAdmin(approved.doctor_id);

    expect(doctor?.history.map((h) => h.action)).toEqual(["doctor.hide", "application.approve"]);
    expect(doctor?.history[1].admin_name).toBe(admin.name);

    await db.deleteDoctor(approved.doctor_id, admin);
  });
});
