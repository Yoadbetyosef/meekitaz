import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema, dbConfigured } from "@/lib/db";

// Vercel cron, every morning: emails the team today's reminders + anything overdue, and new leads from the last day.
export const dynamic = "force-dynamic";
const esc = (s: string) => s.replace(/[<>&]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "no" }, { status: 401 });
  if (!dbConfigured || !process.env.RESEND_API_KEY) return NextResponse.json({ ok: false });
  await ensureSchema();
  const due = await sql!`SELECT text, order_name, to_char(due,'Mon DD') AS d, due < current_date AS late FROM reminders WHERE NOT done AND due <= current_date ORDER BY due`;
  const leads = await sql!`SELECT COALESCE(name, email, 'Website visitor') AS who, channel, COALESCE(summary, lead->>'interest', '') AS what, temp FROM conversations
    WHERE created_at > now() - interval '1 day' AND COALESCE(visitor_id,'') NOT LIKE 'test-%' AND (channel <> 'chat' OR email IS NOT NULL OR temp = 'hot') ORDER BY created_at DESC LIMIT 30`;
  if (!due.length && !leads.length) return NextResponse.json({ ok: true, sent: false });
  const li = (s: string) => `<li style="margin:0 0 8px">${s}</li>`;
  const html = `<div style="font-family:Arial,sans-serif;color:#1C1A1B;max-width:600px;margin:auto;padding:28px;background:#FDF8F3">
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:28px;margin:0 0 18px">Good morning. Here's today.</h1>
${due.length ? `<h3 style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#7E0508">Reminders (${due.length})</h3><ul style="padding-left:18px">${due.map(r => li(`${r.late ? "<b style='color:#B3261E'>Overdue</b> · " : ""}${esc(String(r.text))}${r.order_name ? ` · ${esc(String(r.order_name))}` : ""} <span style="color:#888">(${r.d})</span>`)).join("")}</ul>` : ""}
${leads.length ? `<h3 style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#7E0508">New leads since yesterday (${leads.length})</h3><ul style="padding-left:18px">${leads.map(l => li(`${l.temp === "hot" ? "🔥 " : ""}<b>${esc(String(l.who))}</b> · ${esc(String(l.channel))} · ${esc(String(l.what || ""))}`)).join("")}</ul>` : ""}
<p style="margin-top:22px"><a href="https://www.meekitaz.com/admin/crm" style="background:#1C1A1B;color:#fff;text-decoration:none;padding:13px 22px;border-radius:999px;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Open the CRM</a></p></div>`;
  await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.CONTACT_FROM || "Meekitaz <sales@meekitaz.com>", to: [process.env.CONTACT_TO || "sales@meekitaz.com"], subject: `Today at Meekitaz: ${due.length} reminder${due.length === 1 ? "" : "s"}, ${leads.length} new lead${leads.length === 1 ? "" : "s"}`, html }) });
  return NextResponse.json({ ok: true, sent: true });
}
