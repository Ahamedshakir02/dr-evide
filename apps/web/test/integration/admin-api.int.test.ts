import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/admin/login/route";
import { POST as logout } from "@/app/api/admin/logout/route";
import { GET as me } from "@/app/api/admin/me/route";
import { GET as stats } from "@/app/api/admin/stats/route";
import { GET as listApplications } from "@/app/api/admin/applications/route";
import { GET as getApplication } from "@/app/api/admin/applications/[id]/route";
import { POST as approve } from "@/app/api/admin/applications/[id]/approve/route";
import { POST as reject } from "@/app/api/admin/applications/[id]/reject/route";
import { GET as listDoctors } from "@/app/api/admin/doctors/route";
import { DELETE as deleteDoctor, GET as getDoctor, PATCH as patchDoctor } from "@/app/api/admin/doctors/[id]/route";
import { POST as setStatus } from "@/app/api/admin/doctors/[id]/status/route";
import { POST as verify } from "@/app/api/admin/doctors/[id]/verify/route";
import { POST as unverify } from "@/app/api/admin/doctors/[id]/unverify/route";
import { POST as apply } from "@/app/api/listing-applications/route";
import { GET as searchDoctors } from "@/app/api/doctors/route";
import { GET as publicDoctor } from "@/app/api/doctors/[id]/route";
import { __resetMemoryStore } from "@/lib/rate-limit";
import {
  EDAPPAL,
  applicationBody,
  closePool,
  hasDatabase,
  insertDoctor,
  q,
  resetDatabase,
  setUpDatabase,
} from "../../../../packages/db/test/integration/harness";
import { ADMIN_PASSWORD, createAdmin, ctx, eventually, json, request, signIn } from "./http";

/**
 * The admin console's API, end to end through the route handlers: real
 * scrypt passwords, real session rows, real transactions.
 */

const evidence = {
  source: "state-council",
  evidence_url: "https://tcmc.kerala.gov.in/register/TCMC-12345",
};

