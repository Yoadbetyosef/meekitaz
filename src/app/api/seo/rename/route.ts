import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* SEO names for the supplier pieces (One of One from Classic Grown, Ready to Ship from LGD), once each:
   title  → "Pink Pear Toi et Moi Lab Grown Diamond Ring in 14K Rose & White Gold, 7.15 ctw"
   handle → the title as a slug (/products/pink-pear-toi-et-moi-lab-grown-diamond-ring-in-14k-rose-white-gold-7-15-ctw)
   SEO title + description set too. The old handle is kept as a tag "oldhandle-…", so every old link redirects (product page) and
   hand-picked lists keep working. Ready to Ship pieces are renamed only once they passed curation (tag bg-checked). */
type P = { id: string; handle: string; title: string; productType: string; tags: string[]; description: string };
const SHAPES: [string, string][] = [["MOV", "Moval"], ["RDT", "Radiant"], ["ASS", "Asscher"], ["EM", "Emerald"], ["OV", "Oval"], ["PE", "Pear"], ["MQ", "Marquise"], ["CU", "Cushion"], ["HT", "Heart"], ["PR", "Princess"], ["RD", "Round"], ["BG", "Baguette"]];
const STYLES = ["Toi et Moi", "Three-stone", "Halo", "Solitaire", "Cluster", "Cocktail", "Bypass"];
const COLOURS = ["Pink", "Yellow", "Blue", "Green"];
const slug = (s: string) => s.toLowerCase().replace(/&/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200);
const cap = (s: string) => s.replace(/\b[a-z]/g, c => c.toUpperCase());

function metalOf(title: string, desc: string, tags: string[]) {
  const m = /^(.*?)\s+gold\b/i.exec(title); const k = tags.find(t => /^\d+K$/.test(t)) || /(\d{1,2}K)\b/.exec(desc)?.[1] || "14K";
  return m ? `${k} ${cap(m[1].replace(/\s*-\s*/g, " & ").toLowerCase()).replace(/ And /g, " & ")} Gold` : `${k} Gold`;
}
function oneOfOne(p: P) {
  const sku = (p.tags.find(t => t.startsWith("CGD-")) || "").slice(4);
  let code = sku.replace(/^SJ[A-Z]+\d+/, "").replace(/_.*$/, "").replace(/^(L?S)/, "");
  const shapes: string[] = [];
  while (code) { const hit = SHAPES.find(([c]) => code.startsWith(c)); if (!hit) break; shapes.push(hit[1]); code = code.slice(hit[0].length).replace(/^(L?S)/, ""); }
  if (!shapes.length) { const t = p.tags.find(t => SHAPES.some(([, n]) => n === t)); if (t) shapes.push(t); }
  const colour = p.tags.includes("Fancy") ? COLOURS.find(c => p.tags.includes(c)) : undefined;
  const isRing = p.tags.includes("Rings") || p.tags.includes("Engagement Rings");
  const style = isRing ? STYLES.find(s => p.tags.includes(s)) : undefined;
  const noun = isRing ? "Ring" : p.tags.includes("Earrings") ? "Earrings" : p.tags.includes("Pendants") ? "Pendant Necklace" : p.tags.includes("Necklaces") ? "Necklace" : /bangle/i.test(p.title) ? "Bangle" : p.tags.includes("Bracelets") ? "Bracelet" : "Jewelry";
  const ctw = /([\d.]+)\s*ctw/i.exec(p.title)?.[1];
  const title = `${[colour, [...new Set(shapes)].join(" & "), style].filter(Boolean).join(" ")} Lab Grown Diamond ${noun} in ${metalOf(p.title, p.description, p.tags)}${ctw ? `, ${ctw} ctw` : ""}`.trim();
  return { title, seo: `${title}. One of one: made once, never again. Free insured shipping and 30-day returns.` };
}
function readyToShip(p: P) {
  const style0 = /Diamond\s+(.+?)\s*·/.exec(p.title)?.[1] || p.productType;
  const map: Record<string, string> = { Studs: "Stud Earrings", Huggies: "Huggie Earrings", Hoops: "Hoop Earrings", Solitaire: "Solitaire Pendant", Pendant: "Pendant Necklace" };
  let style = map[style0] || style0;
  if (!/ring|earring|necklace|bracelet|band|pendant|bangle|brooch|huggie|hoop|stud/i.test(style)) style += ` ${p.productType === "Band" ? "Band" : p.productType || ""}`.trimEnd();
  const sh = /\d+\s+([a-z-]+?)(?:-cut)?\s+diamonds/i.exec(p.description)?.[1]?.toLowerCase();
  const SH: Record<string, string> = { oval: "Oval", emerald: "Emerald", asscher: "Asscher", radiant: "Radiant", princess: "Princess", "half-moon": "Half-Moon", marquise: "Marquise", pear: "Pear", cushion: "Cushion", heart: "Heart", round: "Round", baguette: "Baguette", kite: "Kite" };
  const shape = sh ? SH[sh] : undefined;
  const ct = /([\d.]+)\s*ct\b/i.exec(p.title)?.[1];
  const title = `${shape ? shape + " " : ""}Lab Grown Diamond ${style} in ${metalOf(p.title, p.description, p.tags)}${ct ? `, ${ct} ct` : ""}`;
  return { title, seo: `${title}. Ready to ship, one of each. Free insured shipping and 30-day returns.` };
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ok = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now(); let done = 0, failed = 0; const log: string[] = [];
  const d = await adminGraphql<{ products: { nodes: P[] } }>(`query{ products(first:120, query:"-tag:'seo-v1' AND (tag:'One of One' OR (tag:'Ready to Ship' AND tag:'bg-checked'))"){ nodes{ id handle title productType tags description } } }`, {});
  for (const p of d?.products.nodes || []) {
    if (Date.now() - t0 > 240_000) break;
    const { title, seo } = p.tags.includes("One of One") ? oneOfOne(p) : readyToShip(p);
    let handle = slug(title);
    for (let attempt = 0; attempt < 2; attempt++) {
      const r = await adminGraphql<{ productUpdate: { product: { handle: string } | null; userErrors: { message: string }[] } }>(
        `mutation($p:ProductUpdateInput!){ productUpdate(product:$p){ product{ handle } userErrors{ message } } }`,
        { p: { id: p.id, title, handle, seo: { title: title.slice(0, 70), description: seo.slice(0, 320) } } });
      const errs = r?.productUpdate.userErrors || [];
      if (!errs.length && r?.productUpdate.product) {
        await adminGraphql(`mutation($id:ID!,$t:[String!]!){ tagsAdd(id:$id, tags:$t){ userErrors{ message } } }`, { id: p.id, t: ["seo-v1", `oldhandle-${p.handle}`] });
        done++; if (log.length < 15) log.push(`${p.handle} → ${r.productUpdate.product.handle}`); break;
      }
      if (attempt === 0 && errs.some(e => /handle/i.test(e.message))) { handle = slug(`${title} ${p.handle.split("-").pop()}`); continue; } // same name twice: add the old code
      failed++; log.push(`! ${p.handle}: ${errs.map(e => e.message).join("; ")}`); break;
    }
  }
  console.log(`[seo-rename] ${done} renamed, ${failed} failed`, log.join(" | "));
  return NextResponse.json({ done, failed, log });
}
