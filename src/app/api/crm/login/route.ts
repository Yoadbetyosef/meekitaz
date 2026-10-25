import { NextResponse } from "next/server";
import { CRM_COOKIE, crmToken } from "@/lib/crmAuth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (!process.env.CRM_PASSWORD || password !== process.env.CRM_PASSWORD) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CRM_COOKIE, crmToken(), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  return res;
}
export async function DELETE() { const res = NextResponse.json({ ok: true }); res.cookies.delete(CRM_COOKIE); return res; }
