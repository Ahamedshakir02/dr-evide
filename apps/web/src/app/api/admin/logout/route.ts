import { NextRequest, NextResponse } from "next/server";
import { logout, sameOrigin } from "@/lib/admin-auth";
import { jsonError, noStore } from "@/lib/api";

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return jsonError("Cross-origin request refused.", 403);
  const res = NextResponse.json({ ok: true }, { headers: noStore });
  await logout(req, res);
  return res;
}
