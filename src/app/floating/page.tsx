import Link from "next/link";
import ProductBrowser from "@/components/ProductBrowser";
import FloatingHeroVideo from "@/components/FloatingHeroVideo";
import { getProductsByQuery } from "@/lib/shopify";
import { floatingQuery } from "@/lib/ringfilters";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Floating Collection — MEEKITAZ",
  description: "No prongs, no bezel: each lab-grown diamond threaded onto the gold through a tiny drilled channel, so light comes in from every side.",
};

const KINDS = ["Earrings", "Necklaces", "Bracelets"];

/* /floating · design D: the film stays put on the left while the pieces scroll on the right;
   after two rows, the drilled marquise and how the setting works. */
export default async function FloatingPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type = "" } = await searchParams;
  const kind = KINDS.includes(type) ? type : ""; // opens on All
  const r = await getProductsByQuery(floatingQuery(kind), { first: 24, sort: "new" }).catch(() => null);
  const how = (
    <div className="flpD-how">
      <img src="/media/floating-diamond.webp" alt="A marquise diamond threaded onto a gold chain through a drilled channel" loading="lazy" />
      <p className="fl-eye"><i />How it floats</p>
      <h3>Light, all the way through.</h3>
      <div className="flpD-steps">
        <div><b>01</b><h4>Drilled</h4><p>A channel finer than a hair is laser-drilled through the tip of the stone.</p></div>
        <div><b>02</b><h4>Threaded</h4><p>A single gold ring passes through it and onto the chain. Nothing grips the diamond.</p></div>
        <div><b>03</b><h4>Free</h4><p>Light comes in from every side and leaves as fire. It moves when you move.</p></div>
      </div>
    </div>
  );
  return (
    <main className="flp flpD">
      <div className="flpD-split">
        <div className="flpD-left">
          <FloatingHeroVideo />
          <div className="flpD-ov"><h1>Floating.</h1><p>Light, all the way through.</p></div>
        </div>
        <div className="flpD-right catbody" id="results">
          <p className="fl-eye"><i />Floating collection</p>
          <nav className="flpD-tabs" aria-label="Jewelry type">
            {["", ...KINDS].map(k => (
              <Link key={k || "all"} href={k ? `/floating?type=${k}` : "/floating"} scroll={false} className={kind === k ? "on" : ""} aria-current={kind === k ? "page" : undefined}>{k || "All"}</Link>
            ))}
          </nav>
          {r && r.products.length > 0 && <ProductBrowser key={kind} handle="floating" style={kind} sort0="new" initial={r.products} hasNext={r.hasNext} cursor={r.cursor} slot={how} slotAt={4} />}
        </div>
      </div>
    </main>
  );
}
