import ProductBrowser from "@/components/ProductBrowser";
import FloatingHeroVideo from "@/components/FloatingHeroVideo";
import { getProductsByQuery } from "@/lib/shopify";
import { FLOATING_QUERY } from "@/lib/ringfilters";

export const revalidate = 300;
export const metadata = {
  title: "Floating Collection — MEEKITAZ",
  description: "No prongs, no bezel: each lab-grown diamond threaded onto the gold through a tiny drilled channel, so light comes in from every side.",
};

/* /floating · design B: the film and the promise, then how it floats (drilled, threaded, free), then the pieces. */
export default async function FloatingPage() {
  const r = await getProductsByQuery(FLOATING_QUERY, { first: 24, sort: "new" }).catch(() => null);
  return (
    <main className="flp">
      <section className="flp-hero">
        <div className="flp-card"><FloatingHeroVideo /></div>
        <div className="flp-tx">
          <p className="fl-eye"><i />Floating collection</p>
          <h1>Floating.<em>Light, all the way through.</em></h1>
          <p>No prongs, no bezel. Each diamond is threaded onto the gold through a tiny drilled channel, so nothing stands between the stone and the light.</p>
        </div>
      </section>
      <section className="flp-how" aria-label="How it floats">
        <div className="wrap flp-how-in">
          <img src="/media/floating-diamond.webp" alt="A marquise diamond threaded onto a gold chain through a drilled channel" loading="lazy" />
          <div>
            <p className="fl-eye"><i />How it floats</p>
            <div className="flp-steps">
              <div className="flp-step"><b>01</b><div><h3>Drilled</h3><p>A channel finer than a hair is laser-drilled through the tip of the stone.</p></div></div>
              <div className="flp-step"><b>02</b><div><h3>Threaded</h3><p>A single gold ring passes through it and onto the chain. Nothing grips the diamond.</p></div></div>
              <div className="flp-step"><b>03</b><div><h3>Free</h3><p>Light comes in from every side and leaves as fire. It moves when you move.</p></div></div>
            </div>
          </div>
        </div>
      </section>
      <div className="catbody" id="results">
        {r && r.products.length > 0 && <ProductBrowser handle="floating" sort0="new" initial={r.products} hasNext={r.hasNext} cursor={r.cursor} />}
      </div>
    </main>
  );
}
