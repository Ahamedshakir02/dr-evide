import { NextRequest, NextResponse } from "next/server";
import { listingApplicationSchema, submitApplication } from "@dr-evide/db";
import { callerKey, rateLimit } from "@/lib/rate-limit";
import { count } from "@/lib/telemetry";
import { guardData, noStore, readJson, tooMany } from "@/lib/api";

/**
 * POST /api/listing-applications — a doctor asks to be listed.
 *
 * Public and unauthenticated, so: five per hour per caller, a body cap, a
 * honeypot field, and nothing public until an admin has reviewed it. The
 * response never says whether a registration number is already on file
 * beyond "duplicate", and never echoes the contact email.
 */
const LIMIT = 5;
const WINDOW_MS = 60 * 60_000;

export async function POST(req: NextRequest) {
  const { ok, retryAfter } = await rateLimit(`listing:${callerKey(req)}`, LIMIT, WINDOW_MS);
  if (!ok) {
    count("ratelimit.rejected");
    return tooMany(retryAfter, "Too many submissions. Please try again later.");
  }

  const parsed = await readJson(
    req,
    listingApplicationSchema.extend({
      // Hidden from people by the form; filled in by bots that fill everything.
      website: listingApplicationSchema.shape.clinic_name,
    })
  );
  if (parsed instanceof NextResponse) return parsed;

  const { website, ...input } = parsed.data;
  if (website) {
    // Answer as if it worked. Telling a bot it was caught teaches it.
    return NextResponse.json({ status: "saved" }, { status: 201, headers: noStore });
  }

  return guardData(async () => {
    const result = await submitApplication(input);
    if (result.status === "saved") count("listing.submitted");
    return NextResponse.json(
      { status: result.status },
      { status: result.status === "saved" ? 201 : 200, headers: noStore }
    );
  });
}
