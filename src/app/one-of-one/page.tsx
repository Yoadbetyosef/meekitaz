import { Suspense } from "react";
import ProductBrowser from "@/components/ProductBrowser";
import { getCollectionPage, shopifyConfigured, type Product } from "@/lib/shopify";
import { fillPage } from "@/lib/designs";

export const dynamic = "force-dynamic";
export const metadata = { title: "One of One — MEEKITAZ", description: "Made once. Never again. One stone, one setting, one ring; when it’s claimed, it’s gone." };

/* /one-of-one — the one-of-ones, in the supplier's order (newest first). The hero repeats the home-page block: the model coming in from the right,
   the big M behind her; the rings follow in the usual grid with "Show more". */
export default async function OneOfOnePage() {
  let r: { products: Product[]; hasNext: boolean; cursor: string | null } | null = null;
  if (shopifyConfigured) {
    const f = await fillPage([], { cursor: null, hasNext: true }, after => getCollectionPage("one-of-one", { first: 24, after }), 24, 5).catch(() => null);
    if (f && (f.items.length || !f.failed)) r = { products: f.items, hasNext: f.hasNext, cursor: f.cursor };
  }
  return (
    <main>
      <section className="ooo-wrap ooo-page" aria-label="One of One">
        <div className="ooo">
          <img className="ooo-m" src="/brand/meekitaz-m-white.png" alt="" aria-hidden="true" />
          <img className="ooo-girl" src="/media/home/one-of-one.jpg" alt="" fetchPriority="high" />
          <div className="ooo-copy">
            <p className="ooo-eye"><i />One of One</p>
            <h1 className="ooo-h">Made once.<em>Never again.</em></h1>
            <p className="ooo-lead">A single stone, a single setting, a single ring. When it&rsquo;s claimed, it&rsquo;s gone &mdash; we don&rsquo;t remake them.</p>
            <p className="ooo-fine">Every piece below exists exactly once. Lab-grown, certified, ready to ship.</p>
          </div>
        </div>
      </section>
      <div className="catbody">
        {r ? <Suspense fallback={null}><ProductBrowser handle="one-of-one" initial={r.products} hasNext={r.hasNext} cursor={r.cursor} /></Suspense>
           : <section className="grid-wrap"><div className="wrap"><h2>The collection</h2><p>The one-of-ones are on their way. Check back in a moment.</p></div></section>}
      </div>
    </main>
  );
}
