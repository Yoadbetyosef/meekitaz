import Link from "next/link";
import { getProductsByQuery } from "@/lib/shopify";
import { ringQuery } from "@/lib/ringfilters";

/* Fancy Colors · the jewelry circles, like every category page: Rings, Earrings, Necklaces, Bracelets.
   Each circle shows a real coloured piece of that kind (in the chosen colour) and sets the grid's Jewelry filter (?type=). */
const KINDS = ["Rings", "Earrings", "Necklaces", "Bracelets"];
export default async function FancyTypeCircles({ color, type }: { color: string; type: string }) {
  const fancy = color || "all";
  const pics = await Promise.all(KINDS.map(async k => {
    // prefer a one-of-one photo (white background, clear stone), else the catalogue's own fancy piece
    const one = await getProductsByQuery(`tag:'One of One' AND tag:'Fancy' AND ${k === "Rings" ? "(tag:'Rings' OR tag:'Engagement Rings')" : k === "Necklaces" ? "(tag:'Necklaces' OR tag:'Pendants')" : `tag:'${k}'`}${color ? ` AND tag:'${color}'` : ""}`, { first: 1, sort: "new" }).catch(() => null);
    const url = one?.products[0]?.image?.url;
    if (url) return url;
    const cat = await getProductsByQuery(ringQuery({ shapes: [], metals: [], styles: [], fancy, type: k }), { first: 1 }).catch(() => null);
    return cat?.products[0]?.image?.url || null;
  }));
  const href = (k: string) => `/fancy-colors?${new URLSearchParams({ ...(color ? { color } : {}), ...(type === k ? {} : { type: k }) })}#settings`;
  return (
    <section className="shapes fct" aria-label="Jewelry type">
      <div className="wrap">
        <div className="ooo-circles"><div className="sp-row">{KINDS.map((k, i) => pics[i] && (
          <Link key={k} href={href(k)} scroll={false} className={`sp${type === k ? " on" : ""}`} aria-current={type === k ? "page" : undefined}>
            <span className="sp-img"><img src={pics[i]!} alt="" loading="lazy" /></span><b>{k}</b>
          </Link>
        ))}</div></div>
      </div>
    </section>
  );
}
