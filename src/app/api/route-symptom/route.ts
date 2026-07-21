import { NextRequest, NextResponse } from "next/server";
import { routeSymptom } from "@/lib/routing";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = body?.text;
  if (!text || typeof text !== "string" || text.trim().length < 3) {
    return NextResponse.json({ error: "Please describe your problem in a few words." }, { status: 400 });
  }
  const result = await routeSymptom(text.slice(0, 500));
  return NextResponse.json(result);
}
