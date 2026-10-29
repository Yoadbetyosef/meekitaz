import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* One of One · styling pass. For every ring not yet tagged "ai-styled", Claude looks at the main photo and names the centre-stone shape
   and the ring style; both land as tags, which the circles on /one-of-one filter by. A few dozen per run, from the cron. */
const SHAPES = ["Round", "Oval", "Pear", "Marquise", "Emerald", "Cushion", "Radiant", "Princess", "Asscher", "Heart", "Baguette", "Moval", "Mixed"];
const STYLES = ["Solitaire", "Halo", "Three-stone", "Toi et Moi", "Cluster", "Cocktail", "Band", "Bypass"];
type Node = { id: string; title: string; tags: string[]; featuredMedia: { preview: { image: { url: string } | null } | null } | null };

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ok = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "no model key" }, { status: 500 });
  const t0 = Date.now(), log: string[] = []; let done = 0, failed = 0;
  const d = await adminGraphql<{ products: { nodes: Node[] } }>(`query{ products(first:40, query:"tag:'One of One' AND -tag:'ai-styled' AND status:active"){ nodes{ id title tags featuredMedia{ preview{ image{ url } } } } } }`, {});
  for (const n of d?.products.nodes || []) {
    if (Date.now() - t0 > 240_000) break;
    const url = n.featuredMedia?.preview?.image?.url;
    if (!url) continue; // no photo yet: next run
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
        headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 120, messages: [{ role: "user", content: [
          { type: "image", source: { type: "url", url: url.replace(/(\.jpg|\.png)(\?.*)?$/i, "$1") + "?width=800" } },
          { type: "text", text: `This is a diamond ring on white. Answer with JSON only, no prose: {"shape": one of ${JSON.stringify(SHAPES)} (the centre or dominant stone; "Mixed" if several different shapes share the lead), "style": one of ${JSON.stringify(STYLES)}}. Toi et Moi = two stones on an open band; Three-stone = a centre with two sides; Cluster = many stones grouped as a motif; Band = stones all around with no centre; Bypass = the band crosses over itself; Cocktail = a large statement ring that is none of the others.` } ] }] }) });
      if (!r.ok) throw new Error(`model ${r.status}`);
      const j = await r.json() as { content: { type: string; text?: string }[] };
      const text = j.content.filter(b => b.type === "text").map(b => b.text || "").join("");
      const m = /\{[\s\S]*\}/.exec(text); const out = m ? JSON.parse(m[0]) as { shape?: string; style?: string } : {};
      const shape = SHAPES.includes(out.shape || "") ? out.shape! : "", style = STYLES.includes(out.style || "") ? out.style! : "";
      const ctw = /([\d.]+) ctw/.exec(n.title); const big = ctw && +ctw[1] >= 4 ? ["Big stone"] : [];
      const tags = ["ai-styled", ...(shape && shape !== "Mixed" ? [shape] : []), ...(style ? [style] : []), ...big];
      await adminGraphql(`mutation($id:ID!,$t:[String!]!){ tagsAdd(id:$id, tags:$t){ userErrors{ message } } }`, { id: n.id, t: tags });
      done++; log.push(`${n.title}: ${shape || "?"} / ${style || "?"}`);
    } catch (e) { failed++; log.push(`! ${n.title}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  console.log(`[one-of-one style] ${done} tagged, ${failed} failed`, log.slice(0, 30).join(" | "));
  return NextResponse.json({ done, failed, log });
}
