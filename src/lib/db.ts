import { neon } from "@neondatabase/serverless";

// Postgres on Neon (Vercel integration sets DATABASE_URL). Tables are created on first use.
export const dbConfigured = !!process.env.DATABASE_URL;
export const sql = dbConfigured ? neon(process.env.DATABASE_URL!) : null;

let ready: Promise<void> | null = null;
export function ensureSchema(): Promise<void> {
  if (!sql) return Promise.reject(new Error("DATABASE_URL missing"));
  if (!ready) ready = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY, visitor_id TEXT, channel TEXT NOT NULL DEFAULT 'chat',
      status TEXT NOT NULL DEFAULT 'ai',            -- ai | human | closed
      kind TEXT,                                    -- sales | care
      temp TEXT,                                    -- hot | warm | cold
      name TEXT, email TEXT, phone TEXT,
      lead JSONB NOT NULL DEFAULT '{}'::jsonb,      -- interest, budget, timeline, metal, shape, notes
      page TEXT, unread BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS messages (
      id BIGSERIAL PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL,                           -- user | assistant | agent | system
      content TEXT NOT NULL, meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, id)`;
    await sql`CREATE INDEX IF NOT EXISTS conversations_upd_idx ON conversations(updated_at DESC)`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'new'`; // CRM: new | contacted | appointment | proposal | won | lost
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS summary TEXT`;
    await sql`CREATE TABLE IF NOT EXISTS order_stages (
      order_id TEXT PRIMARY KEY, name TEXT, stage TEXT NOT NULL DEFAULT 'new', tracking TEXT, carrier TEXT, note TEXT,
      stage_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE SEQUENCE IF NOT EXISTS care_ticket_seq START 1001`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ticket_no BIGINT`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS care_cat TEXT`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS care_status TEXT`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS order_name TEXT`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS care_at TIMESTAMPTZ`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS first_reply_at TIMESTAMPTZ`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS solved_at TIMESTAMPTZ`;
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS ext_thread TEXT`; // Gmail thread id / Instagram user id
    await sql`CREATE INDEX IF NOT EXISTS conversations_ext_idx ON conversations(channel, ext_thread)`;
    await sql`CREATE TABLE IF NOT EXISTS integrations (name TEXT PRIMARY KEY, data JSONB NOT NULL DEFAULT '{}'::jsonb, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS ext_seen (id TEXT PRIMARY KEY, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE TABLE IF NOT EXISTS order_events (
      id BIGSERIAL PRIMARY KEY, order_id TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, author TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
    await sql`CREATE INDEX IF NOT EXISTS order_events_idx ON order_events(order_id, id)`;
    await sql`CREATE TABLE IF NOT EXISTS reminders (
      id BIGSERIAL PRIMARY KEY, order_id TEXT, order_name TEXT, conversation_id TEXT, who TEXT, text TEXT NOT NULL, due DATE NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT now())`; // one line shown in the CRM list
  })().catch(e => { ready = null; throw e; });
  return ready;
}

/** Saves a lead that didn't come through the chat (pop-up, appointment form…) as a conversation the CRM shows. */
export async function recordLead(l: { channel: string; name?: string; email?: string; phone?: string; summary: string; kind?: "sales" | "care"; temp?: "hot" | "warm" | "cold"; details?: string }) {
  if (!sql) return;
  try {
    await ensureSchema();
    const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
    await sql`INSERT INTO conversations (id, channel, status, kind, temp, name, email, phone, summary, unread)
      VALUES (${id}, ${l.channel}, 'human', ${l.kind || "sales"}, ${l.temp || "warm"}, ${l.name || null}, ${l.email || null}, ${l.phone || null}, ${l.summary}, TRUE)`;
    await sql`INSERT INTO messages (conversation_id, role, content) VALUES (${id}, 'user', ${l.details || l.summary})`;
  } catch (e) { console.error("[recordLead]", e); }
}

/* ---------- Customer Care tickets ---------- */
export const CARE_CATS = ["resize", "repair", "return", "shipping", "certificate", "warranty", "payment", "other"] as const;
export function guessCareCat(t: string): string {
  const s = t.toLowerCase();
  return /resiz|size|too big|too small/.test(s) ? "resize" : /return|refund|exchange|cancel/.test(s) ? "return" : /where is|track|ship|deliver/.test(s) ? "shipping"
    : /certif|igi|gia|report/.test(s) ? "certificate" : /fell out|loose|broke|prong|repair|bent|scratch|yellow/.test(s) ? "repair" : /warrant|care package/.test(s) ? "warranty" : /card|pay|charge|affirm|klarna/.test(s) ? "payment" : "other";
}
async function careMail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY || !to) return false;
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.CONTACT_FROM || "Meekitaz <sales@meekitaz.com>", to: [to], reply_to: process.env.CONTACT_TO || "sales@meekitaz.com", subject, html }) }).catch(() => null);
  return !!r?.ok;
}
const wrap = (eyebrow: string, title: string, body: string) => `<div style="font-family:Georgia,serif;color:#1C1A1B;max-width:520px;margin:auto;padding:32px;background:#FDF8F3">
<p style="font:700 11px Arial;letter-spacing:.3em;text-transform:uppercase;color:#7E0508;margin:0 0 14px">${eyebrow}</p><h1 style="font-weight:400;font-size:30px;margin:0 0 14px">${title}</h1>
<div style="font:15px/1.6 Arial">${body}</div><p style="margin-top:24px;font-style:italic">Meekitaz Customer Care</p></div>`;

