import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { getIntegration, setIntegration } from "@/lib/db";
import { gmailConfigured } from "@/lib/gmail";
import { igConfigured } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await crmAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const g = await getIntegration<{ email: string; last?: number }>("gmail"), i = await getIntegration<{ username: string; exp: number }>("instagram");
  return NextResponse.json({ gmail: { keys: gmailConfigured(), account: g?.email || null, last: g?.last || null }, instagram: { keys: igConfigured(), account: i?.username || null, exp: i?.exp || null } });
}
export async function POST(req: NextRequest) {
  if (!(await crmAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { disconnect } = await req.json().catch(() => ({}));
  if (disconnect === "gmail" || disconnect === "instagram") await setIntegration(disconnect, null);
  return NextResponse.json({ ok: true });
}
