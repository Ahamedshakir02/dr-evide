import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_LOCATION, DEFAULT_RADIUS_KM, findDoctors } from "@/lib/db";
import { rankDoctors } from "@/lib/ranking";
import { SPECIALTIES } from "@/lib/taxonomy";
import type { SpecialtySlug } from "@/lib/types";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const specialty = sp.get("specialty") as SpecialtySlug | null;
  if (!specialty || !(specialty in SPECIALTIES)) {
    return NextResponse.json({ error: "Unknown specialty." }, { status: 400 });
  }

  const lat = parseFloat(sp.get("lat") ?? "") || DEFAULT_LOCATION.lat;
  const lng = parseFloat(sp.get("lng") ?? "") || DEFAULT_LOCATION.lng;
  const radiusKm = Math.min(Math.max(parseFloat(sp.get("radius") ?? "") || DEFAULT_RADIUS_KM, 1), 100);
  const conditions = (sp.get("conditions") ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const doctors = await findDoctors({ specialty, lat, lng, radiusKm });
  const ranked = rankDoctors(doctors, conditions, radiusKm);

  return NextResponse.json({
    specialty: { slug: specialty, ...SPECIALTIES[specialty] },
    radius_km: radiusKm,
    count: ranked.length,
    doctors: ranked,
  });
}
