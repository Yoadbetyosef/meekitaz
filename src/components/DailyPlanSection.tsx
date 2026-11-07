import { getCollectionPage, getProductsByQuery, shopifyConfigured, type Product } from "@/lib/shopify";
import { ringQuery } from "@/lib/ringfilters";
import DailyPlan, { type DailyItem } from "./DailyPlan";

/* Meekitaz Daily's collection (2026-11-07): exactly the pieces each category page shows first (its own query and order), so the slider
   only ever lights up our best — engagement rings, earrings, necklaces, bracelets and bands — up to what $50 a day for four months
   reaches. Refreshed with the page; if Shopify is unreachable the section still renders with what it has. */
const CATS: [string, string][] = [["Earrings", "earrings"], ["Necklaces", "necklaces"], ["Bracelets", "bracelets"], ["Bands", "bands"]];
const PER = 12, MAX = 6000;

const clean = (t: string) => t.replace(/^(Yellow gold|White gold|Rose gold|Rose & White gold|Platinum|Silver)\s+/i, "").replace(/\s*\(\d+K\)\s*$/i, "");
// the same design in eight shapes is one design: at most two shapes of each, so the slider shows variety
const family = (n: string) => n.replace(/\b(East-West|Round|Oval|Pear|Marquise|Emerald|Cushion|Princess|Radiant|Heart|Asscher|Baguette|Trillion|Elongated|Cut|Shape|and)\b/gi, "").replace(/\s+/g, " ").trim().toLowerCase();
const take = (cat: string, ps: Product[] = []): DailyItem[] => {
  const seen = new Set<string>(), fam = new Map<string, number>(), out: DailyItem[] = [];
  for (const p of ps) {
    const price = parseFloat(p.price); const name = clean(p.title);
    const f = family(name);
    if (!p.image?.url || !(price > 0) || price > MAX || seen.has(name) || (fam.get(f) || 0) >= 2) continue; // within reach, varied
    seen.add(name); fam.set(f, (fam.get(f) || 0) + 1); out.push([name, Math.round(price), p.image.url, p.handle, cat]);
    if (out.length >= PER) break;
  }
  return out;
};

export default async function DailyPlanSection() {
  let items: DailyItem[] = [];
  if (shopifyConfigured) {
    const [rings, ...rest] = await Promise.all([
      getProductsByQuery(ringQuery({ shapes: [], metals: [], styles: [] }), { first: 80 }).catch(() => null),
      ...CATS.map(([, h]) => getCollectionPage(h, { first: 100 }).catch(() => null)),
    ]);
    items = [...take("Engagement rings", rings?.products), ...CATS.flatMap(([c], i) => take(c, rest[i]?.products))];
  }
  items.sort((a, b) => a[1] - b[1]);
  return <DailyPlan items={items} />;
}
