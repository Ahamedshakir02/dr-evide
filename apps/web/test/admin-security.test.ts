import { describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * The CSRF and session gates in front of every admin write.
 *
 * The database is mocked: what is checked here is that a request is turned
 * away before it can reach it, and that the session cookie is cleared in a way
 * a browser will actually accept.
 */

const { getAdminBySession } = vi.hoisted(() => ({ getAdminBySession: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@dr-evide/db", () => ({
  DataUnavailableError: class extends Error {},
  createAdminSession: vi.fn(),
  deleteAdminSession: vi.fn(async () => {}),
  findAdminByEmail: vi.fn(),
  getAdminBySession,
}));

const { sameOrigin, requireAdmin, logout } = await import("../src/lib/admin-auth");
const { readJson } = await import("../src/lib/api");

const SITE = "http://localhost:3000";
const req = (method: string, headers: Record<string, string> = {}, body?: string) =>
  new NextRequest(`${SITE}/api/admin/doctors/1`, { method, headers, body });

describe("sameOrigin", () => {
  it("accepts a same-origin browser request", () => {
    expect(sameOrigin(req("POST", { origin: SITE, "sec-fetch-site": "same-origin" }))).toBe(true);
  });
  it("refuses another origin", () => {
    expect(sameOrigin(req("POST", { origin: "https://evil.example" }))).toBe(false);
  });
  it("refuses a request with no Origin", () => {
    expect(sameOrigin(req("POST"))).toBe(false);
  });
  it("refuses when fetch metadata says cross-site, whatever Origin says", () => {
    expect(sameOrigin(req("POST", { origin: SITE, "sec-fetch-site": "cross-site" }))).toBe(false);
    expect(sameOrigin(req("POST", { origin: SITE, "sec-fetch-site": "same-site" }))).toBe(false);
  });
});

describe("requireAdmin", () => {
  it("refuses a cross-origin write before looking at the session", async () => {
    getAdminBySession.mockClear();
    const res = await requireAdmin(req("DELETE", { origin: "https://evil.example" }));
    expect(res).toBeInstanceOf(NextResponse);
    expect((res as NextResponse).status).toBe(403);
    expect(getAdminBySession).not.toHaveBeenCalled();
  });

  it("does not query the database for a malformed token", async () => {
    getAdminBySession.mockClear();
    const res = await requireAdmin(req("GET", { cookie: "dre_admin=' OR 1=1 --" }));
    expect((res as NextResponse).status).toBe(401);
    expect(getAdminBySession).not.toHaveBeenCalled();
  });

  it("rate-limits writes per admin", async () => {
    getAdminBySession.mockResolvedValue({ id: 7, email: "a@b.co", name: "A" });
    const token = "a".repeat(43);
    const write = () =>
      requireAdmin(req("POST", { origin: SITE, cookie: `dre_admin=${token}` }));
    for (let i = 0; i < 60; i++) expect(await write()).not.toBeInstanceOf(NextResponse);
    const res = (await write()) as NextResponse;
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBeTruthy();
  });
});

describe("logout", () => {
  it("clears the cookie with the same attributes it was set with", async () => {
    const res = NextResponse.json({});
    await logout(req("POST", { cookie: `dre_admin=${"b".repeat(43)}` }), res);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/Max-Age=0/i);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=strict/i);
    expect(cookie).toMatch(/Path=\//i);
  });
});

describe("readJson", () => {
  const schema = z.object({ a: z.number() });
  it("refuses a text/plain body, which a cross-site form can send", async () => {
    const res = await readJson(req("POST", { "content-type": "text/plain" }, '{"a":1}'), schema);
    expect((res as NextResponse).status).toBe(415);
  });
  it("accepts application/json with a charset", async () => {
    const res = await readJson(
      req("POST", { "content-type": "application/json; charset=utf-8" }, '{"a":1}'),
      schema
    );
    expect(res).toEqual({ data: { a: 1 } });
  });
});
