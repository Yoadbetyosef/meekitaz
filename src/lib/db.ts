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
  })().catch(e => { ready = null; throw e; });
  return ready;
}
