import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { getOrder, addEvent } from "@/lib/orders";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";
const no = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
const esc = (s: string) => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

export async function GET(req: NextRequest) {
  if (!(await crmAuthed())) return no();
  const id = req.nextUrl.searchParams.get("id") || "";
  try { const o = await getOrder(id); return o ? NextResponse.json({ order: o }) : NextResponse.json({ error: "not found" }, { status: 404 }); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 }); }
}

// POST { id, name, action: event|email|reminder|reminder_done, kind?, text?, subject?, to?, due?, rid?, done? }
export async function POST(req: NextRequest) {
  if (!(await crmAuthed())) return no();
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || ""), text = String(b.text || "").trim().slice(0, 6000);
  if (b.action === "event") {
    if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
    await addEvent(id, ["note", "call", "email", "message"].includes(b.kind) ? b.kind : "note", text);
  } else if (b.action === "email") {
    const to = String(b.to || ""), subject = String(b.subject || "").slice(0, 200) || `About your Meekitaz order ${b.name || ""}`;
    if (!text || !/@/.test(to) || !process.env.RESEND_API_KEY) return NextResponse.json({ error: "cannot send" }, { status: 400 });
    const html = `<div style="font-family:Arial,sans-serif;color:#1C1A1B;max-width:560px;margin:auto;padding:28px;background:#FDF8F3;font-size:15px;line-height:1.6">${esc(text).replace(/\n/g, "<br>")}<p style="margin-top:24px;font-family:Georgia,serif;font-style:italic">Meekitaz · New York</p></div>`;
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.CONTACT_FROM || "Meekitaz <sales@meekitaz.com>", to: [to], reply_to: process.env.CONTACT_TO || "sales@meekitaz.com", subject, html, text }) }).catch(() => null);
    if (!r?.ok) return NextResponse.json({ error: "send failed" }, { status: 502 });
    await addEvent(id, "email", `Sent "${subject}": ${text}`);
  } else if (b.action === "reminder") {
    const due = /^\d{4}-\d{2}-\d{2}$/.test(String(b.due)) ? String(b.due) : new Date().toISOString().slice(0, 10);
    if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
    await sql!`INSERT INTO reminders (order_id, order_name, conversation_id, who, text, due) VALUES (${id || null}, ${b.name || null}, ${b.conversationId || null}, ${b.who || "Yoad"}, ${text}, ${due})`;
  } else if (b.action === "reminder_done") {
    await sql!`UPDATE reminders SET done=${!!b.done} WHERE id=${Number(b.rid)}`;
  }
  return NextResponse.json({ ok: true });
}
