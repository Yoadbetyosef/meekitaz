import Link from "next/link";
import { getProductsByQuery } from "@/lib/shopify";
import { oneOfOneQuery } from "@/lib/ringfilters";

/* /one-of-one · the circles. Two rows, like every category page: the character of the ring first, then shape, metal and price.
   Each circle shows a real ring from its group (the newest one). A circle is a filter; the current one is marked. */
const ROW1 = ["Fancy colour", "4 ct and up", "Toi et Moi", "Three-stone", "Halo", "Cluster", "Solitaire", "Band"];
const ROW2 = ["Pear", "Oval", "Marquise", "Emerald", "Cushion", "Round", "Yellow gold", "White gold", "Rose & White gold", "Under $4,000", "$4–8K", "$8K+"];

async function pic(label: string) {
  const r = await getProductsByQuery(oneOfOneQuery("one-of-one", label), { first: 1, sort: "new" }).catch(() => null);
  return r?.products[0]?.image?.url || null;
}
export default async function OneCircles({ current }: { current: string }) {
  const all = [...ROW1, ...ROW2];
  const pics = await Promise.all(all.map(pic));
  const items = all.map((label, k) => ({ label, img: pics[k] })).filter(x => x.img);
  const row = (labels: string[]) => items.filter(x => labels.includes(x.label));
  const circle = (x: { label: string; img: string | null }) => (
    <Link key={x.label} href={current === x.label ? "/one-of-one" : `/one-of-one?style=${encodeURIComponent(x.label)}`} className={`sp${current === x.label ? " on" : ""}`} aria-pressed={current === x.label} scroll={false}>
      <span className="sp-img"><img src={x.img!} alt="" loading="lazy" /></span><b>{x.label}</b>
    </Link>
  );
  return (
    <div className="ooo-circles">
      <div className="sp-row scroll">{row(ROW1).map(circle)}</div>
      <div className="sp-row scroll">{row(ROW2).map(circle)}</div>
    </div>
  );
}
