import { NextRequest, NextResponse } from "next/server";
import {
  SCORE_VERSION,
  SPECIALTIES,
  doctorSearchSchema,
  rankDoctors,
  type SpecialtySlug,
} from "@dr-evide/core";
import { findDoctors, isSampleMode } from "@dr-evide/db";

export async function GET(req: NextRequest) {
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

  return NextResponse.json({
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
  });
}
