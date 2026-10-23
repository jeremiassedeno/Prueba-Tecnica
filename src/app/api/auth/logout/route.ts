import { NextResponse } from "next/server";
import { destroySession, sameOrigin } from "@/lib/auth";
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
  await destroySession();
  return NextResponse.json({ ok: true });
}
