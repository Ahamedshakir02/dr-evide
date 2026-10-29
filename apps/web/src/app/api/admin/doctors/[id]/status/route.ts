import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setDoctorStatus } from "@dr-evide/db";
import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { readId, readJson } from "@/lib/api";
import { reviewResponse } from "@/lib/admin-responses";

const schema = z.object({ status: z.enum(["published", "hidden"]) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = await readId(params);
  if (id instanceof NextResponse) return id;
  const body = await readJson(req, schema);
  if (body instanceof NextResponse) return body;

  const result = await setDoctorStatus(id, body.data.status, admin);
  return result.status === "ok" ? adminJson(result, 200) : reviewResponse(result.status);
}
