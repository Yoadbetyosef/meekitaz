import { NextRequest, NextResponse } from "next/server";
import { DAILY } from "@/lib/daily";
// Checks the preview code for Meekitaz Daily (DAILY_PREVIEW_CODE in Vercel). Wrong or missing code: nothing changes.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || "";
  return NextResponse.json({ ok: DAILY.enabled && !!process.env.DAILY_PREVIEW_CODE && code === process.env.DAILY_PREVIEW_CODE });
}
