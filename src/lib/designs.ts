import type { Product } from "./shopify";

/** Catalogue grids show one card per design: the metal versions of a design (same NS code) collapse into one card,
 *  so neighbouring cards are different pieces, not the same ring in five colours. */
export const METAL_SWATCH: Record<string, string> = { "Rose gold": "#E3AE98", "Yellow gold": "#E6C56B", "White gold": "#E8E8EA", Platinum: "#DADCE2", Silver: "#D3D5DB" };
const METAL_ORDER = ["White gold", "Yellow gold", "Rose gold", "Platinum", "Silver"];
export function collapseDesigns(list: Product[]): Product[] {
  const out: Product[] = [], byCode = new Map<string, Product>();
  for (const p of list) {
    const key = p.code || p.id;
    const have = byCode.get(key);
    const v = { metal: p.metal || "", handle: p.handle };
    if (!have) { const card = { ...p, variants: [v, ...(p.variants || []).filter(x => x.handle !== p.handle)] }; byCode.set(key, card); out.push(card); continue; }
    for (const x of [v, ...(p.variants || [])]) if (!have.variants!.some(y => y.handle === x.handle)) have.variants!.push(x);
  }
  for (const c of out) c.variants!.sort((a, b) => METAL_ORDER.indexOf(a.metal) - METAL_ORDER.indexOf(b.metal));
  return out;
}
