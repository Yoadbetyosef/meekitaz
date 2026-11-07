import { getCollectionPage, getProductsByQuery, shopifyConfigured, type Product } from "@/lib/shopify";
import { ringQuery } from "@/lib/ringfilters";
import FunSection, { type DailyItem } from "./FunSection";

/* Meekitaz Daily's collection (2026-11-07): exactly the pieces each category page shows first (its own query and order), so the slider
   only ever lights up our best — engagement rings, earrings, necklaces, bracelets and bands — up to what $50 a day for four months
   reaches. Refreshed with the page; if Shopify is unreachable the section still renders with what it has. */
const CATS: [string, string][] = [["Earrings", "earrings"], ["Necklaces", "necklaces"], ["Bracelets", "bracelets"], ["Bands", "bands"]];
const PER = 14, MAX = 6000;

const clean = (t: string) => t.replace(/^(Yellow gold|White gold|Rose gold|Rose & White gold|Platinum|Silver)\s+/i, "").replace(/\s*\(\d+K\)\s*$/i, "");
const take = (cat: string, ps: Product[] = []): DailyItem[] => {
  const seen = new Set<string>(), out: DailyItem[] = [];
  for (const p of ps) {
    const price = parseFloat(p.price); const name = clean(p.title);
    if (!p.image?.url || !(price > 0) || price > MAX || seen.has(name)) continue; // one per design, within reach
    seen.add(name); out.push([name, Math.round(price), p.image.url, p.handle, cat]);
    if (out.length >= PER) break;
  }
  return out;
};

export default async function DailyFun() {
  let items: DailyItem[] = [];
  if (shopifyConfigured) {
    const [rings, ...rest] = await Promise.all([
      getProductsByQuery(ringQuery({ shapes: [], metals: [], styles: [] }), { first: 40 }).catch(() => null),
      ...CATS.map(([, h]) => getCollectionPage(h, { first: 60 }).catch(() => null)),
    ]);
    items = [...take("Engagement rings", rings?.products), ...CATS.flatMap(([c], i) => take(c, rest[i]?.products))];
  }
  items.sort((a, b) => a[1] - b[1]);
  return <FunSection items={items} />;
}
