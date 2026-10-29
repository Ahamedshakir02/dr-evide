import { NextRequest, NextResponse } from "next/server";
import { getApplication } from "@dr-evide/db";
import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { readId } from "@/lib/api";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = await readId(params);
  if (id instanceof NextResponse) return id;

  const application = await getApplication(id);
  return application
    ? adminJson({ application }, 200)
    : adminJson({ error: "Application not found." }, 404);
}
