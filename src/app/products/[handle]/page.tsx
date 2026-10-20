import { notFound, permanentRedirect } from "next/navigation";
import { getProductByHandle, getSiblings, getRelated, getRingFamily, designCode, shopifyConfigured, findByOldHandle } from "@/lib/shopify";
import { categories } from "@/lib/data";
import { brandify, isBlocked } from "@/lib/text";
import { fancyColorOf, FANCY_COLORS } from "@/lib/fancy";
import { fancySwatches, vdbConfigured } from "@/lib/vdb";
import { adminConfigured, getProductOptions } from "@/lib/shopifyAdmin";
import ProductView from "@/components/ProductView";

export const revalidate = 300;

async function load(handle: string) {
  if (!shopifyConfigured) return null;
  const p = await getProductByHandle(decodeURIComponent(handle));
  return p && !isBlocked(p.tags) ? p : null;
}
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const p = await load((await params).handle);
  if (!p) return { title: "MEEKITAZ" };
  const desc = brandify(p.seoDescription || p.description).replace(/\s+/g, " ").slice(0, 160);
  return { title: `${brandify(p.seoTitle || p.title)} — MEEKITAZ`, description: desc, alternates: { canonical: `https://www.meekitaz.com/products/${p.handle}` }, openGraph: { title: brandify(p.title), description: desc, images: p.images[0] ? [p.images[0].url] : [] } };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const handle = decodeURIComponent((await params).handle);
  const p = await load(handle);
  if (!p) {
    const now = shopifyConfigured ? await findByOldHandle(handle) : null; // a link from before handles were renamed to titles
    if (now) permanentRedirect(`/products/${now}`);
    notFound();
  }
  const code = designCode(p.tags), isRing = p.tags.includes("Engagement Ring");
  const myColor = fancyColorOf(p.title);
  const options = !isRing && adminConfigured ? await getProductOptions(p.handle) : null; // weight / colour / clarity / purity tree for pieces that have one
  const [siblings, related, family, ...others] = await Promise.all([
    isRing ? Promise.resolve([]) : getSiblings(code, p.handle, p.title), getRelated(p.productType, p.handle), isRing ? getRingFamily(code, myColor) : Promise.resolve([]),
    ...(isRing ? ["", ...FANCY_COLORS].filter(c => c !== myColor).map(c => getRingFamily(code, c)) : []),
  ]);
  // the same design with a different stone colour, for the colour picker (white and the fancy colours that exist for this design)
  const palette = isRing ? ["", ...FANCY_COLORS].filter(c => c !== myColor).map((c, i) => ({ color: c, items: (others[i] || []).map(v => ({ handle: v.handle, shape: v.shape, metal: v.metal })) })).filter(x => x.items.length) : [];
  const shapes = categories.find(c => c.slug === "engagement-rings")?.styles ?? [];
  // Shopify's search index can lag behind a handle rename, so this page is matched into its family by product id and always listed under its current handle.
  const fam = family.map(v => (v.id === p.id ? { ...v, handle: p.handle } : v));
  const ring = isRing && fam.some(v => v.id === p.id) && fam.length > 1 ? { family: fam.map(v => ({ ...v, title: brandify(v.title) })), shapes, ns: code, color: myColor, palette, swatches: palette.length && vdbConfigured ? await fancySwatches() : {} } : undefined;
  const v = p.variants[0];
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: brandify(p.title), image: p.images.map(i => i.url), description: brandify(p.description).slice(0, 500),
    brand: { "@type": "Brand", name: "Meekitaz" },
    offers: { "@type": "Offer", priceCurrency: p.currency, price: v?.price, availability: p.variants.some(x => x.available) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <ProductView
        product={{ ...p, title: brandify(p.title), descriptionHtml: brandify(p.descriptionHtml), description: brandify(p.description) }}
        siblings={siblings.map(s => ({ ...s, title: brandify(s.title) }))}
        related={related.map(r => ({ ...r, title: brandify(r.title) }))}
        ring={ring}
        options={options}
      />
    </>
  );
}
