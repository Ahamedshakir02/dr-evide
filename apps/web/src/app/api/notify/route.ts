import { NextRequest, NextResponse } from "next/server";
import { isLang } from "@dr-evide/core";
import { recordLaunchInterest } from "@dr-evide/db";
import { callerKey, rateLimit } from "@/lib/rate-limit";
import { count } from "@/lib/telemetry";

/**
 * The landing page's "tell me when it's out" form.
 *
 * Three per hour per caller. Nobody signs up four times in an hour, and the
 * form is an unauthenticated write to a table — the one thing on this site a
 * script could fill with junk.
 */
const LIMIT = 3;
const WINDOW_MS = 60 * 60_000;

/**
 * Validated by hand rather than by a schema in @dr-evide/core.
 *
 * Core is for what both apps run; a website waitlist is not that. The check is
 * deliberately shallow — one @, something either side, a dot in the domain, and
 * a sane length. Anything stricter rejects real addresses (they are stranger
 * than most regexes allow) to catch typos that only a confirmation email can
 * actually catch.
 */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
const MAX_EMAIL_LENGTH = 254; // RFC 5321 path limit.

export async function POST(req: NextRequest) {
  const { ok, retryAfter } = await rateLimit(`notify:${callerKey(req)}`, LIMIT, WINDOW_MS);
  if (!ok) {
    count("ratelimit.rejected");
    return NextResponse.json(
      { status: "rate_limited" },
      { status: 429, headers: { "retry-after": String(retryAfter) } }
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { email?: unknown; lang?: unknown }
    | null;

  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL.test(email)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const lang = isLang(body?.lang) ? body.lang : "en";

  const result = await recordLaunchInterest(email, lang);
  count(
    result === "unconfigured"
      ? "notify.unconfigured"
      : result === "failed"
        ? "notify.failed"
        : "notify.stored"
  );

  // 200 for "duplicate" — from the reader's side, being on the list twice and
  // being on it once are the same outcome, and a 409 would only tell a scraper
  // which addresses are already here.
  const status = result === "unconfigured" ? 503 : result === "failed" ? 500 : 200;

  // The address is never echoed back. Nothing here should end up in a cache
  // either — it is the one identifier this product holds.
  return NextResponse.json(
    { status: result },
    { status, headers: { "cache-control": "no-store" } }
  );
}
