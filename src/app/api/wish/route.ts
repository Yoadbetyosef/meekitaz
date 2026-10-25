import { NextResponse } from "next/server";
import { sql, ensureSchema, dbConfigured } from "@/lib/db";

// Saves the shareable copy of a Dream list. The browser that created it keeps its id; anyone else gets a new list.
export async function POST(req: Request) {
  if (!dbConfigured) return NextResponse.json({ error: "no db" }, { status: 503 });
  await ensureSchema();
  const b = await req.json().catch(() => ({}));
  const items = (Array.isArray(b.items) ? b.items : []).slice(0, 60).map((x: Record<string, unknown>) => ({
    handle: String(x.handle || "").slice(0, 200), title: String(x.title || "").slice(0, 200), image: String(x.image || "").slice(0, 600), price: Number(x.price) || 0, compareAt: Number(x.compareAt) || null }))
    .filter((x: { handle: string }) => /^[a-z0-9-]+$/.test(x.handle));
  const name = String(b.name || "").trim().slice(0, 40) || null;
  let id = typeof b.id === "string" && /^[a-z0-9-]{6,40}$/.test(b.id) ? b.id : "";
  if (id && (await sql!`SELECT 1 FROM wishlists WHERE id=${id}`).length) {
    await sql!`UPDATE wishlists SET items=${JSON.stringify(items)}::jsonb, name=${name}, updated_at=now() WHERE id=${id}`;
  } else {
    const slug = (name || "my").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 16) || "my";
    id = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    await sql!`INSERT INTO wishlists (id, name, items) VALUES (${id}, ${name}, ${JSON.stringify(items)}::jsonb)`;
  }
  return NextResponse.json({ id });
}
