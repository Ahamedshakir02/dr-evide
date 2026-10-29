import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import type { ZodType, ZodTypeDef } from "zod";
import { doctorIdSchema } from "@dr-evide/core";
import { DataUnavailableError } from "@dr-evide/db";

/** Small, shared plumbing for the route handlers that write. */

const MAX_BODY_BYTES = 32 * 1024;

export const noStore = { "cache-control": "no-store" };

export function jsonError(
  error: string,
  status: number,
  extra: Record<string, unknown> = {},
  headers: Record<string, string> = {}
) {
  return NextResponse.json({ error, ...extra }, { status, headers: { ...noStore, ...headers } });
}

/** The 429 every rate-limited route sends. */
export const tooMany = (retryAfter: number, message = "Too many requests. Please wait and try again.") =>
  jsonError(message, 429, {}, { "retry-after": String(retryAfter) });

/**
 * Parse a JSON body against a schema. Returns the data, or the 400 to send,
 * with a message per field so a form can put the error next to the input.
 */
export async function readJson<T>(
  req: NextRequest,
  schema: ZodType<T, ZodTypeDef, unknown>
): Promise<{ data: T } | NextResponse> {
  // JSON only. A cross-site <form> can send text/plain or urlencoded with no
  // preflight, but never application/json, so this closes form-based CSRF on
  // every write route and makes the browser ask CORS first for anything else.
  const type = req.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (type !== "application/json") return jsonError("Expected a JSON body.", 415);

  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return jsonError("Request too large.", 413);

  const raw = await req.text().catch(() => "");
  if (raw.length > MAX_BODY_BYTES) return jsonError("Request too large.", 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return jsonError("Expected a JSON body.", 400);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".") || "_";
      fields[key] ??= issue.message;
    }
    return jsonError("Some fields need attention.", 400, { fields });
  }
  return { data: parsed.data };
}

export async function readId(params: Promise<{ id: string }>): Promise<number | NextResponse> {
  const parsed = doctorIdSchema.safeParse((await params).id);
  return parsed.success ? parsed.data : jsonError("Invalid id.", 400);
}

/**
 * Turn "this deployment has no database" into a 503 rather than a 500, so a
 * missing DATABASE_URL in production reads as what it is.
 */
export async function guardData(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof DataUnavailableError) {
      return jsonError("The doctor directory is not available on this deployment.", 503);
    }
    throw e;
  }
}
