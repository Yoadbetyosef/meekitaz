import { NextResponse } from "next/server";
// Appointment requests. Wire to Resend / Klaviyo / a Slack webhook here.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  console.log("[appointment]", body);
  const hook = process.env.APPOINTMENT_WEBHOOK_URL;
  if (hook) { try { await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); } catch {} }
  return NextResponse.json({ ok: true });
}
