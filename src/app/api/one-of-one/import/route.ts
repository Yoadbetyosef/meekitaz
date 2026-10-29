import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";
import rows from "@/data/one-of-one-import.json";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* One of One import — 354 rings from Classic Grown Diamonds, in the supplier's order.
   Runs from the cron (or with ?key=CRON_SECRET), imports what is not in the store yet, a few dozen per run, idempotent by handle.
   Created LAST-first, so the first ring on the supplier's list ends up the newest = first on the home page. */
type Row = { sku: string; handle: string; title: string; desc: string; price: number; tags: string[]; images: string[]; video: string | null };
const LOC = "gid://shopify/Location/95949258989";
const PUBS = ["gid://shopify/Publication/223010783469", "gid://shopify/Publication/222997545197", "gid://shopify/Publication/222997577965"];

async function exists(handle: string) {
  const d = await adminGraphql<{ productByIdentifier: { id: string } | null }>(`query($h:String!){ productByIdentifier(identifier:{handle:$h}){ id } }`, { h: handle });
  return d?.productByIdentifier?.id || null;
}
async function createOne(r: Row) {
  const input = {
    title: r.title, handle: r.handle, descriptionHtml: r.desc, productType: "Ring", vendor: "Meekitaz", status: "ACTIVE", tags: r.tags,
    files: r.images.map(u => ({ originalSource: u, contentType: "IMAGE", alt: r.title })),
    metafields: r.video ? [{ namespace: "meekitaz", key: "video", type: "url", value: r.video }] : [],
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
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const t0 = Date.now(), budget = 240_000, log: string[] = []; let created = 0, skipped = 0, failed = 0;
  const list = [...(rows as Row[])].reverse();
  for (const r of list) {
    if (Date.now() - t0 > budget) { log.push("budget reached; the next run continues"); break; }
    try {
      if (await exists(r.handle)) { skipped++; continue; }
      await createOne(r); created++; log.push(`+ ${r.handle} $${r.price}`);
    } catch (e) { failed++; log.push(`! ${r.handle}: ${e instanceof Error ? e.message : String(e)}`); }
  }
  const remaining = list.length - created - skipped - failed;
  return NextResponse.json({ created, skipped, failed, remaining, log });
}
