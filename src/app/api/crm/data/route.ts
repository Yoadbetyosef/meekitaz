import { NextRequest, NextResponse } from "next/server";
import { sql, ensureSchema, dbConfigured, openTicket } from "@/lib/db";
import { crmAuthed } from "@/lib/crmAuth";
import { gmailReply } from "@/lib/gmail";
import { igSend } from "@/lib/instagram";

export const dynamic = "force-dynamic";
const no = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

// GET ?id=… → one conversation with its messages; GET → the list (tests excluded)
export async function GET(req: NextRequest) {
  if (!(await crmAuthed())) return no();
  if (!dbConfigured) return NextResponse.json({ items: [] });
  await ensureSchema();
  const id = req.nextUrl.searchParams.get("id");
  if (id) {
    const c = await sql!`SELECT * FROM conversations WHERE id=${id}`;
    const m = await sql!`SELECT id, role, content, meta, created_at FROM messages WHERE conversation_id=${id} ORDER BY id ASC`;
    return NextResponse.json({ conversation: c[0] || null, messages: m });
  }
  const items = await sql!`SELECT c.id, c.channel, c.status, c.kind, c.temp, c.stage, c.name, c.email, c.phone, c.lead, c.summary, c.unread, c.created_at, c.updated_at,
      (SELECT content FROM messages m WHERE m.conversation_id=c.id AND m.role IN ('user','agent','assistant') ORDER BY m.id DESC LIMIT 1) AS last,
      (SELECT content FROM messages m WHERE m.conversation_id=c.id AND m.role='user' ORDER BY m.id ASC LIMIT 1) AS first
    FROM conversations c
    WHERE COALESCE(c.visitor_id,'') NOT LIKE 'test-%'
      AND (c.channel <> 'chat' OR EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id=c.id AND m.role='user'))
    ORDER BY c.updated_at DESC LIMIT 300`;
  return NextResponse.json({ items });
}

// POST { id, action: reply|update|read, text?, patch? }
export async function POST(req: NextRequest) {
  if (!(await crmAuthed())) return no();
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const id = String(b.id || ""); if (!id) return NextResponse.json({ error: "id" }, { status: 400 });
  if (b.action === "reply") {
    const text = String(b.text || "").trim().slice(0, 4000); if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
    const c = (await sql!`SELECT channel, ext_thread, email, summary FROM conversations WHERE id=${id}`)[0];
    let via = "chat";
    try {
      if (c?.channel === "email" && c.ext_thread && c.email) {
        const last = (await sql!`SELECT meta FROM messages WHERE conversation_id=${id} AND role='user' ORDER BY id DESC LIMIT 1`)[0]?.meta as { subject?: string; messageId?: string } | undefined;
        await gmailReply({ to: String(c.email), threadId: String(c.ext_thread), subject: last?.subject || String(c.summary || ""), text, inReplyTo: last?.messageId }); via = "email";
      } else if (c?.channel === "insta" && c.ext_thread) { await igSend(String(c.ext_thread), text); via = "instagram"; }
    } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "send failed" }, { status: 502 }); }
    await sql!`INSERT INTO messages (conversation_id, role, content, meta) VALUES (${id}, 'agent', ${text}, ${JSON.stringify({ via })}::jsonb)`;
    await sql!`UPDATE conversations SET first_reply_at=COALESCE(first_reply_at, now()), status='human', unread=FALSE, stage=CASE WHEN stage='new' THEN 'contacted' ELSE stage END, updated_at=now() WHERE id=${id}`;
  } else if (b.action === "note") {
    const text = String(b.text || "").trim().slice(0, 4000); if (!text) return NextResponse.json({ error: "empty" }, { status: 400 });
    await sql!`INSERT INTO messages (conversation_id, role, content) VALUES (${id}, 'note', ${text})`;
  } else if (b.action === "read") {
    await sql!`UPDATE conversations SET unread=FALSE WHERE id=${id}`;
  } else if (b.action === "update") {
    const p = b.patch || {};
    const ok = (v: unknown, list: string[]) => typeof v === "string" && list.includes(v) ? v : null;
    const kind = ok(p.kind, ["sales", "care"]), temp = ok(p.temp, ["hot", "warm", "cold"]), stage = ok(p.stage, ["new", "contacted", "appointment", "proposal", "won", "lost"]), status = ok(p.status, ["ai", "human", "closed"]);
    await sql!`UPDATE conversations SET kind=COALESCE(${kind}, kind), temp=COALESCE(${temp}, temp), stage=COALESCE(${stage}, stage), status=COALESCE(${status}, status), updated_at=now() WHERE id=${id}`;
    const what = [kind && `moved to ${kind === "care" ? "Customer Care" : "Closers"}`, temp && `marked ${temp}`, stage && `stage: ${stage}`, status && (status === "ai" ? "handed back to Mia" : status === "human" ? "taken over by the team" : "closed")].filter(Boolean).join(", ");
    if (what) await sql!`INSERT INTO messages (conversation_id, role, content) VALUES (${id}, 'system', ${what})`;
    if (kind === "care") await openTicket(id);
  }
  return NextResponse.json({ ok: true });
}
