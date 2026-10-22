import type { Product } from "./shopify";
import { RING_SHAPES } from "./ringfilters";

/** Catalogue grids show one card per design: the metal versions of a design (same NS code) collapse into one card,
 *  so neighbouring cards are different pieces, not the same ring in five colours. */
export const METAL_SWATCH: Record<string, string> = { "Rose gold": "#E3AE98", "Yellow gold": "#E6C56B", "White gold": "#E8E8EA", Platinum: "#DADCE2", Silver: "#D3D5DB" };
const METAL_ORDER = ["White gold", "Yellow gold", "Rose gold", "Platinum", "Silver"];
const GOLD_SHOWN = ["White gold", "Yellow gold", "Rose gold"]; // the three dots on a card; the product page offers every metal
/** Gemstone pieces carry no shape tag and one design is sold in every shape and every stone, so shape and stone are read from the title
 *  ("Round Cut Amethyst Stud Earrings in Rose gold ..."). Each stone in each shape is then its own card, instead of one card per design. */
const GEM_STONES = ["Yellow Sapphire", "Green Sapphire", "Blue Sapphire", "Pink Sapphire", "Aquamarine", "Moissanite", "Blue Topaz", "Tanzanite", "Morganite", "Amethyst", "Peridot", "Citrine", "Emerald", "Garnet", "Ruby"];
export function gemFacets(title: string, tags: string[]): { shape: string; stone: string } {
  if (!tags.includes("Gemstone")) return { shape: "", stone: "" };
  const shape = RING_SHAPES.find(sh => title.startsWith(sh + " ")) || "";
  const rest = (shape ? title.slice(shape.length + 1) : title).replace(/^Cut /, "");
  return { shape, stone: GEM_STONES.find(g => rest.startsWith(g + " ")) || "" };
}
export function collapseDesigns(list: Product[]): Product[] {
  const out: Product[] = [], byCode = new Map<string, Product>();
  for (const p of list) {
    // rings: the same design is sold in every shape, and a shape is its own card
    const key = p.code ? `${p.code}|${p.shape || ""}|${p.stone || ""}` : p.id;
    const v = { metal: p.metal || "", handle: p.handle, title: p.title, image: p.image, modelImage: p.modelImage, price: p.price, compareAt: p.compareAt };
    const have = byCode.get(key);
    if (!have) { const card = { ...p, variants: [v, ...(p.variants || []).filter(x => x.metal !== v.metal)] }; byCode.set(key, card); out.push(card); continue; }
    for (const x of [v, ...(p.variants || [])]) if (x.metal && !have.variants!.some(y => y.metal === x.metal)) have.variants!.push(x);
  }
  for (const c of out) {
    c.variants!.sort((a, b) => METAL_ORDER.indexOf(a.metal) - METAL_ORDER.indexOf(b.metal));
    // the card opens on yellow gold when the design is made in it
    const y = c.variants!.find(v => v.metal === "Yellow gold");
    if (y) { c.handle = y.handle; c.title = y.title; c.image = y.image; c.modelImage = y.modelImage; c.price = y.price; c.compareAt = y.compareAt; c.metal = y.metal; }
  }
  return out;
}
export const shownMetals = (p: Product) => (p.variants || []).filter(v => GOLD_SHOWN.includes(v.metal));

/** "Show more" must add a full page of NEW designs. A fetch returns ~96 products, but most of them are other metals of designs already on screen
 *  and fold into their cards, so one fetch could add only 2-3 new cards. Keep fetching until enough new designs have arrived (or the list ends). */
export type ApiPage = { products?: Product[]; hasNext?: boolean; cursor?: string | null } | null;
export async function fillPage(base: Product[], start: { cursor: string | null; hasNext: boolean }, fetchPage: (after: string | null) => Promise<ApiPage>, want = 24, maxFetches = 8) {
  let items = base, cursor = start.cursor, hasNext = start.hasNext, n = 0, failed = false;
  while (hasNext && items.length - base.length < want && n < maxFetches) {
    n++;
    let j: ApiPage = null;
    try { j = await fetchPage(cursor); } catch { j = null; }
    if (!j || !j.products) { failed = true; break; }
    items = collapseDesigns(items.concat(j.products)); cursor = j.cursor ?? null; hasNext = !!j.hasNext;
  }
  return { items, cursor, hasNext, failed };
}

/** Product photos that show another brand's engraving. The 3D renders of gemstone earrings show the back of the post from two angles
 *  (files "...-Stud-Earrings-in-..._1" and "_2"), and the screw-back discs there are engraved with the supplier's name. The front view (no suffix) is clean. */
export function showsSupplierMark(url: string, tags: string[]): boolean {
  return tags.includes("Gemstone Earrings") && /\/[^/?]*Earrings[^/?]*_[12]\.(?:webp|jpe?g|png)(?:\?|$)/i.test(url);
}

