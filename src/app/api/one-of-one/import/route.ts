import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";
import rows from "@/data/one-of-one-import.json";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* One of One import — 354 rings from Classic Grown Diamonds, in the supplier's order.
   Runs from the cron (or with ?key=CRON_SECRET), imports what is not in the store yet, a few dozen per run, idempotent by handle.
   Created LAST-first, so the first ring on the supplier's list ends up the newest = first on the home page. */
type Row = { sku: string; handle: string; title: string; desc: string; price: number; tags: string[]; images: string[]; video: string | null; videoGuess: string | null; guess?: string[]; try?: string; type?: string; syncPrice?: boolean };
const alive = async (u: string) => { try { const r = await fetch(u, { headers: { Range: "bytes=0-0" }, signal: AbortSignal.timeout(8000) }); try { await r.body?.cancel(); } catch { /* ignore */ } return r.ok; } catch { return false; } };
/** Only files the supplier really has: the image list was reconstructed by pattern for most rings, so each URL is checked first. */
async function liveMedia(r: Row) {
  const imgs = (await Promise.all(r.images.map(async u => (await alive(u)) ? u : null))).filter((u): u is string => !!u);
  const vid = r.video || (r.videoGuess && (await alive(r.videoGuess)) ? r.videoGuess : null);
  return { imgs, vid };
}
const LOC = "gid://shopify/Location/95949258989";
const done = new Set<string>(), tried = new Set<string>(), priced = new Set<string>(); // handles whose video was already checked in this process
const PUBS = ["gid://shopify/Publication/223010783469", "gid://shopify/Publication/222997545197", "gid://shopify/Publication/222997577965"];