describe.skipIf(!hasDatabase)("admin API", () => {
  beforeAll(async () => {
    delete process.env.REDIS_URL;
    await setUpDatabase();
  });
  beforeEach(async () => {
    __resetMemoryStore();
    await resetDatabase();
    await createAdmin();
  });
  afterAll(closePool);

  describe("signing in", () => {
    it("sets an httpOnly, SameSite=Strict session cookie and stores only its hash", async () => {
      const res = await login(
        request("POST", "/api/admin/login", { body: { email: "Admin@Example.com", password: ADMIN_PASSWORD } })
      );
      expect(res.status).toBe(200);
      expect(await json(res)).toEqual({ admin: { id: 1, email: "admin@example.com", name: "QA Admin" } });
      const setCookie = res.headers.get("set-cookie") ?? "";
      expect(setCookie).toMatch(/dre_admin=/);
      expect(setCookie).toMatch(/HttpOnly/i);
      expect(setCookie).toMatch(/SameSite=strict/i);

      const token = res.cookies.get("dre_admin")!.value;
      const [row] = await q<{ token_hash: string }>(`SELECT token_hash FROM admin_sessions`);
      expect(row.token_hash).not.toBe(token);
      expect(row.token_hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("gives the same 401 for a wrong password and an unknown email", async () => {
      const wrong = await login(request("POST", "/", { body: { email: "admin@example.com", password: "nope" } }));
      const unknown = await login(request("POST", "/", { body: { email: "who@example.com", password: "nope" } }));
      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      expect(await json(wrong)).toEqual(await json(unknown));
      expect(await q(`SELECT 1 FROM admin_sessions`)).toHaveLength(0);
    });

    it("refuses a disabled admin even with the right password", async () => {
      await createAdmin("gone@example.com", "Gone", true);
      const res = await login(request("POST", "/", { body: { email: "gone@example.com", password: ADMIN_PASSWORD } }));
      expect(res.status).toBe(401);
    });

    it("refuses a sign-in posted from another site, or with no Origin", async () => {
      const body = { email: "admin@example.com", password: ADMIN_PASSWORD };
      expect((await login(request("POST", "/", { body, origin: "https://evil.example" }))).status).toBe(403);
      expect((await login(request("POST", "/", { body, origin: null }))).status).toBe(403);
    });

    it("locks one account after five wrong passwords, even from different machines", async () => {
      for (let i = 0; i < 5; i++) {
        expect((await login(request("POST", "/", { body: { email: "admin@example.com", password: "x" } }))).status).toBe(401);
      }
      const res = await login(request("POST", "/", { body: { email: "admin@example.com", password: ADMIN_PASSWORD } }));
      expect(res.status).toBe(429);
    });

    it("limits one machine to ten attempts across accounts", async () => {
      const ip = "192.0.2.50";
      for (let i = 0; i < 10; i++) {
        await login(request("POST", "/", { ip, body: { email: `u${i}@example.com`, password: "x" } }));
      }
      expect((await login(request("POST", "/", { ip, body: { email: "admin@example.com", password: ADMIN_PASSWORD } }))).status).toBe(429);
    });
  });

  describe("sessions", () => {
    it("knows who is signed in, and forgets on sign-out", async () => {
      const cookie = await signIn();
      const ok = await me(request("GET", "/api/admin/me", { cookie }));
      expect(ok.status).toBe(200);
      expect((await json<{ admin: { name: string } }>(ok)).admin.name).toBe("QA Admin");

      const out = await logout(request("POST", "/api/admin/logout", { cookie }));
      expect(out.status).toBe(200);
      expect(out.headers.get("set-cookie")).toMatch(/dre_admin=;/);
      expect(await q(`SELECT 1 FROM admin_sessions`)).toHaveLength(0);
      // The old cookie is dead server-side, not just cleared in the browser.
      expect((await me(request("GET", "/", { cookie }))).status).toBe(401);
    });

    it("is a 401 with no cookie, a forged cookie or an expired session", async () => {
      expect((await me(request("GET", "/"))).status).toBe(401);
      expect((await me(request("GET", "/", { cookie: "dre_admin=forged" }))).status).toBe(401);
      const cookie = await signIn();
      await q(`UPDATE admin_sessions SET expires_at = now() - interval '1 minute'`);
      expect((await me(request("GET", "/", { cookie }))).status).toBe(401);
    });

    it("ends a session at once when the admin is disabled", async () => {
      const cookie = await signIn();
      await q(`UPDATE admin_users SET disabled = true`);
      expect((await me(request("GET", "/", { cookie }))).status).toBe(401);
    });

    it("refuses a cross-site write even with a valid session", async () => {
      const cookie = await signIn();
      const id = await insertDoctor();
      const res = await setStatus(
        request("POST", "/", { cookie, origin: "https://evil.example", body: { status: "hidden" } }),
        ctx(id)
      );
      expect(res.status).toBe(403);
      expect((await q(`SELECT status FROM doctors`))[0].status).toBe("published");
    });

    it("protects every admin route", async () => {
      const id = await insertDoctor();
      const anon = (m: string) => request(m, "/", { body: m === "GET" || m === "DELETE" ? undefined : {} });
      const calls: Response[] = await Promise.all([
        stats(anon("GET")),
        listApplications(anon("GET")),
        getApplication(anon("GET"), ctx(1)),
        approve(anon("POST"), ctx(1)),
        reject(anon("POST"), ctx(1)),
        listDoctors(anon("GET")),
        getDoctor(anon("GET"), ctx(id)),
        patchDoctor(anon("PATCH"), ctx(id)),
        deleteDoctor(anon("DELETE"), ctx(id)),
        setStatus(anon("POST"), ctx(id)),
        verify(anon("POST"), ctx(id)),
        unverify(anon("POST"), ctx(id)),
      ]);
      expect(calls.map((r) => r.status)).toEqual(Array(calls.length).fill(401));
      expect(await q(`SELECT 1 FROM doctors`)).toHaveLength(1);
    });
  });

  describe("a doctor's journey: apply → review → public → manage → removal", () => {
    it("works end to end", async () => {
      const cookie = await signIn();
      const as = (method: string, body?: unknown) => request(method, "/", { cookie, body });

      // 1. The doctor applies through the public form.
      const filed = await apply(request("POST", "/", { body: applicationBody({ nmc_reg_no: "TCMC-12345" }) }));
      expect(filed.status).toBe(201);

      // 2. The admin sees it waiting, with the contact email (admins only).
      const pending = await json<{ applications: { id: number; contact_email: string }[] }>(
        await listApplications(request("GET", "/api/admin/applications", { cookie }))
      );
      expect(pending.applications).toHaveLength(1);
      const appId = pending.applications[0].id;
      expect(pending.applications[0].contact_email).toBe("anitha@example.com");
      expect((await getApplication(as("GET"), ctx(appId))).status).toBe(200);

      // Not public yet.
      const search = async () =>
        json<{ doctors: { id: number; nmc_verified: boolean }[] }>(
          await searchDoctors(request("GET", `/api/doctors?specialty=dermatology&lat=${EDAPPAL.lat}&lng=${EDAPPAL.lng}&radius=5`))
        );
      expect((await search()).doctors).toEqual([]);

      // 3. Approve with a map pin and verification evidence.
      const approved = await approve(as("POST", { ...EDAPPAL, verification: evidence }), ctx(appId));
      expect(approved.status).toBe(200);
      const { doctor_id } = await json<{ doctor_id: number }>(approved);

      // 4. Now public, verified, and the contact email is nowhere in the response.
      const found = await searchDoctors(request("GET", `/api/doctors?specialty=dermatology&lat=${EDAPPAL.lat}&lng=${EDAPPAL.lng}&radius=5`));
      const foundText = await found.text();
      expect(foundText).not.toContain("anitha@example.com");
      const listed = JSON.parse(foundText).doctors;
      expect(listed.map((d: { id: number }) => d.id)).toEqual([doctor_id]);
      expect(listed[0].nmc_verified).toBe(true);

      // A second approval click is a 409, not a second doctor.
      expect((await approve(as("POST", { ...EDAPPAL }), ctx(appId))).status).toBe(409);

      // 5. Edit, withdraw verification, hide, show.
      expect((await patchDoctor(as("PATCH", { fee_inr: 350, timings: "Mon–Fri 5pm–8pm" }), ctx(doctor_id))).status).toBe(200);
      expect((await unverify(as("POST", { note: "Council record lapsed" }), ctx(doctor_id))).status).toBe(200);
      expect((await search()).doctors[0].nmc_verified).toBe(false);
      expect((await verify(as("POST", evidence), ctx(doctor_id))).status).toBe(200);

      expect((await setStatus(as("POST", { status: "hidden" }), ctx(doctor_id))).status).toBe(200);
      expect((await search()).doctors).toEqual([]);
      expect((await publicDoctor(request("GET", "/"), ctx(doctor_id))).status).toBe(404);
      expect((await setStatus(as("POST", { status: "published" }), ctx(doctor_id))).status).toBe(200);
      expect((await publicDoctor(request("GET", "/"), ctx(doctor_id))).status).toBe(200);

      // 6. The admin detail page has the whole history.
      const detail = await json<{ doctor: { fee_inr: number; provenance: unknown[]; history: { action: string }[] } }>(
        await getDoctor(as("GET"), ctx(doctor_id))
      );
      expect(detail.doctor.fee_inr).toBe(350);
      expect(detail.doctor.provenance).toHaveLength(3);
      expect(detail.doctor.history.map((h) => h.action)).toEqual([
        "doctor.publish",
        "doctor.hide",
        "doctor.verify",
        "doctor.unverify",
        "doctor.update",
      ]);

      // 7. "Delete me": gone from search, the profile, the console and the applications table.
      expect((await deleteDoctor(as("DELETE"), ctx(doctor_id))).status).toBe(200);
      expect((await publicDoctor(request("GET", "/"), ctx(doctor_id))).status).toBe(404);
      expect((await getDoctor(as("GET"), ctx(doctor_id))).status).toBe(404);
      expect(await q(`SELECT 1 FROM listing_applications`)).toHaveLength(0);
      expect((await deleteDoctor(as("DELETE"), ctx(doctor_id))).status).toBe(404);
    });
  });

  describe("review edge cases", () => {
    let cookie: string;
    let appId: number;
    beforeEach(async () => {
      cookie = await signIn();
      await apply(request("POST", "/", { body: applicationBody({ nmc_reg_no: "TCMC-777" }) }));
      appId = (await q<{ id: number }>(`SELECT id FROM listing_applications`))[0].id;
    });
    const as = (method: string, body?: unknown) => request(method, "/", { cookie, body });

    it("requires a map pin to approve", async () => {
      const res = await approve(as("POST", {}), ctx(appId));
      expect(res.status).toBe(400);
      expect(Object.keys((await json<{ fields: object }>(res)).fields).sort()).toEqual(["lat", "lng"]);
    });

    it("requires evidence to verify", async () => {
      const res = await approve(as("POST", { ...EDAPPAL, verification: { source: "manual-review" } }), ctx(appId));
      expect(res.status).toBe(400);
      expect(await q(`SELECT 1 FROM doctors`)).toHaveLength(0);
    });

    it("refuses to approve a registration number that is already listed", async () => {
      await insertDoctor({ nmc_reg_no: "TCMC-777" });
      const res = await approve(as("POST", { ...EDAPPAL }), ctx(appId));
      expect(res.status).toBe(409);
      expect((await json(res)).status).toBe("duplicate_registration");
    });

    it("requires a reason to reject, then refuses to approve the rejected application", async () => {
      expect((await reject(as("POST", { note: "" }), ctx(appId))).status).toBe(400);
      expect((await reject(as("POST", { note: "Not on the TCMC register." }), ctx(appId))).status).toBe(200);
      expect((await approve(as("POST", { ...EDAPPAL }), ctx(appId))).status).toBe(409);
      const list = await json<{ applications: unknown[] }>(
        await listApplications(request("GET", "/api/admin/applications?status=rejected", { cookie }))
      );
      expect(list.applications).toHaveLength(1);
    });

    it("is a 404 for an unknown application and a 400 for a bad id", async () => {
      expect((await getApplication(as("GET"), ctx(999))).status).toBe(404);
      expect((await approve(as("POST", { ...EDAPPAL }), ctx(999))).status).toBe(404);
      expect((await approve(as("POST", { ...EDAPPAL }), ctx("abc"))).status).toBe(400);
    });

    it("refuses to edit review scores through PATCH", async () => {
      const id = await insertDoctor();
      const res = await patchDoctor(as("PATCH", { review_avg: 5, review_count: 999 }), ctx(id));
      expect(res.status).toBe(400);
      expect((await q(`SELECT review_avg FROM doctors`))[0].review_avg).toBe(0);
    });

    /**
     * Regression (qa-report bug 3): two admins saving one number on two doctors
     * at once used to get a 500 from the unique index instead of a 409.
     */
    it("answers 409, not a crash, when two doctors are given one number at the same moment", async () => {
      const a = await insertDoctor();
      const b = await insertDoctor();
      await Promise.all(Array.from({ length: 4 }, () => q("SELECT pg_sleep(0.05)")));
      const results = await Promise.all([
        patchDoctor(as("PATCH", { nmc_reg_no: "TCMC-SAME" }), ctx(a)),
        patchDoctor(as("PATCH", { nmc_reg_no: "TCMC-SAME" }), ctx(b)),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    });

    it("refuses to edit sample records", async () => {
      const id = await insertDoctor({ is_sample: true, nmc_reg_no: null });
      expect((await patchDoctor(as("PATCH", { full_name: "Dr Real Now" }), ctx(id))).status).toBe(409);
    });
  });

  describe("doctor list and stats", () => {
    it("searches the doctor list", async () => {
      const cookie = await signIn();
      await insertDoctor({ full_name: "Dr Priya Nair", town: "Ponnani" });
      await insertDoctor({ full_name: "Dr Rahul", status: "hidden" });
      const get = async (qs: string) =>
        (await json<{ doctors: { full_name: string }[] }>(await listDoctors(request("GET", `/api/admin/doctors?${qs}`, { cookie })))).doctors.map(
          (d) => d.full_name
        );
      expect(await get("q=ponnani")).toEqual(["Dr Priya Nair"]);
      expect(await get("status=hidden")).toEqual(["Dr Rahul"]);
      expect((await get("")).length).toBe(2);
    });

    it("reports searches and supply", async () => {
      const cookie = await signIn();
      await insertDoctor({ specialty_slug: "dental" });
      await searchDoctors(request("GET", "/api/doctors?specialty=cardiology"));
      await eventually(async () => (await q(`SELECT 1 FROM daily_counters`)).length === 2);

      const res = await stats(request("GET", "/api/admin/stats?days=7", { cookie }));
      expect(res.status).toBe(200);
      const body = await json<{ days: number; counters: { name: string; value: number }[]; summary: { by_specialty: object } }>(res);
      expect(body.days).toBe(7);
      expect(body.counters.map((c) => c.name).sort()).toEqual(["search.empty.cardiology", "search.performed.cardiology"]);
      expect(body.summary.by_specialty).toEqual({ dental: 1 });
    });
  });
});
