import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sql, ensureSchema, dbConfigured } from "@/lib/db";
import DreamVote from "@/components/DreamVote";

export const dynamic = "force-dynamic";
type Item = { handle: string; title: string; image: string; price: number; url?: string; stoneImage?: string; kind?: string };
async function get(id: string) {
  if (!dbConfigured) return null; await ensureSchema();
  const l = (await sql!`SELECT id, name, items FROM wishlists WHERE id=${id}`)[0]; if (!l) return null;
  const v = await sql!`SELECT handle, count(*)::int AS n FROM wish_votes WHERE list_id=${id} GROUP BY handle`;
  return { id: String(l.id), name: (l.name as string) || "", items: l.items as Item[], votes: Object.fromEntries(v.map(x => [x.handle, x.n])) as Record<string, number> };
}
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const l = await get((await params).id);
  const t = l ? `${l.name ? l.name + "’s" : "A"} Dream list · Meekitaz` : "Dream list · Meekitaz";
  return { title: t, description: "Help choose! Tap ♥ on your favourite.", robots: { index: false }, openGraph: { title: t, description: "Help choose! Tap ♥ on your favourite.", images: l?.items[0]?.image ? [l.items[0].image] : [] } };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const l = await get((await params).id); if (!l) notFound();
  return (
    <main className="dream">
      <div className="wrap">
        <small className="eyebrow">Dream list</small>
        <h1>{l.name ? `${l.name}’s` : "A"} Dream list</h1>
        <p className="dream-sub">Help {l.name || "her"} choose: tap ♥ on your favourite.</p>
        <DreamVote id={l.id} items={l.items} votes={l.votes} />
      </div>
    </main>
  );
}
