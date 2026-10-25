import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { listOrders, setStage, STAGES, STAGE_LABEL, type Stage } from "@/lib/orders";

export const dynamic = "force-dynamic";
const esc = (s: string) => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
const trackUrl = (carrier: string, n: string) => /ups/i.test(carrier) ? `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}` : `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}`;

export async function GET() {
  if (!(await crmAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try { return NextResponse.json({ orders: await listOrders() }); }
  catch (e) { return NextResponse.json({ orders: [], error: e instanceof Error ? e.message : "error" }); }
}

export async function POST(req: NextRequest) {
  if (!(await crmAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const stage = String(b.stage) as Stage; if (!STAGES.includes(stage)) return NextResponse.json({ error: "stage" }, { status: 400 });
  await setStage({ id: String(b.id), name: String(b.name || ""), stage, tracking: b.tracking ? String(b.tracking).trim() : undefined, carrier: b.carrier ? String(b.carrier) : undefined, note: b.note != null ? String(b.note) : undefined });
  let emailed = false;
  // Shipped with a tracking number: tell the customer
  if (stage === "shipped" && b.tracking && b.email && b.notify !== false && process.env.RESEND_API_KEY) {
    const carrier = String(b.carrier || "FedEx"), n = String(b.tracking).trim();
    const html = `<div style="font-family:Georgia,serif;color:#1C1A1B;max-width:520px;margin:auto;padding:32px;background:#FDF8F3">
<p style="font:700 11px Arial;letter-spacing:.3em;text-transform:uppercase;color:#7E0508;margin:0 0 14px">On its way</p>
<h1 style="font-weight:400;font-size:30px;margin:0 0 14px">Your order ${esc(String(b.name || ""))} has shipped.</h1>
<p style="font:15px/1.6 Arial;margin:0 0 20px">It's travelling fully insured with ${esc(carrier)}. A signature is required on delivery.</p>
<p style="margin:0 0 24px"><a href="${trackUrl(carrier, n)}" style="display:inline-block;background:#1C1A1B;color:#fff;text-decoration:none;font:700 12px Arial;letter-spacing:.18em;text-transform:uppercase;padding:15px 26px;border-radius:999px">Track my order</a></p>
<p style="font:13px/1.6 Arial;color:#777;margin:0">Tracking number: ${esc(n)}</p></div>`;
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.CONTACT_FROM || "Meekitaz <sales@meekitaz.com>", to: [String(b.email)], subject: `Your Meekitaz order ${String(b.name || "")} has shipped`, html }) }).catch(() => null);
    emailed = !!r?.ok;
  }
  return NextResponse.json({ ok: true, emailed, label: STAGE_LABEL[stage] });
}
