import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* Ready to Ship · curation rules (Oct 30), run from the cron until the stock is clean:
   1. Repetitive models out: martini earrings, studs, tennis bracelets and necklaces, solitaire rings.
   2. Only pieces filmed lying on black stay. Claude looks at each piece's photo once: on a display stand, bust, hand or ear, or not on a
      black background → out. Pieces that pass are tagged "bg-checked" and never looked at again.
   "Out" = status DRAFT (off the site, kept in Shopify, reversible) + a tag saying why. */
type P = { id: string; title: string; featuredMedia: { preview: { image: { url: string } | null } | null } | null };
const draftMany = async (ids: string[], why: string) => {
  for (let i = 0; i < ids.length; i += 20) {
    const part = ids.slice(i, i + 20);
    await adminGraphql(`mutation{ ${part.map((id, k) => `u${k}: productUpdate(product:{ id:"${id}", status:DRAFT }){ userErrors{ message } } t${k}: tagsAdd(id:"${id}", tags:["curated-out","${why}"]){ userErrors{ message } }`).join(" ")} }`, {});
  }
};

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ok = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now(); let repetitive = 0, stand = 0, kept = 0, failed = 0;

  // 2 · lying on black, or out
  if (process.env.ANTHROPIC_API_KEY) {
    const d = await adminGraphql<{ products: { nodes: P[] } }>(`query{ products(first:150, query:"tag:'Ready to Ship' AND status:active AND -tag:'bg-checked' AND -(title:'Martini Earrings' OR title:Studs OR title:'Tennis Bracelet' OR title:'Tennis Necklace' OR title:'Solitaire Ring')"){ nodes{ id title featuredMedia{ preview{ image{ url } } } } } }`, {});
    const out: string[] = [], pass: string[] = [];
    const nodes = d?.products.nodes || [];
    for (let i = 0; i < nodes.length && Date.now() - t0 < 150_000; i += 12) {
      await Promise.all(nodes.slice(i, i + 12).map(async n => {
        const url = n.featuredMedia?.preview?.image?.url; if (!url) { out.push(n.id); return; }
        try {
          const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST",
            headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
            body: JSON.stringify({ model: "claude-haiku-5-5", max_tokens: 60, messages: [{ role: "user", content: [
              { type: "image", source: { type: "url", url: url.replace(/\?.*$/, "") + "?width=600" } },
              { type: "text", text: 'A jewellery product photo. Answer with JSON only: {"black": true if the background is black or near-black, "lying": true if the piece lies on a surface by itself (not hung on a display stand, T-bar, bust, neck form, hand, ear or mannequin)}' } ] }] }) });
          if (!r.ok) throw new Error(String(r.status));
          const j = await r.json() as { content: { type: string; text?: string }[] };
          const m = /\{[\s\S]*\}/.exec(j.content.map(b => b.text || "").join("")); const v = m ? JSON.parse(m[0]) as { black?: boolean; lying?: boolean } : {};
          if (v.black === true && v.lying === true) pass.push(n.id); else if (v.black === false || v.lying === false) out.push(n.id);
        } catch { failed++; }
      }));
    }
    if (out.length) await draftMany(out, "not-on-black"); stand += out.length;
    for (let i = 0; i < pass.length; i += 25) await adminGraphql(`mutation{ ${pass.slice(i, i + 25).map((id, k) => `t${k}: tagsAdd(id:"${id}", tags:["bg-checked"]){ userErrors{ message } }`).join(" ")} }`, {});
    kept += pass.length;
  }
  // 1 · repetitive models
  for (let round = 0; round < 6 && Date.now() - t0 < 230_000; round++) {
    const d = await adminGraphql<{ products: { nodes: { id: string }[] } }>(`query{ products(first:200, query:"tag:'Ready to Ship' AND status:active AND (title:'Martini Earrings' OR title:Studs OR title:'Tennis Bracelet' OR title:'Tennis Necklace' OR title:'Solitaire Ring')"){ nodes{ id } } }`, {});
    const ids = (d?.products.nodes || []).map(n => n.id); if (!ids.length) break;
    await draftMany(ids, "repetitive"); repetitive += ids.length;
  }

  console.log(`[rts-curate] repetitive ${repetitive}, not on black ${stand}, kept ${kept}, failed ${failed}`);
  return NextResponse.json({ repetitive, stand, kept, failed });
}
