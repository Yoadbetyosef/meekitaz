import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { igAuthUrl, igConfigured } from "@/lib/instagram";
export async function GET(req: NextRequest) {
  if (!(await crmAuthed())) return NextResponse.redirect(new URL("/admin/crm", req.url));
  if (!igConfigured()) return NextResponse.redirect(new URL("/admin/crm?err=instagram-keys", req.url));
  return NextResponse.redirect(igAuthUrl(req.nextUrl.origin, "ig"));
}
