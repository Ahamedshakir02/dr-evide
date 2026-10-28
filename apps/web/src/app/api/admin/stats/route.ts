import { NextRequest, NextResponse } from "next/server";
import { readCounters, readDataSummary } from "@dr-evide/db";
import { adminJson, requireAdmin } from "@/lib/admin-auth";

/**
 * GET /api/admin/stats?days=30
 *
 * The numbers the 90-day plan is steered by: searches, searches that found
 * nobody (per department — the recruiting list), and searches that ended in
 * a call or directions. Plus the supply side: real doctors per department.
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const days = Number(req.nextUrl.searchParams.get("days")) || 30;
  const [counters, summary] = await Promise.all([readCounters(days), readDataSummary()]);
  return adminJson({ days, counters, summary }, 200);
}
