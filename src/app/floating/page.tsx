import ProductBrowser from "@/components/ProductBrowser";
import FloatingHeroVideo from "@/components/FloatingHeroVideo";
import { getProductsByQuery } from "@/lib/shopify";
import Link from "next/link";
import { floatingQuery } from "@/lib/ringfilters";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Floating Collection — MEEKITAZ",
  description: "No prongs, no bezel: each lab-grown diamond threaded onto the gold through a tiny drilled channel, so light comes in from every side.",
};

/* /floating · design B: the film and the promise, then how it floats (drilled, threaded, free), then the pieces. */
export default async function FloatingPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "" } = await searchParams;
  const KINDS = ["Bracelets", "Earrings", "Necklaces"];
  const kind = KINDS.includes(type) ? type : ""; // opens on All
  const [r, ...pics] = await Promise.all([
    getProductsByQuery(floatingQuery(kind), { first: 24, sort: "new" }).catch(() => null),
    ...["", ...KINDS].map(k => getProductsByQuery(floatingQuery(k), { first: 1, sort: "new" }).then(x => x?.products[0]?.image?.url || null).catch(() => null)),
  ]);
  const circles = ["", ...KINDS].map((k, i) => ({ k, label: k || "All", img: pics[i] as string | null })).filter(c => c.img);
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
        <section className="shapes" aria-label="Jewelry type"><div className="wrap"><div className="ooo-circles"><div className="sp-row" style={{ justifyContent: "center" }}>
          {circles.map(c => (
            <Link key={c.label} href={c.k ? `/floating?type=${c.k}#results` : "/floating#results"} scroll={false} className={`sp${kind === c.k ? " on" : ""}`} aria-current={kind === c.k ? "page" : undefined}>
              <span className="sp-img"><img src={c.img!} alt="" loading="lazy" /></span><b>{c.label}</b>
            </Link>
          ))}
        </div></div></div></section>
        {r && r.products.length > 0 && <ProductBrowser key={kind} handle="floating" style={kind} sort0="new" initial={r.products} hasNext={r.hasNext} cursor={r.cursor} />}
      </div>
    </main>
  );
}
