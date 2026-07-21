import { NextRequest, NextResponse } from "next/server";
import { doctorIdSchema } from "@dr-evide/core";
import { getDoctor } from "@dr-evide/db";

// Next 15: route params are a Promise and must be awaited.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const parsed = doctorIdSchema.safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const doctor = await getDoctor(parsed.data);
  if (!doctor) return NextResponse.json({ error: "Doctor not found." }, { status: 404 });

  return NextResponse.json({ doctor });
}
