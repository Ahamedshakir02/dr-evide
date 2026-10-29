import { NextRequest } from "next/server";
import { hashPassword } from "@/lib/admin-auth";
import { insertAdmin } from "../../../../packages/db/test/integration/harness";

/**
 * Calling the route handlers the way Next does: a NextRequest in, a Response
 * out. Everything behind the handler is real — Postgres, PostGIS, scrypt,
 * the session table — only the HTTP server is skipped.
 */

export const ORIGIN = "http://localhost:3000";

export interface CallOptions {
  body?: unknown;
  /** Raw body text, for malformed-JSON cases. */
  raw?: string;
  cookie?: string;
  /** null sends no Origin header at all. Defaults to this site. */
  origin?: string | null;
  /** The caller's address, as the edge proxy would append it. */
  ip?: string;
  headers?: Record<string, string>;
}

let ipSeq = 0;
/** A fresh caller address, so one test's rate-limit window does not leak into another. */
export const freshIp = () => `10.0.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;

export function request(method: string, path: string, o: CallOptions = {}): NextRequest {
  const headers = new Headers(o.headers);
  if (o.origin !== null) headers.set("origin", o.origin ?? ORIGIN);
  headers.set("x-forwarded-for", o.ip ?? freshIp());
  if (o.cookie) headers.set("cookie", o.cookie);
  let body: string | undefined;
  if (o.raw !== undefined) body = o.raw;
  else if (o.body !== undefined) body = JSON.stringify(o.body);
  if (body !== undefined) headers.set("content-type", "application/json");
  return new NextRequest(new URL(path, ORIGIN), { method, headers, body });
}

/** The second argument Next passes to a dynamic route. */
export const ctx = (id: string | number) => ({ params: Promise.resolve({ id: String(id) }) });

export async function json<T = Record<string, unknown>>(res: Response): Promise<T> {
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const ADMIN_PASSWORD = "a long and correct password";

/** An admin with a real scrypt hash, who can sign in through the login route. */
export async function createAdmin(email = "admin@example.com", name = "QA Admin", disabled = false) {
  return insertAdmin(email, name, await hashPassword(ADMIN_PASSWORD), disabled);
}

/** Sign in through POST /api/admin/login and return the Cookie header to send back. */
export async function signIn(email = "admin@example.com", password = ADMIN_PASSWORD): Promise<string> {
  const { POST } = await import("@/app/api/admin/login/route");
  const res = await POST(request("POST", "/api/admin/login", { body: { email, password } }));
  if (res.status !== 200) throw new Error(`sign-in failed: ${res.status} ${await res.text()}`);
  const c = res.cookies.get("dre_admin");
  if (!c?.value) throw new Error("sign-in set no session cookie");
  return `dre_admin=${c.value}`;
}

/** Wait for a fire-and-forget write (telemetry) to land. */
export async function eventually(check: () => Promise<boolean>, ms = 2_000): Promise<void> {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error("condition not met in time");
}
