import { NextRequest, NextResponse } from "next/server";
import { listDoctorsForAdmin, type DoctorStatus } from "@dr-evide/db";
import { adminJson, requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const sp = req.nextUrl.searchParams;
  const status = sp.get("status");
  const verified = sp.get("verified");
  const doctors = await listDoctorsForAdmin({
    q: sp.get("q")?.slice(0, 100) ?? undefined,
    status: status === "published" || status === "hidden" ? (status as DoctorStatus) : "all",
    verified: verified === "true" ? true : verified === "false" ? false : undefined,
    includeSample: sp.get("sample") === "true",
  });
  return adminJson({ doctors }, 200);
}
