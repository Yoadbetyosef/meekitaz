import { NextResponse } from "next/server";
import { recordLead } from "@/lib/db";

export const dynamic = "force-dynamic";
// Appointment / contact requests from the "Private clients" form. They are emailed to sales@meekitaz.com (override with CONTACT_TO).
// Sending needs one of these set in Vercel: RESEND_API_KEY (the domain meekitaz.com verified in Resend; From = CONTACT_FROM, default sales@meekitaz.com)
// or WEB3FORMS_KEY (free, no DNS: the key is issued for the inbox that should receive the requests). APPOINTMENT_WEBHOOK_URL is still called if set.
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

export async function POST(req: Request) {
  const TO = process.env.CONTACT_TO || "sales@meekitaz.com";
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name || "").trim().slice(0, 120), email = String(body.email || "").trim().slice(0, 160), looking = String(body.looking || "").trim().slice(0, 600);
  const way = body.way === "virtual" ? "Virtual appointment (Google Meet or Zoom)" : "Showroom, Fifth Avenue";
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  console.log("[appointment]", { name, email, looking, way });
  await recordLead({ channel: "appointment", name, email, temp: "hot", summary: `${way}: ${looking || "appointment request"}`.slice(0, 200), details: `Appointment request (${way}). Looking for: ${looking || "(not said)"}` });

  const subject = `New appointment request: ${name}`;
  const text = `Name: ${name}\nEmail: ${email}\nAppointment: ${way}\nLooking for: ${looking || "(not said)"}\n\nReply to this email to answer ${name} directly.`;
  const html = `<p><b>${esc(name)}</b> asked for an appointment.</p><p>Email: <a href="mailto:${esc(email)}">${esc(email)}</a><br>Appointment: ${esc(way)}<br>Looking for: ${esc(looking || "(not said)")}</p><p>Reply to this email to answer ${esc(name)} directly.</p>`;

  let sent = false, configured = false;
  const hook = process.env.APPOINTMENT_WEBHOOK_URL;
  if (hook) { configured = true; try { const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, looking, way }) }); sent = sent || r.ok; } catch { /* the email below still goes */ } }
  if (process.env.RESEND_API_KEY) {
    configured = true;
    try {
      const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.CONTACT_FROM || "Meekitaz <sales@meekitaz.com>", to: [TO], reply_to: email, subject, text, html }) });
      sent = sent || r.ok;
      if (!r.ok) console.error("[appointment] Resend refused:", r.status, await r.text().catch(() => ""));
    } catch (e) { console.error("[appointment] Resend failed:", e); }
  } else if (process.env.WEB3FORMS_KEY) {
    configured = true;
    try {
      const r = await fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: process.env.WEB3FORMS_KEY, subject, from_name: "Meekitaz website", name, email, replyto: email, appointment: way, looking_for: looking || "(not said)", message: text }) });
      const j = (await r.json().catch(() => ({}))) as { success?: boolean };
      sent = sent || (r.ok && j.success !== false);
    } catch (e) { console.error("[appointment] Web3Forms failed:", e); }
  }
  if (sent) return NextResponse.json({ ok: true });
  // not configured yet, or the mail service refused: say so, so the visitor is told to email instead of thinking it went through
  return NextResponse.json({ ok: false, error: configured ? "send_failed" : "not_configured", to: TO }, { status: configured ? 502 : 503 });
}
