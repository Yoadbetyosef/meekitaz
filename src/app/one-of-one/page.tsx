import Image, { getImageProps } from "next/image";
import { Suspense } from "react";
import ProductBrowser from "@/components/ProductBrowser";
import { getCollectionPage, shopifyConfigured, type Product } from "@/lib/shopify";
import { fillPage } from "@/lib/designs";
import OneCircles from "@/components/OneCircles";
import { oneOfOneQuery } from "@/lib/ringfilters";
import { getProductsByQuery } from "@/lib/shopify";
import OooPhoto from "@/components/OooPhoto";

export const dynamic = "force-dynamic";
export const metadata = { title: "One of One — MEEKITAZ", description: "Made once. Never again. One stone, one setting, one ring; when it’s claimed, it’s gone." };

/* /one-of-one — the one-of-ones, in the supplier's order (newest first). The hero repeats the home-page block: the model coming in from the right,
   the big M behind her; the rings follow in the usual grid with "Show more". */
export default async function OneOfOnePage({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const { style: asked } = await searchParams;
  const style = asked === undefined ? "Rings" : asked === "all" ? "" : asked; // the page opens on rings; "All" is ?style=all
  let r: { products: Product[]; hasNext: boolean; cursor: string | null } | null = null;
  if (shopifyConfigured) {
    const f = await fillPage([], { cursor: null, hasNext: true }, after => style ? getProductsByQuery(oneOfOneQuery("one-of-one", style), { first: 24, after, sort: "new" }) : getCollectionPage("one-of-one", { first: 24, after, sort: "new" }), 24, 5).catch(() => null);
    if (f && (f.items.length || !f.failed)) r = { products: f.items, hasNext: f.hasNext, cursor: f.cursor };
  }
  const heroM = getImageProps({ src: "/media/ooo/hero-m.webp", alt: "", fill: true, sizes: "100vw", quality: 80 }).props;
  return (
    <main>
      <section className="cat-hero cat-ooo" aria-label="One of One">
        <picture>{/* the red-sunglasses lipstick portrait (2026-11-01): wide on computers, tall on phones */}
          <source media="(max-width:767px)" srcSet={heroM.srcSet} sizes="100vw" />
          <Image src="/media/ooo/hero-d.webp" alt="" fill loading="eager" fetchPriority="high" sizes="100vw" quality={80} style={{ "--hero-pos": "30% 22%", "--hero-zoom": 1 } as import("react").CSSProperties} />
        </picture>
        <div className="wrap"><h1>One of One.</h1></div>
      </section>
      <div className="catbody" id="results">
        <section className="shapes" aria-label="Jewelry type"><div className="wrap"><OneCircles current={style} /></div></section>
        {r ? <Suspense fallback={null}><ProductBrowser key={style} handle="one-of-one" style={style} sort0="new" initial={r.products} hasNext={r.hasNext} cursor={r.cursor} slot={<OooPhoto />} slotAt={6} /></Suspense>
           : <section className="grid-wrap"><div className="wrap"><h2>The collection</h2><p>The one-of-ones are on their way. Check back in a moment.</p></div></section>}
      </div>
    </main>
  );
}
