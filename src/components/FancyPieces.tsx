import Link from "next/link";
import { Suspense } from "react";
import ProductBrowser from "@/components/ProductBrowser";
import { getProductsByQuery } from "@/lib/shopify";
import { oneOfOneQuery } from "@/lib/ringfilters";

/* Fancy Colors page · every one-of-one with coloured stones (rings, earrings, necklaces, bracelets), following the colour picked above.
   The kinds are circles, like everywhere else; each shows a real piece of that kind in that colour. */
const KINDS = ["", "Rings", "Earrings", "Necklaces", "Bracelets"];
export default async function FancyPieces({ color, kind }: { color: string; kind: string }) {
  const q = (k: string) => oneOfOneQuery("one-of-one", `fancy|${k}|${color}`);
  const [first, ...pics] = await Promise.all([
    getProductsByQuery(q(kind), { first: 24, sort: "new" }).catch(() => null),
    ...KINDS.map(k => getProductsByQuery(q(k), { first: 1, sort: "new" }).then(r => r?.products[0]?.image?.url || null).catch(() => null)),
  ]);
  const href = (k: string) => `/fancy-colors?${new URLSearchParams({ ...(color ? { color } : {}), ...(k ? { kind: k } : {}) })}#pieces`;
  const shown = KINDS.map((k, i) => ({ k, img: pics[i] as string | null })).filter(x => x.img);
  if (!first || !first.products.length) return null;
  return (
    <section className="fcp" id="pieces" aria-label="Fancy colour jewellery">
      <div className="wrap">
        <div className="sp-head"><small className="eyebrow">One of One{color ? ` · ${color}` : ""}</small><h2>Jewelry in colour</h2></div>
        <div className="ooo-circles"><div className="sp-row">{shown.map(x => (
          <Link key={x.k || "all"} href={href(x.k)} scroll={false} className={`sp${kind === x.k ? " on" : ""}`} aria-current={kind === x.k ? "page" : undefined}>
            <span className="sp-img"><img src={x.img!} alt="" loading="lazy" /></span><b>{x.k || "All"}</b>
          </Link>
        ))}</div></div>
      </div>
      <Suspense fallback={null}><ProductBrowser key={`${kind}|${color}`} handle="one-of-one" style={`fancy|${kind}|${color}`} sort0="new" initial={first.products} hasNext={first.hasNext} cursor={first.cursor} /></Suspense>
    </section>
  );
}
