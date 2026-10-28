import "server-only";
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  DataUnavailableError,
  createAdminSession,
  deleteAdminSession,
  findAdminByEmail,
  getAdminBySession,
  type AdminUser,
} from "@dr-evide/db";

/**
 * Sign-in for the admin console.
 *
 * Email + password, checked against admin_users, then an opaque random session
 * token in an httpOnly cookie. Only the SHA-256 of the token is stored, so the
 * sessions table is useless to anyone who reads it.
 *
 * Considered and rejected: a JWT. Revoking one before it expires needs a
 * server-side list anyway, at which point it is a session table with extra
 * cryptography. Signing out, or disabling an admin, has to take effect now.
 *
 * Considered and rejected: an OAuth provider. It is the better end state for a
 * team, but it ties sign-in to an account Shakir has to create and configure
 * before the console works at all. Swapping it in later only replaces
 * `login()`; sessions, CSRF and the routes stay.
 */

const scrypt = promisify(scryptCb) as (
  pw: string,
  salt: Buffer,
  len: number,
  opts: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

/** Shared with packages/db/create-admin.mjs, which writes the same format. */
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEY_LEN, SCRYPT);
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password, Buffer.from(salt, "base64"), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT.maxmem,
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/**
 * Compared against when the email is unknown, so a wrong email and a wrong
 * password take the same time and an attacker cannot list which addresses
 * are admins by timing the response.
 */
let dummyHash: Promise<string> | null = null;

export const SESSION_TTL_MS = 12 * 60 * 60_000;

/**
 * `__Host-` pins the cookie to this exact origin over HTTPS with no Domain
 * attribute, so a sibling subdomain cannot set or read it. Browsers refuse
 * the prefix on plain http, so development uses a bare name.
 */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-dre_admin" : "dre_admin";

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export type LoginResult = { ok: true; admin: AdminUser; token: string } | { ok: false };

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await findAdminByEmail(email);
  if (!user || user.disabled) {
    dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
    await verifyPassword(password, await dummyHash);
    return { ok: false };
  }
  if (!(await verifyPassword(password, user.password_hash))) return { ok: false };

  const token = randomBytes(32).toString("base64url");
  await createAdminSession(user.id, sha256(token), SESSION_TTL_MS);
  return { ok: true, admin: { id: user.id, email: user.email, name: user.name }, token };
}

export function setSessionCookie(res: NextResponse, token: string): void {
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function logout(req: NextRequest, res: NextResponse): Promise<void> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) await deleteAdminSession(sha256(token)).catch(() => {});
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
}

/** The signed-in admin for a server component or route, or null. */
export async function currentAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await getAdminBySession(sha256(token));
  } catch (e) {
    if (e instanceof DataUnavailableError) return null;
    throw e;
  }
}

/**
 * State-changing admin requests must come from this site.
 *
 * SameSite=Strict already keeps the cookie off cross-site requests in every
 * current browser; this is the second lock, for the browsers and proxies where
 * that assumption fails. A request with no Origin header at all is refused
 * too — every browser sends one on a POST, so its absence means a script.
 */
export function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const allowed = new Set([req.nextUrl.origin]);
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
    } catch {
      /* a malformed setting allows nothing extra */
    }
  }
  return allowed.has(origin);
}

const json = (body: unknown, status: number) =>
  NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });

/**
 * Gate for every /api/admin route. Returns the admin, or the response to send.
 *
 *     const auth = await requireAdmin(req);
 *     if (auth instanceof NextResponse) return auth;
 */
export async function requireAdmin(req: NextRequest): Promise<AdminUser | NextResponse> {
  if (req.method !== "GET" && req.method !== "HEAD" && !sameOrigin(req)) {
    return json({ error: "Cross-origin request refused." }, 403);
  }
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return json({ error: "Sign in required." }, 401);
  try {
    const admin = await getAdminBySession(sha256(token));
    return admin ?? json({ error: "Your session has expired. Sign in again." }, 401);
  } catch (e) {
    if (e instanceof DataUnavailableError) return json({ error: "No database configured." }, 503);
    throw e;
  }
}

export { json as adminJson };
