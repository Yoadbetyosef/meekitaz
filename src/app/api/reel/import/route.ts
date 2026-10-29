import { NextRequest, NextResponse } from "next/server";
import { adminGraphql } from "@/lib/shopifyAdmin";
import rows from "@/data/reel-import.json";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/* The Reel import — the ready-to-ship stock list: one of each, video first. Runs from the cron (or with ?key=CRON_SECRET),
   a few hundred per run, four at a time, idempotent by handle. Price = our catalog's price for the same category and carat;
   the supplier's cost is stored on the variant so margin reports and Daily use real numbers. */
type Row = { lot: string; handle: string; title: string; desc: string; type: string; price: number; compare: number; cost: number; tags: string[]; image: string | null; video: string | null; size: string | null };
const LOC = "gid://shopify/Location/95949258989";
const PUBS = ["gid://shopify/Publication/223010783469", "gid://shopify/Publication/222997545197", "gid://shopify/Publication/222997577965"];

async function exists(handle: string) {
  const d = await adminGraphql<{ productByIdentifier: { id: string } | null }>(`query($h:String!){ productByIdentifier(identifier:{handle:$h}){ id } }`, { h: handle });
  return d?.productByIdentifier?.id || null;
}
async function createOne(r: Row) {
  const input = {
    title: r.title, handle: r.handle, descriptionHtml: r.desc, productType: r.type, vendor: "Meekitaz", status: "ACTIVE", tags: r.tags,
    files: r.image ? [{ originalSource: r.image, contentType: "IMAGE", alt: r.title }] : [],
    metafields: [...(r.video ? [{ namespace: "meekitaz", key: "video", type: "url", value: r.video }] : []), { namespace: "meekitaz", key: "lot", type: "single_line_text_field", value: r.lot }, ...(r.size ? [{ namespace: "meekitaz", key: "size", type: "single_line_text_field", value: r.size }] : [])],
    productOptions: [{ name: "Title", values: [{ name: "Default Title" }] }],
    variants: [{ optionValues: [{ optionName: "Title", name: "Default Title" }], price: String(r.price), compareAtPrice: String(r.compare), inventoryPolicy: "DENY", inventoryItem: { sku: "MK-RTS-" + r.lot, tracked: true, cost: String(r.cost) }, inventoryQuantities: [{ locationId: LOC, name: "available", quantity: 1 }] }],
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
  const list = [...(rows as Row[])].reverse(); // last-first, so the list's first piece is the newest on the site
  for (let i = 0; i < list.length; i += 4) {
    if (Date.now() - t0 > budget) { log.push("budget reached; the next run continues"); break; }
    await Promise.all(list.slice(i, i + 4).map(async r => {
      try {
        if (await exists(r.handle)) { skipped++; return; }
        await createOne(r); created++; if (log.length < 60) log.push(`+ ${r.handle} $${r.price}`);
      } catch (e) { failed++; if (log.length < 60) log.push(`! ${r.handle}: ${e instanceof Error ? e.message : String(e)}`); }
    }));
  }
  return NextResponse.json({ created, skipped, failed, remaining: list.length - created - skipped - failed, log });
}
