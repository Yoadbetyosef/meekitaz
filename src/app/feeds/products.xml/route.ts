import { NextRequest } from "next/server";

export const maxDuration = 300;
export const dynamic = "force-dynamic"; // streamed on request and cached at the edge for 6 hours — a prerendered page this size (34 MB) is over Vercel's 20 MB ISR limit and broke the deploy

/* Product feed for Google Merchant Center and Meta (Facebook / Instagram) Commerce Manager — both read this RSS/XML format.
   Every link points to meekitaz.com, never to the Shopify store. It lists exactly what a shopper can buy on the site:
   live, published products, minus the helper products the site never shows (configured copies, karat variants, loose-diamond
   placeholders, care packages, World Cup pieces). Each piece appears once (its first variant), at the site's price. */
const SITE = "https://meekitaz.com";
const HIDE = new Set(["Configured", "Karat variant", "Diamond", "care-package", "FIFA World Cup 2026", "fifa world cup 2026"]);
type N = { handle: string; title: string; description: string; productType: string; vendor: string; tags: string[]; availableForSale: boolean;
  featuredImage: { url: string } | null; images: { nodes: { url: string }[] };
  variants: { nodes: { id: string; sku: string | null; price: { amount: string }; compareAtPrice: { amount: string } | null }[] } };

const esc = (s: string) => s.replace(/[<>&'"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
const strip = (s: string) => s.replace(/\s+/g, " ").trim();
function category(n: N): string {
  const t = `${n.productType} ${n.tags.join(" ")} ${n.title}`.toLowerCase();
  if (/earring|stud|hoop|huggie/.test(t)) return "Apparel & Accessories > Jewelry > Earrings";
  if (/necklace|pendant/.test(t)) return "Apparel & Accessories > Jewelry > Necklaces";
  if (/bracelet|bangle/.test(t)) return "Apparel & Accessories > Jewelry > Bracelets";
  if (/brooch/.test(t)) return "Apparel & Accessories > Jewelry > Brooches & Lapel Pins";
  if (/ring|band/.test(t)) return "Apparel & Accessories > Jewelry > Rings";
  return "Apparel & Accessories > Jewelry";
}
function kind(n: N): string {
  if (n.tags.includes("One of One")) return "One of One";
  if (n.tags.includes("Ready to Ship")) return "Ready to Ship";
  return n.productType || "Jewelry";
}

async function* pages(): AsyncGenerator<N[]> {
  let after: string | null = null;
  for (let i = 0; i < 120; i++) {
    const r = await fetch(`${process.env.SHOPIFY_API_BASE || `https://${process.env.SHOPIFY_STORE_DOMAIN}`}/api/2025-07/graphql.json`, {
      method: "POST", headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": process.env.SHOPIFY_STOREFRONT_TOKEN || "" },
      body: JSON.stringify({ query: `query($after:String){ products(first:250, after:$after){ pageInfo{ hasNextPage endCursor } nodes{ handle title description productType vendor tags availableForSale featuredImage{ url } images(first:4){ nodes{ url } } variants(first:1){ nodes{ id sku price{ amount } compareAtPrice{ amount } } } } } }`, variables: { after } }),
    });
    const j = await r.json() as { data?: { products: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: N[] } } };
    const p = j.data?.products; if (!p) break;
    yield p.nodes;
    if (!p.pageInfo.hasNextPage) break; after = p.pageInfo.endCursor;
  }
}

function item(n: N): string {
  const v = n.variants.nodes[0], price = +v.price.amount, compare = v.compareAtPrice ? +v.compareAtPrice.amount : 0;
  const id = v.sku || v.id.split("/").pop()!;
  const extra = n.images.nodes.map(x => x.url).filter(u => u !== n.featuredImage!.url).slice(0, 3);
  const desc = strip(n.description || n.title).slice(0, 4900);
  return `<item>
<g:id>${esc(id)}</g:id><g:item_group_id>${esc(n.handle)}</g:item_group_id>
<title>${esc(strip(n.title).slice(0, 150))}</title>
<description>${esc(desc)}</description>
<link>${SITE}/products/${esc(n.handle)}</link>
<g:image_link>${esc(n.featuredImage!.url)}</g:image_link>${extra.map(u => `<g:additional_image_link>${esc(u)}</g:additional_image_link>`).join("")}
<g:availability>${n.availableForSale ? "in_stock" : "out_of_stock"}</g:availability>
${compare > price ? `<g:price>${compare.toFixed(2)} USD</g:price><g:sale_price>${price.toFixed(2)} USD</g:sale_price>` : `<g:price>${price.toFixed(2)} USD</g:price>`}
<g:brand>Meekitaz</g:brand><g:condition>new</g:condition><g:identifier_exists>no</g:identifier_exists>
<g:google_product_category>${esc(category(n))}</g:google_product_category><g:product_type>${esc(kind(n))}</g:product_type>
<g:shipping><g:country>US</g:country><g:price>0.00 USD</g:price></g:shipping>
</item>`;
}

export async function GET(_req: NextRequest) {
  const enc = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(c) {
      c.enqueue(enc.encode(`<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>\n<title>Meekitaz</title><link>${SITE}</link><description>Lab-grown diamond jewelry</description>\n`));
      try {
        for await (const page of pages()) {
          const items = page.filter(n => n.featuredImage && !n.tags.some(t => HIDE.has(t)) && +n.variants.nodes[0]?.price.amount > 0).map(item);
          if (items.length) c.enqueue(enc.encode(items.join("\n") + "\n"));
        }
      } finally {
        c.enqueue(enc.encode(`</channel></rss>`));
        c.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=21600, stale-while-revalidate=86400" } });
}
