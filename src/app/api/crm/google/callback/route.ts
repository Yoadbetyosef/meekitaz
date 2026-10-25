import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { gmailExchange, syncGmail } from "@/lib/gmail";
export async function GET(req: NextRequest) {
  if (!(await crmAuthed())) return NextResponse.redirect(new URL("/admin/crm", req.url));
  const code = req.nextUrl.searchParams.get("code");
  try { if (!code) throw new Error(req.nextUrl.searchParams.get("error") || "no code"); await gmailExchange(req.nextUrl.origin, code); await syncGmail().catch(() => null); return NextResponse.redirect(new URL("/admin/crm?connected=gmail", req.url)); }
  catch (e) { return NextResponse.redirect(new URL(`/admin/crm?err=${encodeURIComponent(e instanceof Error ? e.message : "gmail")}`, req.url)); }
}
