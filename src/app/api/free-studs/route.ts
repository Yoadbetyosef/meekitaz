import { NextResponse } from "next/server";
import { adminConfigured, adminGraphql } from "@/lib/shopifyAdmin";
import { recordLead } from "@/lib/db";

// Free-studs pop-up sign-up: saves the email as a subscribed Shopify customer tagged "free-studs",
// then emails the code through Resend (when RESEND_API_KEY is set). The code is also shown in the pop-up.
const CODE = "FREESTUDS";
const ok = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;

async function saveCustomer(email: string): Promise<boolean> {
  if (!adminConfigured) return false;
  type Created = { customerCreate: { customer: { id: string } | null; userErrors: { field: string[]; message: string }[] } };
  const consent = { marketingState: "SUBSCRIBED", marketingOptInLevel: "SINGLE_OPT_IN" };
  const c = await adminGraphql<Created>(
    `mutation($input:CustomerInput!){ customerCreate(input:$input){ customer{ id } userErrors{ field message } } }`,
    { input: { email, tags: ["free-studs", "popup"], emailMarketingConsent: consent } }).catch(() => null);
  if (c?.customerCreate.customer) return true;
  // Already a customer: find her, add the tag and the marketing consent.
  type Found = { customers: { nodes: { id: string }[] } };
  const f = await adminGraphql<Found>(`query($q:String!){ customers(first:1, query:$q){ nodes{ id } } }`, { q: `email:"${email}"` }).catch(() => null);
  const cid = f?.customers.nodes[0]?.id; if (!cid) return false;
  await adminGraphql(`mutation($id:ID!,$tags:[String!]!){ tagsAdd(id:$id,tags:$tags){ userErrors{ message } } }`, { id: cid, tags: ["free-studs", "popup"] }).catch(() => null);
  await adminGraphql(`mutation($input:CustomerEmailMarketingConsentUpdateInput!){ customerEmailMarketingConsentUpdate(input:$input){ userErrors{ message } } }`,
    { input: { customerId: cid, emailMarketingConsent: consent } }).catch(() => null);
  return true;
}

async function sendCode(email: string) {
  if (!process.env.RESEND_API_KEY) return false;
  const from = process.env.CONTACT_FROM || "Meekitaz <sales@meekitaz.com>";
  const html = `<div style="font-family:Georgia,serif;color:#1C1A1B;max-width:520px;margin:auto;padding:32px;background:#FDF8F3">
<p style="font:700 11px Arial;letter-spacing:.3em;text-transform:uppercase;color:#7E0508;margin:0 0 14px">First order treat</p>
<h1 style="font-weight:400;font-size:30px;margin:0 0 14px">Your free diamond studs are waiting.</h1>
<p style="font:15px/1.6 Arial;margin:0 0 20px">Use this code on a first order of $1,000 or more and we'll add a pair of 0.5 ct lab-grown diamond studs in sterling silver, on us.</p>
<p style="font:700 22px Arial;letter-spacing:.2em;background:#F7E9A8;display:inline-block;padding:12px 22px;border-radius:999px;margin:0 0 22px">${CODE}</p>
<p style="font:15px/1.6 Arial;margin:0 0 24px"><a href="https://www.meekitaz.com" style="color:#1C1A1B">Shop Meekitaz →</a></p>
<p style="font:11px/1.5 Arial;color:#777;margin:0">One pair per customer, with a first order of $1,000+. The studs are added at checkout with the code.</p></div>`;
  try {
    const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject: "Your free diamond studs ✨", html }) });
    return r.ok;
  } catch { return false; }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!ok(email)) return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  const [saved, sent] = await Promise.all([saveCustomer(email), sendCode(email), recordLead({ channel: "popup", email, summary: "Pop-up sign-up · free studs code FREESTUDS", details: "Signed up in the free diamond studs pop-up (code FREESTUDS sent)." })]);
  return NextResponse.json({ ok: true, code: CODE, saved, sent });
}
