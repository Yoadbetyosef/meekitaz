import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { igExchange } from "@/lib/instagram";
export async function GET(req: NextRequest) {
  if (!(await crmAuthed())) return NextResponse.redirect(new URL("/admin/crm", req.url));
  const code = req.nextUrl.searchParams.get("code");
  try { if (!code) throw new Error(req.nextUrl.searchParams.get("error_description") || "no code"); await igExchange(req.nextUrl.origin, code.replace(/#_$/, "")); return NextResponse.redirect(new URL("/admin/crm?connected=instagram", req.url)); }
  catch (e) { return NextResponse.redirect(new URL(`/admin/crm?err=${encodeURIComponent(e instanceof Error ? e.message : "instagram")}`, req.url)); }
}
