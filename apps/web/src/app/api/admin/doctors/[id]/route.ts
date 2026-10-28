import { NextRequest, NextResponse } from "next/server";
import { deleteDoctor, doctorEditSchema, getDoctorForAdmin, updateDoctor } from "@dr-evide/db";
import { adminJson, requireAdmin } from "@/lib/admin-auth";
import { readId, readJson } from "@/lib/api";
import { reviewResponse } from "@/lib/admin-responses";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = await readId(params);
  if (id instanceof NextResponse) return id;

  const doctor = await getDoctorForAdmin(id);
  return doctor ? adminJson({ doctor }, 200) : reviewResponse("not_found");
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = await readId(params);
  if (id instanceof NextResponse) return id;
  const body = await readJson(req, doctorEditSchema);
  if (body instanceof NextResponse) return body;

  const result = await updateDoctor(id, body.data, admin);
  return result.status === "ok" ? adminJson(result, 200) : reviewResponse(result.status);
}

/** Removal on request. Permanent; the console asks twice before calling it. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  const id = await readId(params);
  if (id instanceof NextResponse) return id;

  const result = await deleteDoctor(id, admin);
  return result.status === "ok" ? adminJson(result, 200) : reviewResponse(result.status);
}
