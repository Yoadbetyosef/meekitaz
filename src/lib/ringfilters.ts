// Engagement-ring filters. Shape and style come from the tags in Shopify; metal is read from the title (the tags are not reliable for it).
export const RING_SHAPES = ["Round", "Oval", "Cushion", "Emerald", "Pear", "Princess", "Radiant", "Marquise", "Heart"];
export const RING_METALS: { label: string; phrase: string; color: string }[] = [
  { label: "Rose gold", phrase: "'Rose gold'", color: "#E3AE98" },
  { label: "Yellow gold", phrase: "'Yellow gold'", color: "#E6C56B" },
  { label: "White gold", phrase: "'White gold'", color: "#E8E8EA" },
  { label: "Platinum", phrase: "Platinum", color: "#DADCE2" },
  { label: "Silver", phrase: "Silver", color: "#D3D5DB" },
];
export const RING_STYLES: { label: string; tag: string }[] = [
  { label: "Solitaire", tag: "Solitaires" }, { label: "Halo", tag: "Halo" }, { label: "Pavé", tag: "Pave" }, { label: "Side stones", tag: "'Side Stone'" },
  { label: "Three-stone", tag: "'3 stone'" }, { label: "Cluster", tag: "'Cluster Sides'" }, { label: "Multi-row", tag: "MultiRow" }, { label: "Minimalist", tag: "Minimalist" }, { label: "Floral", tag: "Floral" },
];
export const RING_PRICE = { min: 100, max: 5000, step: 50 }; // the top of the slider is open-ended ("$5,000+")

export type RingSel = { shapes: string[]; metals: string[]; styles: string[]; min?: number; max?: number };
const or = (xs: string[]) => (xs.length === 1 ? xs[0] : `(${xs.join(" OR ")})`);

/** The Shopify product search for a set of selected filters. */
export function ringQuery(sel: RingSel): string {
  const parts = ["tag:'Engagement Ring'"];
  const shapes = sel.shapes.filter(s => RING_SHAPES.includes(s)).map(s => `tag:${s}`);
  const metals = RING_METALS.filter(m => sel.metals.includes(m.label)).map(m => `title:${m.phrase}`);
  const styles = RING_STYLES.filter(s => sel.styles.includes(s.label)).map(s => `tag:${s.tag}`);
  if (shapes.length) parts.push(or(shapes));
  if (metals.length) parts.push(or(metals));
  if (styles.length) parts.push(or(styles));
  if (sel.min && sel.min > RING_PRICE.min) parts.push(`variants.price:>=${Math.round(sel.min)}`);
  if (sel.max && sel.max < RING_PRICE.max) parts.push(`variants.price:<=${Math.round(sel.max)}`);
  return parts.join(" AND ");
}
