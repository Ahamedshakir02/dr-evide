import { NextResponse } from "next/server";
import { SCORE_VERSION } from "@dr-evide/core";
import { checkDatabase } from "@dr-evide/db";
import { snapshot } from "@/lib/telemetry";

export const dynamic = "force-dynamic";

/**
 * Liveness, plus the two facts that are otherwise invisible from outside.
 *
 * `database: "sample"` means the app is serving fictional records — it is
 * working exactly as designed with no DATABASE_URL, and it is also the state
 * you must never be in on launch day without knowing.
 *
 * `counters` is the whole of the product's observability: names and integers,
 * no payloads, no user text (see lib/telemetry.ts). They answer the question
 * the deliberately silent LLM fallback cannot — is symptom routing actually
 * reaching the model, or has it been keyword-only since the key expired?
 *
 * Unauthenticated, so it deliberately exposes nothing about any individual: no
 * request contents, no identities, no per-caller figures.
 */
export async function GET() {
  const database = await checkDatabase();

  return NextResponse.json(
    {
      status: database === "unreachable" ? "degraded" : "ok",
      database,
      score_version: SCORE_VERSION,
      counters: snapshot(),
    },
    {
      // 503 when the database is down, so a load balancer or uptime check reads
      // the status code rather than having to parse the body.
      status: database === "unreachable" ? 503 : 200,
      headers: { "cache-control": "no-store" },
    }
  );
}
