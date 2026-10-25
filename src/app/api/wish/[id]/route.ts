import { NextResponse } from "next/server";
import { sql, ensureSchema, dbConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";
async function load(id: string) {
  const l = (await sql!`SELECT id, name, items FROM wishlists WHERE id=${id}`)[0]; if (!l) return null;
  const votes = await sql!`SELECT handle, count(*)::int AS n FROM wish_votes WHERE list_id=${id} GROUP BY handle`;
  return { id: l.id, name: l.name, items: l.items, votes: Object.fromEntries(votes.map(v => [v.handle, v.n])) };
}
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!dbConfigured) return NextResponse.json({ error: "no db" }, { status: 503 });
  await ensureSchema();
  const l = await load((await params).id); return l ? NextResponse.json(l) : NextResponse.json({ error: "not found" }, { status: 404 });
}
// A friend's vote: one favourite per person (by a random id kept in their browser); voting again moves it.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!dbConfigured) return NextResponse.json({ error: "no db" }, { status: 503 });
  await ensureSchema();
  const id = (await params).id, b = await req.json().catch(() => ({}));
  const voter = String(b.voter || "").slice(0, 64), handle = String(b.handle || "").slice(0, 200);
  if (!voter || !handle) return NextResponse.json({ error: "bad" }, { status: 400 });
  await sql!`INSERT INTO wish_votes (list_id, handle, voter) VALUES (${id}, ${handle}, ${voter}) ON CONFLICT (list_id, voter) DO UPDATE SET handle=EXCLUDED.handle, created_at=now()`;
  return NextResponse.json(await load(id));
}
