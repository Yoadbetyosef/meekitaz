import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { gmailAuthUrl, gmailConfigured } from "@/lib/gmail";
export async function GET(req: NextRequest) {
  if (!(await crmAuthed())) return NextResponse.redirect(new URL("/admin/crm", req.url));
  if (!gmailConfigured()) return NextResponse.redirect(new URL("/admin/crm?err=gmail-keys", req.url));
  return NextResponse.redirect(gmailAuthUrl(req.nextUrl.origin, "gmail"));
}
