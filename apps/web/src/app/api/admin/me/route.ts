import { NextRequest, NextResponse } from "next/server";
import { adminJson, requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  return adminJson({ admin }, 200);
}