/** Makes a conversation a Customer Care ticket (number, category, 24-hour clock) and emails the customer a receipt once. */
export async function openTicket(id: string, opts: { category?: string; orderName?: string; silent?: boolean } = {}) {
  if (!sql) return null;
  await ensureSchema();
  const c = (await sql`SELECT * FROM conversations WHERE id=${id}`)[0]; if (!c) return null;
  if (c.ticket_no) return Number(c.ticket_no);
  const first = (await sql`SELECT content FROM messages WHERE conversation_id=${id} AND role='user' ORDER BY id LIMIT 3`).map(r => String(r.content)).join(" ");
  const cat = opts.category && (CARE_CATS as readonly string[]).includes(opts.category) ? opts.category : guessCareCat(first + " " + JSON.stringify(c.lead || {}));
  const no = Number((await sql`SELECT nextval('care_ticket_seq') AS n`)[0].n);
  await sql`UPDATE conversations SET kind='care', ticket_no=${no}, care_cat=${cat}, care_status='new', care_at=now(), order_name=COALESCE(${opts.orderName || null}, order_name), unread=TRUE, updated_at=now() WHERE id=${id}`;
  await sql`INSERT INTO messages (conversation_id, role, content) VALUES (${id}, 'system', ${`Customer Care ticket #C-${no} opened (${cat})`})`;
  if (!opts.silent && c.email && !String(c.visitor_id || "").startsWith("test-"))
    await careMail(String(c.email), `We've got your request (#C-${no})`, wrap("Customer care", "We've got it.", `<p>Thanks for writing to us. Your request number is <b>#C-${no}</b> and you'll hear from us within 24 hours.</p>${cat === "resize" ? "<p><b>Resizing?</b> Tell us the size you need and we'll send a free insured shipping label.</p>" : ""}`));
  return no;
}
export async function solvedMail(to: string, no: number) {
  return careMail(to, `All done (#C-${no})`, wrap("Customer care", "All done.", `<p>Your request <b>#C-${no}</b> is complete. If anything else comes up, just reply to this email.</p><p>How did we do? Reply with a number from 1 to 5. We read every one.</p>`));
}
export { careMail };

/* ---------- Connected accounts (Gmail, Instagram) ---------- */
export async function getIntegration<T = Record<string, unknown>>(name: string): Promise<T | null> {
  if (!sql) return null; await ensureSchema();
  const r = await sql`SELECT data FROM integrations WHERE name=${name}`; return r[0] ? (r[0].data as T) : null;
}
export async function setIntegration(name: string, data: Record<string, unknown> | null) {
  if (!sql) return; await ensureSchema();
  if (!data) { await sql`DELETE FROM integrations WHERE name=${name}`; return; }
  await sql`INSERT INTO integrations (name, data) VALUES (${name}, ${JSON.stringify(data)}::jsonb) ON CONFLICT (name) DO UPDATE SET data=EXCLUDED.data, updated_at=now()`;
}
/** True the first time an external message id is seen. */
export async function firstSeen(id: string) {
  const r = await sql!`INSERT INTO ext_seen (id) VALUES (${id}) ON CONFLICT DO NOTHING RETURNING id`; return r.length > 0;
}
/** Adds an incoming message from an outside channel to its conversation (one per thread), creating it the first time. */
export async function inbound(m: { channel: string; thread: string; name?: string | null; email?: string | null; text: string; subject?: string | null; meta?: Record<string, unknown> }) {
  await ensureSchema();
  let c = (await sql!`SELECT id, kind FROM conversations WHERE channel=${m.channel} AND ext_thread=${m.thread} ORDER BY created_at DESC LIMIT 1`)[0];
  if (!c) {
    const id = (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
    const care = guessCareCat((m.subject || "") + " " + m.text) !== "other";
    await sql!`INSERT INTO conversations (id, channel, ext_thread, status, kind, temp, name, email, summary, unread)
      VALUES (${id}, ${m.channel}, ${m.thread}, 'human', 'sales', 'warm', ${m.name || null}, ${m.email || null}, ${(m.subject || m.text).slice(0, 160)}, TRUE)`;
    c = { id, kind: "sales" };
    await sql!`INSERT INTO messages (conversation_id, role, content, meta) VALUES (${id}, 'user', ${m.text}, ${JSON.stringify(m.meta || {})}::jsonb)`;
    if (care) await openTicket(id, { silent: true });
    return id;
  }
  await sql!`INSERT INTO messages (conversation_id, role, content, meta) VALUES (${c.id}, 'user', ${m.text}, ${JSON.stringify(m.meta || {})}::jsonb)`;
  await sql!`UPDATE conversations SET unread=TRUE, updated_at=now(), name=COALESCE(name, ${m.name || null}), email=COALESCE(email, ${m.email || null}),
    care_status=CASE WHEN care_status='waiting' THEN 'in_progress' ELSE care_status END WHERE id=${c.id}`;
  return c.id as string;
}
