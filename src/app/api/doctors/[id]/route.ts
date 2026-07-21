import { NextRequest, NextResponse } from "next/server";
import { getDoctor } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  const doctor = await getDoctor(id);
  if (!doctor) return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
  return NextResponse.json({ doctor });
}
