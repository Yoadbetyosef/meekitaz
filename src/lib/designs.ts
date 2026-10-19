import type { Product } from "./shopify";

/** Catalogue grids show one card per design: the metal versions of a design (same NS code) collapse into one card,
 *  so neighbouring cards are different pieces, not the same ring in five colours. */
export const METAL_SWATCH: Record<string, string> = { "Rose gold": "#E3AE98", "Yellow gold": "#E6C56B", "White gold": "#E8E8EA", Platinum: "#DADCE2", Silver: "#D3D5DB" };
const METAL_ORDER = ["White gold", "Yellow gold", "Rose gold", "Platinum", "Silver"];
const GOLD_SHOWN = ["White gold", "Yellow gold", "Rose gold"]; // the three dots on a card; the product page offers every metal
export function collapseDesigns(list: Product[]): Product[] {
  const out: Product[] = [], byCode = new Map<string, Product>();
  for (const p of list) {
    // rings: the same design is sold in every shape, and a shape is its own card
    const key = p.code ? `${p.code}|${p.shape || ""}` : p.id;
    const v = { metal: p.metal || "", handle: p.handle, title: p.title, image: p.image, price: p.price, compareAt: p.compareAt };
    const have = byCode.get(key);
    if (!have) { const card = { ...p, variants: [v, ...(p.variants || []).filter(x => x.metal !== v.metal)] }; byCode.set(key, card); out.push(card); continue; }
    for (const x of [v, ...(p.variants || [])]) if (x.metal && !have.variants!.some(y => y.metal === x.metal)) have.variants!.push(x);
  }
  for (const c of out) {
    c.variants!.sort((a, b) => METAL_ORDER.indexOf(a.metal) - METAL_ORDER.indexOf(b.metal));
    // the card opens on yellow gold when the design is made in it
    const y = c.variants!.find(v => v.metal === "Yellow gold");
    if (y) { c.handle = y.handle; c.title = y.title; c.image = y.image; c.price = y.price; c.compareAt = y.compareAt; c.metal = y.metal; }
  }
  return out;
}
export const shownMetals = (p: Product) => (p.variants || []).filter(v => GOLD_SHOWN.includes(v.metal));
