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
