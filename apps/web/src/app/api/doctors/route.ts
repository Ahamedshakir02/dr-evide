import { NextRequest, NextResponse } from "next/server";
import {
  SCORE_VERSION,
  SPECIALTIES,
  doctorSearchSchema,
  rankDoctors,
  type SpecialtySlug,
} from "@dr-evide/core";
import { findDoctors, isSampleMode } from "@dr-evide/db";
import { callerKey, rateLimit } from "@/lib/rate-limit";
import { count } from "@/lib/telemetry";

/**
 * Public, unauthenticated, and backed by a PostGIS radius scan, so it gets a
 * ceiling too. Looser than /api/route-symptom because dragging the radius
 * slider legitimately fires a burst — this guards against a scripted loop, not
 * against a person searching.
 */
const LIMIT = 60;
const WINDOW_MS = 60_000;

export async function GET(req: NextRequest) {
  const { ok, retryAfter } = rateLimit(`doctors:${callerKey(req)}`, LIMIT, WINDOW_MS);
  if (!ok) {
    count("ratelimit.rejected");
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "retry-after": String(retryAfter) } }
    );
  }

  const parsed = doctorSearchSchema.safeParse(
    Object.fromEntries(req.nextUrl.searchParams)
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown specialty." }, { status: 400 });
  }

  const { specialty, lat, lng, radius, conditions } = parsed.data;
  const slug = specialty as SpecialtySlug;

  const doctors = await findDoctors({ specialty: slug, lat, lng, radiusKm: radius });

  // The year is passed in rather than read inside scoring, so the same search
  // always produces the same numbers — see RankingContext in @dr-evide/core.
  const asOfYear = new Date().getFullYear();
  const ranked = rankDoctors(doctors, {
    matchedConditions: conditions,
    radiusKm: radius,
    asOfYear,
  });

  return NextResponse.json(
    {
      specialty: { slug, ...SPECIALTIES[slug] },
      radius_km: radius,
      count: ranked.length,
      // Returned so the card's "12 yrs" is computed from the same year that
      // produced the experience component of the score beside it.
      as_of_year: asOfYear,
      // Surfaced so the UI can say which weighting produced these numbers, and so
      // a stale client is detectable after a weights change.
      score_version: SCORE_VERSION,
      // Tells the client these are fictional placeholder records, not real doctors.
      sample_data: isSampleMode(),
      doctors: ranked,
    },
    {
      /**
       * The query carries the caller's coordinates and their routed conditions,
       * so this response is personal to one request. `private` keeps it out of
       * any shared cache; the short max-age still absorbs the burst that
       * dragging the radius slider produces.
       */
      headers: { "cache-control": "private, max-age=30" },
    }
  );
}
