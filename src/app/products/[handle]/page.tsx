import { notFound } from "next/navigation";
import { getProductByHandle, getSiblings, getRelated, getRingFamily, designCode, shopifyConfigured } from "@/lib/shopify";
import { categories } from "@/lib/data";
import { brandify, isBlocked } from "@/lib/text";
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
  return { title: `${brandify(p.seoTitle || p.title)} — MEEKITAZ`, description: desc, openGraph: { title: brandify(p.title), description: desc, images: p.images[0] ? [p.images[0].url] : [] } };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const p = await load((await params).handle);
  if (!p) notFound();
  const code = designCode(p.tags), isRing = p.tags.includes("Engagement Ring");
  const [siblings, related, family] = await Promise.all([isRing ? Promise.resolve([]) : getSiblings(code, p.handle), getRelated(p.productType, p.handle), isRing ? getRingFamily(code) : Promise.resolve([])]);
  const shapes = categories.find(c => c.slug === "engagement-rings")?.styles ?? [];
  const ring = isRing && family.some(v => v.handle === p.handle) && family.length > 1 ? { family: family.map(v => ({ ...v, title: brandify(v.title) })), shapes, ns: code } : undefined;
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
      />
    </>
  );
}
