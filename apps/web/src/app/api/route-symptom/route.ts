import { NextRequest, NextResponse } from "next/server";
import { routeSymptomSchema } from "@dr-evide/core";
import { routeSymptom } from "@/lib/llm-routing";
import { callerKey, rateLimit } from "@/lib/rate-limit";

/** 20 routings per minute per caller — far above real use, far below a runaway loop. */
const LIMIT = 20;
const WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const { ok, retryAfter } = rateLimit(callerKey(req), LIMIT, WINDOW_MS);
  if (!ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "retry-after": String(retryAfter) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = routeSymptomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please describe your problem in a few words." },
      { status: 400 }
    );
  }

  const result = await routeSymptom(parsed.data.text);

  // The symptom text is sensitive personal data under the DPDP Act 2023: it is
  // classified in memory and never persisted, never logged, and never echoed
  // back in the response or the URL. no-store keeps it out of shared caches too.
  return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
}
