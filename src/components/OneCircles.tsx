import Link from "next/link";
import { getProductsByQuery } from "@/lib/shopify";
import { oneOfOneQuery } from "@/lib/ringfilters";

/* /one-of-one · the circles, like every category page: the piece itself inside each circle (the newest one of its kind). */
const ROW: { label: string; style: string; pic: string }[] = [
  { label: "All", style: "", pic: "" },
  { label: "Rings", style: "Rings", pic: "Rings" },
  { label: "Earrings", style: "Earrings", pic: "Earrings" },
  { label: "Necklaces", style: "Necklaces", pic: "Pendants" }, // a pendant reads better in a circle than a fine chain
  { label: "Bracelets", style: "Bracelets", pic: "Bracelets" },
];
async function pic(style: string) {
  const q = style ? oneOfOneQuery("one-of-one", style) : "tag:'One of One' AND tag:'Fancy'";
  const r = await getProductsByQuery(q, { first: 1, sort: "new" }).catch(() => null);
  return r?.products[0]?.image?.url || null;
}
export default async function OneCircles({ current }: { current: string }) {
  const pics = await Promise.all(ROW.map(x => pic(x.pic)));
  return (
    <div className="ooo-circles">
      <div className="sp-row n5">{ROW.map((x, k) => pics[k] && (
        <Link key={x.label} href={x.style ? `/one-of-one?style=${x.style}#results` : "/one-of-one#results"} className={`sp${current === x.style ? " on" : ""}`} aria-current={current === x.style ? "page" : undefined} scroll={false}>
          <span className="sp-img"><img src={pics[k]!} alt="" loading="lazy" /></span><b>{x.label}</b>
        </Link>
      ))}</div>
    </div>
  );
}
