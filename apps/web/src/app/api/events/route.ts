import { NextRequest, NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rate-limit";
import { count, type Counter } from "@/lib/telemetry";
import { tooMany } from "@/lib/api";

/**
 * POST /api/events — the reader did something worth counting.
 *
 * A closed list of event names and nothing else: no doctor id, no specialty,
 * no page, no session. Anything not on the list is a 400, so this endpoint can
 * never become a way to write arbitrary strings into daily_counters.
 *
 * Sent with navigator.sendBeacon from the profile page, so it must accept a
 * text/plain body as well as JSON.
 */
const EVENTS = {
  profile_view: "contact.profile_view",
  call: "contact.call",
  directions: "contact.directions",
} as const satisfies Record<string, Counter>;

const LIMIT = 60;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const { ok, retryAfter } = await rateLimit(`events:${callerKey(req)}`, LIMIT, WINDOW_MS);
  if (!ok) return tooMany(retryAfter);

  const raw = (await req.text().catch(() => "")).slice(0, 200);
  let event: unknown;
  try {
    event = (JSON.parse(raw) as { event?: unknown })?.event;
  } catch {
    event = undefined;
  }

  if (typeof event !== "string" || !Object.hasOwn(EVENTS, event)) {
    return NextResponse.json({ error: "Unknown event." }, { status: 400 });
  }
  count(EVENTS[event as keyof typeof EVENTS]);
  return new NextResponse(null, { status: 204 });
}
