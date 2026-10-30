import Image from "next/image";
import { Suspense } from "react";
import ProductBrowser from "@/components/ProductBrowser";
import { getCollectionPage, shopifyConfigured, type Product } from "@/lib/shopify";
import { fillPage } from "@/lib/designs";
import OneCircles from "@/components/OneCircles";
import { oneOfOneQuery } from "@/lib/ringfilters";
import { getProductsByQuery } from "@/lib/shopify";

export const dynamic = "force-dynamic";
export const metadata = { title: "One of One — MEEKITAZ", description: "Made once. Never again. One stone, one setting, one ring; when it’s claimed, it’s gone." };

/* /one-of-one — the one-of-ones, in the supplier's order (newest first). The hero repeats the home-page block: the model coming in from the right,
   the big M behind her; the rings follow in the usual grid with "Show more". */
export default async function OneOfOnePage({ searchParams }: { searchParams: Promise<{ style?: string }> }) {
  const { style = "" } = await searchParams;
  let r: { products: Product[]; hasNext: boolean; cursor: string | null } | null = null;
  if (shopifyConfigured) {
    const f = await fillPage([], { cursor: null, hasNext: true }, after => style ? getProductsByQuery(oneOfOneQuery("one-of-one", style), { first: 24, after, sort: "new" }) : getCollectionPage("one-of-one", { first: 24, after, sort: "new" }), 24, 5).catch(() => null);
    if (f && (f.items.length || !f.failed)) r = { products: f.items, hasNext: f.hasNext, cursor: f.cursor };
  }
  return (
    <main>
      <section className="cat-hero" aria-label="One of One">
        <Image src="https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261021_005300_520e34ad-6539-4260-82ac-59d4202aeb20.png" alt="" fill loading="eager" fetchPriority="high" sizes="100vw" quality={78} style={{ "--hero-pos": "50% 35%", "--hero-zoom": 1 } as import("react").CSSProperties} />
        <div className="wrap"><h1>One of One.</h1></div>
      </section>
      <div className="catbody" id="results">
        <section className="shapes" aria-label="Jewelry type"><div className="wrap"><OneCircles current={style} /></div></section>
        {r ? <Suspense fallback={null}><ProductBrowser key={style} handle="one-of-one" style={style} sort0="new" initial={r.products} hasNext={r.hasNext} cursor={r.cursor} /></Suspense>
           : <section className="grid-wrap"><div className="wrap"><h2>The collection</h2><p>The one-of-ones are on their way. Check back in a moment.</p></div></section>}
      </div>
    </main>
  );
}
