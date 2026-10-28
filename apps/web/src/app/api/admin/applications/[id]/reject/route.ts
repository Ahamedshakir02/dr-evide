import { NextRequest, NextResponse } from "next/server";
import { rejectApplication, rejectionSchema } from "@dr-evide/db";
import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { readId, readJson } from "@/lib/api";
import { reviewResponse } from "@/lib/admin-responses";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = await readId(params);
  if (id instanceof NextResponse) return id;
  const body = await readJson(req, rejectionSchema);
  if (body instanceof NextResponse) return body;

  const result = await rejectApplication(id, body.data.note, admin);
  return result.status === "ok" ? adminJson(result, 200) : reviewResponse(result.status);
}
