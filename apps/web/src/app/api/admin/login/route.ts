import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@dr-evide/db";
import { login, sameOrigin, setSessionCookie } from "@/lib/admin-auth";
import { callerKey, rateLimit } from "@/lib/rate-limit";
import { count } from "@/lib/telemetry";
import { guardData, jsonError, noStore, readJson, tooMany } from "@/lib/api";

/**
 * POST /api/admin/login
 *
 * Two limits, because they stop different attacks: per caller (one machine
 * guessing many passwords) and per account (many machines guessing one
 * admin's password). The per-account limit can be used to lock an admin out
 * for fifteen minutes; that is the trade for not being guessable.
 */
const WINDOW_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Cross-origin request refused.", 403);

  const byCaller = await rateLimit(`login:ip:${callerKey(req)}`, 10, WINDOW_MS);
  if (!byCaller.ok) return tooMany(byCaller.retryAfter, "Too many attempts. Try again later.");

  const parsed = await readJson(req, loginSchema);
  if (parsed instanceof NextResponse) return parsed;
  const { email, password } = parsed.data;

  const byAccount = await rateLimit(`login:acct:${email}`, 5, WINDOW_MS);
  if (!byAccount.ok) return tooMany(byAccount.retryAfter, "Too many attempts. Try again later.");

  return guardData(async () => {
    const result = await login(email, password);
    if (!result.ok) {
      count("admin.login_failed");
      // One message for every failure: no hint which half was wrong.
      return jsonError("Email or password is incorrect.", 401);
    }
    const res = NextResponse.json({ admin: result.admin }, { headers: noStore });
    setSessionCookie(res, result.token);
    return res;
  });
}
