import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { igHandleWebhook } from "@/lib/instagram";

// Meta calls this for new Instagram DMs. GET = verification handshake, POST = events (signed with the app secret).
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  if (p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === process.env.IG_VERIFY_TOKEN) return new NextResponse(p.get("hub.challenge") || "", { status: 200 });
  return new NextResponse("forbidden", { status: 403 });
}
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-hub-signature-256") || "";
  if (process.env.IG_APP_SECRET) {
    const want = "sha256=" + createHmac("sha256", process.env.IG_APP_SECRET).update(raw).digest("hex");
    if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return new NextResponse("bad signature", { status: 401 });
  }
  try { await igHandleWebhook(JSON.parse(raw)); } catch (e) { console.error("[ig webhook]", e); }
  return NextResponse.json({ ok: true });
}
