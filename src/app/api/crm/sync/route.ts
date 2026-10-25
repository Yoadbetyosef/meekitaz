import { NextRequest, NextResponse } from "next/server";
import { syncGmail } from "@/lib/gmail";
import { igRefresh } from "@/lib/instagram";
import { crmAuthed } from "@/lib/crmAuth";

// Vercel cron every 5 minutes (or from the CRM "Sync now" button): new Gmail into the CRM, keep the Instagram token fresh.
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const cron = process.env.CRON_SECRET && req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  if (!cron && !(await crmAuthed())) return NextResponse.json({ error: "no" }, { status: 401 });
  const gmail = await syncGmail().catch(e => ({ ok: false, reason: String(e) }));
  await igRefresh().catch(() => null);
  return NextResponse.json({ gmail });
}