async function exists(handle: string) {
  const d = await adminGraphql<{ productByIdentifier: { id: string } | null }>(`query($h:String!){ productByIdentifier(identifier:{handle:$h}){ id } }`, { h: handle });
  return d?.productByIdentifier?.id || null;
}
async function createOne(r: Row) {
  const imgs = [...r.images, ...(r.guess || [])], vid = r.video || null; // photos unverified (Shopify fetches, failures are cleaned up by the repair pass); only videos we saw on the supplier page
  const input = {
    title: r.title, handle: r.handle, descriptionHtml: r.desc, productType: r.type || "Ring", vendor: "Meekitaz", status: "ACTIVE", tags: r.tags,
    files: imgs.map(u => ({ originalSource: u, contentType: "IMAGE", alt: r.title })),
    metafields: vid ? [{ namespace: "meekitaz", key: "video", type: "url", value: vid }] : [],
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [{ optionValues: [{ optionName: "Title", name: "Default Title" }], price: String(r.price), compareAtPrice: String(r.price * 2), inventoryPolicy: "DENY", inventoryItem: { sku: "MK-1OF1-" + r.sku, tracked: true }, inventoryQuantities: [{ locationId: LOC, name: "available", quantity: 1 }] }],
  };
  const d = await adminGraphql<{ productSet: { product: { id: string } | null; userErrors: { message: string }[] } }>(`mutation($input: ProductSetInput!){ productSet(synchronous:true, input:$input){ product{ id } userErrors{ message } } }`, { input });
  const id = d?.productSet.product?.id;
  if (!id) throw new Error(d?.productSet.userErrors.map(e => e.message).join("; ") || "no product");
  await adminGraphql(`mutation($id:ID!,$in:[PublicationInput!]!){ publishablePublish(id:$id, input:$in){ userErrors{ message } } }`, { id, in: PUBS.map(publicationId => ({ publicationId })) });
  return id;
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const ok = process.env.CRON_SECRET && (req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}` || sp.get("key") === process.env.CRON_SECRET);
  if (!ok) { console.log("[one-of-one] unauthorized call"); return NextResponse.json({ error: "unauthorized" }, { status: 401 }); }
  const t0 = Date.now(), budget = 240_000, log: string[] = []; let created = 0, skipped = 0, failed = 0;
  const list = [...(rows as Row[])].reverse();
  for (const r of list) {
    if (Date.now() - t0 > budget) { log.push("budget reached; the next run continues"); break; }
    try {
      const id = await exists(r.handle);
      if (id && r.syncPrice && !priced.has(r.handle)) { // price rule changed after creation (necklaces ×3): bring the live price in line once
        const v = await adminGraphql<{ product: { variants: { nodes: { id: string; price: string }[] } } | null }>(`query($id:ID!){ product(id:$id){ variants(first:1){ nodes{ id price } } } }`, { id });
        const vr = v?.product?.variants.nodes[0];
        if (vr && Math.round(+vr.price) !== r.price) { await adminGraphql(`mutation($p:ID!,$v:[ProductVariantsBulkInput!]!){ productVariantsBulkUpdate(productId:$p, variants:$v){ userErrors{ message } } }`, { p: id, v: [{ id: vr.id, price: String(r.price), compareAtPrice: String(r.price * 2) }] }); log.push(`$ ${r.handle}: ${vr.price} → ${r.price}`); }
        priced.add(r.handle);
      }
      if (id) {
        if (!done.has(r.handle)) { // photos: the supplier's host does not answer our checks, so Shopify fetches every candidate URL itself; the ones that fail are deleted next run
          const m = await adminGraphql<{ product: { tags: string[]; media: { nodes: { id: string; status: string }[] } } | null }>(`query($id:ID!){ product(id:$id){ tags media(first:60){ nodes{ id status } } } }`, { id });
          const media = m?.product?.media.nodes || [];
          const triedBefore = (m?.product?.tags || []).includes(`photos-tried-${r.try || "s3"}`);
          const failed = media.filter(x => x.status === "FAILED").map(x => x.id);
          if (failed.length) { // the site's Admin token has no write_files scope: a failed delete must not stop the photos from being added
            try { await adminGraphql(`mutation($ids:[ID!]!){ fileDelete(fileIds:$ids){ deletedFileIds userErrors{ message } } }`, { ids: failed }); log.push(`- ${r.handle}: ${failed.length} missing photos removed`); } catch { /* cleaned up by hand later */ }
          }
          const ready = media.filter(x => x.status === "READY").length, pending = media.filter(x => x.status === "PROCESSING").length;
          if (!ready && !pending && !triedBefore) { // one attempt with the current URL set (S3), remembered on the product so it is not repeated every run
            const urls = [...r.images, ...(r.guess || [])];
            if (urls.length) { await adminGraphql(`mutation($id:ID!,$media:[CreateMediaInput!]!){ productUpdate(product:{ id:$id }, media:$media){ userErrors{ message } } }`, { id, media: urls.map(u => ({ originalSource: u, mediaContentType: "IMAGE", alt: r.title })) }); log.push(`~ ${r.handle}: ${urls.length} photo candidates sent (S3)`); }
            await adminGraphql(`mutation($id:ID!,$t:[String!]!){ tagsAdd(id:$id, tags:$t){ userErrors{ message } } }`, { id, t: [`photos-tried-${r.try || "s3"}`] });
          } else if (!ready && !pending && triedBefore && !failed.length) { log.push(`? ${r.handle}: no photo found at the supplier`); }
        }
        if (!r.video && r.videoGuess && !done.has(r.handle)) { // rings imported before the video check: attach the clip if the supplier has one
          const has = await adminGraphql<{ product: { metafield: { value: string } | null } | null }>(`query($id:ID!){ product(id:$id){ metafield(namespace:"meekitaz",key:"video"){ value } } }`, { id });
          if (!has?.product?.metafield && (await alive(r.videoGuess))) { await adminGraphql(`mutation($id:ID!,$v:String!){ productUpdate(product:{ id:$id, metafields:[{ namespace:"meekitaz", key:"video", type:"url", value:$v }] }){ userErrors{ message } } }`, { id, v: r.videoGuess }); log.push(`~ ${r.handle}: video attached`); }
          done.add(r.handle);
        }
        skipped++; continue;
      }
      await createOne(r); created++; log.push(`+ ${r.handle} $${r.price}`);
    } catch (e) { failed++; log.push(`! ${r.handle}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  const remaining = list.length - created - skipped - failed;
  console.log(`[one-of-one] created ${created} skipped ${skipped} failed ${failed} remaining ${remaining} in ${Math.round((Date.now() - t0) / 1000)}s`, log.slice(0, 40).join(" | "));
  return NextResponse.json({ created, skipped, failed, remaining, log });
}
