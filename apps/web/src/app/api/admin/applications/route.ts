import { NextRequest, NextResponse } from "next/server";
import { listApplications, type ApplicationStatus } from "@dr-evide/db";
import { adminJson, requireAdmin } from "@/lib/admin-auth";

const STATUSES = new Set(["pending", "approved", "rejected", "all"]);

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;

  const s = req.nextUrl.searchParams.get("status") ?? "pending";
  const status = (STATUSES.has(s) ? s : "pending") as ApplicationStatus | "all";
  return adminJson({ applications: await listApplications(status) }, 200);
}
