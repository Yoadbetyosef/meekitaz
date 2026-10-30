import Link from "next/link";
import { getProductsByQuery } from "@/lib/shopify";
import { oneOfOneQuery } from "@/lib/ringfilters";

/* /one-of-one · the circles, like every category page: the piece itself inside each circle (the newest one of its kind). */
// a fixed picture when the kind has nothing in the store yet (bracelets while they import), and for All a different piece than Rings
const FALLBACK: Record<string, string> = {
  "": "https://cdn.shopify.com/s/files/1/0841/2905/4957/files/SJR63605EM_P-YRW-1.jpg?v=1793249580&width=600",
  Bracelets: "https://pub-48d66e3b9b17453bbbb6a8280c1497ec.r2.dev/Zoom/SJBR20793/SJBR20793-Y-1.jpg",
};
const ROW: { label: string; style: string; pic: string }[] = [
  { label: "All", style: "", pic: "" },
  { label: "Rings", style: "Rings", pic: "Rings" },
  { label: "Earrings", style: "Earrings", pic: "Earrings" },
  { label: "Necklaces", style: "Necklaces", pic: "Pendants" }, // a pendant reads better in a circle than a fine chain
  { label: "Bracelets", style: "Bracelets", pic: "Bracelets" },
];
async function pic(style: string) {
  if (!style) return FALLBACK[""];
  const q = oneOfOneQuery("one-of-one", style);
  const r = await getProductsByQuery(q, { first: 1, sort: "new" }).catch(() => null);
  return r?.products[0]?.image?.url || FALLBACK[style] || null;
}
export default async function OneCircles({ current }: { current: string }) {
  const pics = await Promise.all(ROW.map(x => pic(x.pic)));
  return (
    <div className="ooo-circles">
      <div className="sp-row n5">{ROW.map((x, k) => pics[k] && (
        <Link key={x.label} href={`/one-of-one?style=${x.style || "all"}#results`} className={`sp${current === x.style ? " on" : ""}`} aria-current={current === x.style ? "page" : undefined} scroll={false}>
          <span className="sp-img"><img src={pics[k]!} alt="" loading="lazy" /></span><b>{x.label}</b>
        </Link>
      ))}</div>
    </div>
  );
}
