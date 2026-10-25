import { NextRequest, NextResponse } from "next/server";
import { crmAuthed } from "@/lib/crmAuth";
import { sql, ensureSchema, dbConfigured, CARE_CATS, careMail, solvedMail, recordLead } from "@/lib/db";
import { listOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";
const no = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });
const esc = (s: string) => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));

export async function GET(req: NextRequest) {
  if (!(await crmAuthed())) return no();
  if (!dbConfigured) return NextResponse.json({ items: [] });
  await ensureSchema();
  const orderName = req.nextUrl.searchParams.get("order");
  if (orderName) { // resolve an order number to its Shopify id (for "Open order")
    const n = orderName.replace(/[^0-9]/g, ""); const o = n ? (await listOrders(`name:#${n}`).catch(() => [])).find(x => x.name.replace(/[^0-9]/g, "") === n) : null;
    return NextResponse.json({ id: o?.id || null });
  }
  const items = await sql!`SELECT c.id, c.channel, c.name, c.email, c.phone, c.lead, c.summary, c.unread, c.created_at, c.updated_at, c.ticket_no, c.care_cat, c.care_status, c.order_name, c.care_at, c.first_reply_at, c.solved_at, c.status,
      (SELECT content FROM messages m WHERE m.conversation_id=c.id AND m.role='user' ORDER BY m.id ASC LIMIT 1) AS first,
      (SELECT content FROM messages m WHERE m.conversation_id=c.id AND m.role IN ('user','agent','assistant') ORDER BY m.id DESC LIMIT 1) AS last
    FROM conversations c WHERE c.kind='care' AND COALESCE(c.visitor_id,'') NOT LIKE 'test-%' ORDER BY c.updated_at DESC LIMIT 300`;
  return NextResponse.json({ items });
}

// POST { id, action: status|category|order|reply|sales_chance, value?, text?, via?, notify? }
export async function POST(req: NextRequest) {
  if (!(await crmAuthed())) return no();
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || ""); const c = (await sql!`SELECT * FROM conversations WHERE id=${id}`)[0];
  if (!c) return NextResponse.json({ error: "not found" }, { status: 404 });
  const log = (t: string) => sql!`INSERT INTO messages (conversation_id, role, content) VALUES (${id}, 'system', ${t})`;
  if (b.action === "status" && ["new", "in_progress", "waiting", "solved"].includes(b.value)) {
    await sql!`UPDATE conversations SET care_status=${b.value}, solved_at=${b.value === "solved" ? new Date().toISOString() : null}, updated_at=now() WHERE id=${id}`;
    await log(`Status: ${String(b.value).replace("_", " ")}`);
    if (b.value === "solved" && b.notify !== false && c.email) { const ok = await solvedMail(String(c.email), Number(c.ticket_no)); if (ok) await log("“All done” email sent to the customer"); }
  } else if (b.action === "category" && (CARE_CATS as readonly string[]).includes(b.value)) {
    await sql!`UPDATE conversations SET care_cat=${b.value}, updated_at=now() WHERE id=${id}`;
  } else if (b.action === "order") {
    await sql!`UPDATE conversations SET order_name=${String(b.value || "").trim() || null}, updated_at=now() WHERE id=${id}`;
  } else if (b.action === "reply") {
    const text = String(b.text || "").trim().slice(0, 6000); if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
    if (b.via === "email") {
      if (!c.email) return NextResponse.json({ error: "no email" }, { status: 400 });
      const ok = await careMail(String(c.email), `Re: your request #C-${c.ticket_no}`, `<div style="font-family:Arial,sans-serif;color:#1C1A1B;max-width:560px;margin:auto;padding:28px;background:#FDF8F3;font-size:15px;line-height:1.6">${esc(text).replace(/\n/g, "<br>")}<p style="margin-top:24px;font-family:Georgia,serif;font-style:italic">Meekitaz Customer Care · #C-${c.ticket_no}</p></div>`);
      if (!ok) return NextResponse.json({ error: "send failed" }, { status: 502 });
      await sql!`INSERT INTO messages (conversation_id, role, content, meta) VALUES (${id}, 'agent', ${text}, ${JSON.stringify({ via: "email" })}::jsonb)`;
    } else {
      await sql!`INSERT INTO messages (conversation_id, role, content) VALUES (${id}, 'agent', ${text})`;
      await sql!`UPDATE conversations SET status='human' WHERE id=${id}`;
    }
    await sql!`UPDATE conversations SET first_reply_at=COALESCE(first_reply_at, now()), care_status=CASE WHEN care_status='new' THEN 'in_progress' ELSE care_status END, unread=FALSE, updated_at=now() WHERE id=${id}`;
  } else if (b.action === "sales_chance") {
    await recordLead({ channel: String(c.channel), name: c.name || undefined, email: c.email || undefined, phone: c.phone || undefined, temp: "warm", summary: `From care #C-${c.ticket_no}: ${String(b.text || "sales chance").slice(0, 160)}`, details: `Opened from Customer Care ticket #C-${c.ticket_no}. ${String(b.text || "")}` });
    await log("Sales chance sent to Closers");
  }
  return NextResponse.json({ ok: true });
}
