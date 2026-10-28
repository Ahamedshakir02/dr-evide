import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as searchDoctors } from "@/app/api/doctors/route";
import { GET as getDoctorRoute } from "@/app/api/doctors/[id]/route";
import { GET as health } from "@/app/api/health/route";
import { POST as notify } from "@/app/api/notify/route";
import { POST as apply } from "@/app/api/listing-applications/route";
import { POST as events } from "@/app/api/events/route";
import { POST as routeSymptom } from "@/app/api/route-symptom/route";
import { __resetMemoryStore } from "@/lib/rate-limit";
import {
  EDAPPAL,
  applicationBody,
  closePool,
  hasDatabase,
  insertDoctor,
  northOfEdappal,
  q,
  resetDatabase,
  setUpDatabase,
} from "../../../../packages/db/test/integration/harness";
import { ctx, eventually, json, request } from "./http";

/**
 * Every public endpoint, through its route handler, against a real database.
 * No Redis and no Anthropic key: the in-process limiter and keyword routing,
 * which is what a fresh deployment runs until those are configured.
 */

describe.skipIf(!hasDatabase)("public API", () => {
  beforeAll(async () => {
    delete process.env.REDIS_URL;
    delete process.env.ANTHROPIC_API_KEY;
    await setUpDatabase();
  });
  beforeEach(async () => {
    __resetMemoryStore();
    await resetDatabase();
  });
  afterAll(closePool);

  describe("GET /api/health", () => {
    it("is ok with the database up", async () => {
      const res = await health();
      expect(res.status).toBe(200);
      expect(await json(res)).toMatchObject({ status: "ok", database: "ok" });
    });
  });

  describe("GET /api/doctors", () => {
    const url = (qs: string) => `/api/doctors?${qs}`;

    it("ranks real doctors in range and says they are not sample data", async () => {
      await insertDoctor({ full_name: "Dr Close", ...northOfEdappal(1) });
      await insertDoctor({ full_name: "Dr Trusted", ...northOfEdappal(4), nmc_verified: true, review_count: 40, review_avg: 4.8 });
      await insertDoctor({ full_name: "Dr Outside", ...northOfEdappal(20) });

      const res = await searchDoctors(request("GET", url(`specialty=dermatology&lat=${EDAPPAL.lat}&lng=${EDAPPAL.lng}&radius=10`)));
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("private, max-age=30");
      const body = await json<{ count: number; sample_data: boolean; doctors: { full_name: string; trust_score: number }[] }>(res);
      expect(body.count).toBe(2);
      expect(body.sample_data).toBe(false);
      // Ranked by TrustScore, not distance: the verified, well-reviewed doctor
      // is first even though the other is closer.
      expect(body.doctors.map((d) => d.full_name)).toEqual(["Dr Trusted", "Dr Close"]);
    });

    it("counts the search, and an empty one, in daily_counters", async () => {
      await searchDoctors(request("GET", url("specialty=cardiology")));
      await eventually(async () => (await q(`SELECT 1 FROM daily_counters`)).length === 2);
      const rows = await q(`SELECT name, value FROM daily_counters ORDER BY name`);
      expect(rows).toEqual([
        { name: "search.empty.cardiology", value: "1" },
        { name: "search.performed.cardiology", value: "1" },
      ]);
    });

    it("is a 400 for an unknown specialty and clamps a silly radius", async () => {
      expect((await searchDoctors(request("GET", url("specialty=astrology")))).status).toBe(400);
      const res = await searchDoctors(request("GET", url("specialty=dental&radius=9999")));
      expect((await json(res)).radius_km).toBe(25);
    });

    it("rate-limits one caller to 60 searches a minute", async () => {
      const ip = "203.0.113.9";
      for (let i = 0; i < 60; i++) {
        expect((await searchDoctors(request("GET", url("specialty=ent"), { ip }))).status).toBe(200);
      }
      const res = await searchDoctors(request("GET", url("specialty=ent"), { ip }));
      expect(res.status).toBe(429);
      expect(Number(res.headers.get("retry-after"))).toBeGreaterThan(0);
    });
  });

  describe("GET /api/doctors/[id]", () => {
    it("returns a published doctor", async () => {
      const id = await insertDoctor({ full_name: "Dr Profile" });
      const res = await getDoctorRoute(request("GET", `/api/doctors/${id}`), ctx(id));
      expect(res.status).toBe(200);
      expect((await json<{ doctor: { full_name: string } }>(res)).doctor.full_name).toBe("Dr Profile");
    });

    it("is a 404 for a hidden or missing doctor, and a 400 for a bad id", async () => {
      const hidden = await insertDoctor({ status: "hidden" });
      expect((await getDoctorRoute(request("GET", "/"), ctx(hidden))).status).toBe(404);
      expect((await getDoctorRoute(request("GET", "/"), ctx(999))).status).toBe(404);
      expect((await getDoctorRoute(request("GET", "/"), ctx("abc"))).status).toBe(400);
      expect((await getDoctorRoute(request("GET", "/"), ctx("-1"))).status).toBe(400);
    });

    /**
     * Regression (qa-report bug 1): an id past the int range used to reach
     * Postgres, overflow the column and crash the handler.
     */
    it("is a 400 or 404, not a crash, for an id past the int range", async () => {
      const res = await getDoctorRoute(request("GET", "/"), ctx("99999999999"));
      expect([400, 404]).toContain(res.status);
    });
  });

  describe("POST /api/listing-applications", () => {
    it("files an application (201) and never echoes the contact email", async () => {
      const res = await apply(request("POST", "/api/listing-applications", { body: applicationBody() }));
      expect(res.status).toBe(201);
      const text = await res.text();
      expect(JSON.parse(text)).toEqual({ status: "saved" });
      expect(text).not.toContain("@");
      expect(await q(`SELECT status FROM listing_applications`)).toEqual([{ status: "pending" }]);
      await eventually(async () => (await q(`SELECT 1 FROM daily_counters WHERE name = 'listing.submitted'`)).length === 1);
    });

    it("answers 200 duplicate for a registration number already waiting", async () => {
      const body = applicationBody();
      await apply(request("POST", "/", { body }));
      const res = await apply(request("POST", "/", { body }));
      expect(res.status).toBe(200);
      expect(await json(res)).toEqual({ status: "duplicate" });
    });

    it("explains each field that is wrong", async () => {
      const res = await apply(
        request("POST", "/", {
          body: applicationBody({ consent: false, phone: "call me", contact_email: "nope", nmc_reg_no: "x" }),
        })
      );
      expect(res.status).toBe(400);
      const { fields } = await json<{ fields: Record<string, string> }>(res);
      expect(Object.keys(fields).sort()).toEqual(["consent", "contact_email", "nmc_reg_no", "phone"]);
      expect(fields.consent).toMatch(/consent/);
      expect(await q(`SELECT 1 FROM listing_applications`)).toHaveLength(0);
    });

    it("rejects a future registration year and an unknown specialty", async () => {
      const res = await apply(
        request("POST", "/", { body: applicationBody({ reg_year: new Date().getFullYear() + 1, specialty_slug: "astrology" }) })
      );
      expect(Object.keys((await json<{ fields: object }>(res)).fields).sort()).toEqual(["reg_year", "specialty_slug"]);
    });

    it("is a 400 for malformed JSON and a 413 for an oversized body", async () => {
      expect((await apply(request("POST", "/", { raw: "{not json" }))).status).toBe(400);
      const big = applicationBody({ address: "x".repeat(40_000) });
      expect((await apply(request("POST", "/", { body: big }))).status).toBe(413);
    });

    it("pretends to accept a bot that fills the honeypot, and stores nothing", async () => {
      const res = await apply(request("POST", "/", { body: applicationBody({ website: "http://spam.example" }) }));
      expect(res.status).toBe(201);
      expect(await q(`SELECT 1 FROM listing_applications`)).toHaveLength(0);
    });

    it("allows five submissions an hour per caller", async () => {
      const ip = "198.51.100.7";
      for (let i = 0; i < 5; i++) {
        expect((await apply(request("POST", "/", { ip, body: applicationBody() }))).status).toBe(201);
      }
      expect((await apply(request("POST", "/", { ip, body: applicationBody() }))).status).toBe(429);
    });
  });

  describe("POST /api/notify", () => {
    it("stores an address once and says so", async () => {
      const send = (email: string) => notify(request("POST", "/api/notify", { body: { email, lang: "ml" } }));
      const first = await send("Reader@Example.com");
      expect(first.status).toBe(200);
      expect(await json(first)).toEqual({ status: "saved" });
      expect(await json(await send("reader@example.com"))).toEqual({ status: "duplicate" });
      expect(await q(`SELECT email, lang FROM launch_notifications`)).toEqual([
        { email: "reader@example.com", lang: "ml" },
      ]);
    });

    it("is a 400 for something that is not an email", async () => {
      expect((await notify(request("POST", "/", { body: { email: "not-an-email" } }))).status).toBe(400);
      expect((await notify(request("POST", "/", { raw: "garbage" }))).status).toBe(400);
    });
  });

  describe("POST /api/events", () => {
    it("counts a known event and refuses anything else", async () => {
      expect((await events(request("POST", "/", { body: { event: "call" } }))).status).toBe(204);
      expect((await events(request("POST", "/", { body: { event: "drop table" } }))).status).toBe(400);
      expect((await events(request("POST", "/", { body: { event: "__proto__" } }))).status).toBe(400);
      await eventually(async () => (await q(`SELECT 1 FROM daily_counters WHERE name = 'contact.call'`)).length === 1);
    });
  });

  describe("POST /api/route-symptom", () => {
    it("routes a skin complaint to dermatology without a model, and stores nothing", async () => {
      const res = await routeSymptom(request("POST", "/", { body: { text: "itchy red rash on my arm" } }));
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe("no-store");
      const body = await json<{ specialties: { slug: string }[] }>(res);
      expect(body.specialties[0].slug).toBe("dermatology");
      expect(JSON.stringify(await q(`SELECT * FROM daily_counters`))).not.toMatch(/rash/);
    });

    it("is a 400 for an empty description", async () => {
      expect((await routeSymptom(request("POST", "/", { body: { text: " " } }))).status).toBe(400);
    });
  });
});
