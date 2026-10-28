import { NextRequest, NextResponse } from "next/server";
import { saveBag, loadBag, markOpened, sendReminders } from "@/lib/savedBags";
import { recordLead } from "@/lib/db";

export const dynamic = "force-dynamic";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// POST { email, items, rings, total } → { id }
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim();
  if (!EMAIL.test(email) || !Array.isArray(b.items) || !b.items.length) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const items = b.items.slice(0, 20).map((i: Record<string, unknown>) => ({ title: String(i.title || "").slice(0, 160), sub: i.sub ? String(i.sub).slice(0, 160) : undefined, price: Number(i.price) || 0, image: i.image ? String(i.image).slice(0, 500) : undefined, url: i.url ? String(i.url).slice(0, 300) : undefined }));
  const id = await saveBag({ email, items, rings: Array.isArray(b.rings) ? b.rings.slice(0, 10) : [], total: Number(b.total) || items.reduce((s: number, i: { price: number }) => s + i.price, 0) });
  recordLead({ channel: "bag", email, summary: `Saved bag · ${items.map((i: { title: string }) => i.title).join(", ")} · $${Math.round(Number(b.total) || 0)}`, kind: "sales", temp: "warm" }).catch(() => {});
  return NextResponse.json({ id });
}
// GET ?id=… → the saved bag (and marks it opened) · cron (Bearer CRON_SECRET or ?key=) → sends the 24-hour reminders
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cron = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (cron) return NextResponse.json({ sent: await sendReminders().catch(() => -1) });
  const id = sp.get("id") || "";
  const bag = id ? await loadBag(id) : null;
  if (!bag) return NextResponse.json({ error: "not found" }, { status: 404 });
  markOpened(id).catch(() => {});
  return NextResponse.json({ bag: { items: bag.items, rings: bag.rings, total: bag.total } });
}
