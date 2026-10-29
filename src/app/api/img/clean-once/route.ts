import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";
import { cleanImage } from "@/lib/engrave";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* Clean once, at the source. For every catalogue product not yet tagged "photos-clean" (One of One and Ready to Ship excluded — supplier photos
   carry no engraving), each of the first five photos is run through the engraving cleaner; when the cleaner changed something, the clean copy is
   uploaded to Shopify Files, put in the original's place in the product's media, and the original removed. Nothing runs at page-load time any more.
   Needs the Admin app scopes write_files and write_products. A few products per run, from the cron. */
const EARRING = /earring|stud|hoop|huggie|drop|jacket/i, RING = /ring|band|solitaire|halo/i;
type Media = { id: string; alt: string | null; image: { url: string } | null };
type Node = { id: string; title: string; tags: string[]; media: { nodes: Media[] } };

async function uploadJpeg(buf: Buffer, name: string): Promise<string> {
  const s = await adminGraphql<{ stagedUploadsCreate: { stagedTargets: { url: string; resourceUrl: string; parameters: { name: string; value: string }[] }[]; userErrors: { message: string }[] } }>(
    `mutation($in:[StagedUploadInput!]!){ stagedUploadsCreate(input:$in){ stagedTargets{ url resourceUrl parameters{ name value } } userErrors{ message } } }`,
    { in: [{ resource: "IMAGE", filename: name, mimeType: "image/jpeg", httpMethod: "POST", fileSize: String(buf.length) }] });
  const t = s?.stagedUploadsCreate.stagedTargets[0];
  if (!t) throw new Error("staged upload: " + (s?.stagedUploadsCreate.userErrors.map(e => e.message).join("; ") || "no target"));
  const form = new FormData();
  for (const p of t.parameters) form.append(p.name, p.value);
  form.append("file", new Blob([new Uint8Array(buf)], { type: "image/jpeg" }), name);
  const r = await fetch(t.url, { method: "POST", body: form });
  if (!r.ok) throw new Error(`upload ${r.status}`);
  return t.resourceUrl;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ok = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now(), log: string[] = []; let products = 0, replaced = 0, failed = 0;
  const d = await adminGraphql<{ products: { nodes: Node[] } }>(`query{ products(first:12, query:"status:active AND -tag:'photos-clean' AND -tag:'One of One' AND -tag:'Ready to Ship'", sortKey:UPDATED_AT){ nodes{ id title tags media(first:5){ nodes{ ... on MediaImage { id alt image{ url } } } } } } }`, {});
  for (const n of d?.products.nodes || []) {
    if (Date.now() - t0 > 230_000) break;
    const mode = EARRING.test(n.title) ? "gold" : "ring";
    if (!RING.test(n.title) && mode !== "gold") { await tag(n.id); products++; continue; } // nothing to clean on this kind of piece
    let changed = 0;
    try {
      const all = n.media.nodes.filter(m => m.image);
      const cleanOnes = all.filter(m => /-clean(_\d+)?\.jpg/i.test(m.image!.url));
      if (cleanOnes.length) { // a clean copy is already there (from a run that could not remove the original): finish the swap, drop extra copies
        const base = (u: string) => (u.split("/").pop() || "").replace(/\?.*$/, "").replace(/-clean(_\d+)?\.jpg$/i, "").replace(/(_\d+)?\.(jpg|png|webp|jpeg)$/i, "");
        const keep = new Map<string, Media>(); const drop: Media[] = [];
        for (const m of cleanOnes) { const b = base(m.image!.url); if (keep.has(b)) drop.push(m); else keep.set(b, m); }
        for (const m of all.filter(m => !cleanOnes.includes(m))) if (keep.has(base(m.image!.url))) drop.push(m);
        if (drop.length) await adminGraphql(`mutation($files:[FileUpdateInput!]!){ fileUpdate(files:$files){ userErrors{ message } } }`, { files: drop.map(m => ({ id: m.id, referencesToRemove: [n.id] })) });
        await tag(n.id); products++; log.push(`${n.title}: swap finished, ${drop.length} removed`); continue;
      }
      const nodes = all;
      for (let slot = 0; slot < nodes.length; slot++) {
        const m = nodes[slot]; const url = m.image!.url.replace(/\?.*$/, "") + "?width=1600";
        const r = await fetch(url, { headers: { Accept: "image/jpeg,image/webp" } }); if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        const cleaned = await cleanImage(buf, slot, mode).catch(() => null);
        if (!cleaned || cleaned.equals(buf)) continue;
        const name = (m.image!.url.split("/").pop() || "photo").replace(/\?.*$/, "").replace(/\.(png|webp|jpeg)$/i, ".jpg").replace(/\.jpg$/i, "-clean.jpg");
        const resourceUrl = await uploadJpeg(cleaned, name);
        // add the clean copy, move it into the original's slot, drop the original
        const add = await adminGraphql<{ productUpdate: { product: { media: { nodes: { id: string; alt: string | null }[] } } | null; userErrors: { message: string }[] } }>(
          `mutation($id:ID!,$media:[CreateMediaInput!]!){ productUpdate(product:{ id:$id }, media:$media){ product{ media(first:30){ nodes{ ... on MediaImage { id alt } } } } userErrors{ message } } }`,
          { id: n.id, media: [{ originalSource: resourceUrl, mediaContentType: "IMAGE", alt: (m.alt || n.title) + " " }] });
        const list = add?.productUpdate.product?.media.nodes || []; const newId = list[list.length - 1]?.id;
        if (!newId) throw new Error(add?.productUpdate.userErrors.map(e => e.message).join("; ") || "no media id");
        await adminGraphql(`mutation($id:ID!,$moves:[MoveInput!]!){ productReorderMedia(id:$id, moves:$moves){ userErrors{ message } } }`, { id: n.id, moves: [{ id: newId, newPosition: String(slot) }] });
        await adminGraphql(`mutation($files:[FileUpdateInput!]!){ fileUpdate(files:$files){ userErrors{ message } } }`, { files: [{ id: m.id, referencesToRemove: [n.id] }] });
        changed++; replaced++;
      }
      await tag(n.id); products++; log.push(`${n.title}: ${changed} cleaned`);
    } catch (e) { failed++; log.push(`! ${n.title}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  console.log(`[photos-clean] ${products} products, ${replaced} photos replaced, ${failed} failed`, log.slice(0, 20).join(" | "));
  return NextResponse.json({ products, replaced, failed, log });
}
async function tag(id: string) { await adminGraphql(`mutation($id:ID!){ tagsAdd(id:$id, tags:["photos-clean"]){ userErrors{ message } } }`, { id }); }
