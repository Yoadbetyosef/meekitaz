// Engagement-ring filters. Shape and style come from the tags in Shopify; metal is read from the title (the tags are not reliable for it).
export const RING_SHAPES = ["Round", "Oval", "Cushion", "Emerald", "Pear", "Princess", "Radiant", "Marquise", "Asscher", "Heart"];
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

export type RingSel = { shapes: string[]; metals: string[]; styles: string[]; min?: number; max?: number; fancy?: string; type?: string };
/** Jewelry types on the Fancy Colors page: every product carries its category tag. */
export const FANCY_TYPES = [
  { label: "Rings", tag: "Engagement Ring" }, { label: "Earrings", tag: "Earrings" }, { label: "Necklaces", tag: "Necklace" }, { label: "Bracelets", tag: "Bracelets" }, { label: "Bands", tag: "Wedding Bands" },
];
const or = (xs: string[]) => (xs.length === 1 ? xs[0] : `(${xs.join(" OR ")})`);

/** The Shopify product search for a set of selected filters. */
export function ringQuery(sel: RingSel): string {
  // Fancy Colors: fancy pieces of one jewelry type, or of every type; helper products (configured copies, karat variants) never show.
  const ft = sel.fancy ? FANCY_TYPES.find(t => t.label === sel.type) : undefined;
  const parts = sel.fancy ? [ft ? `tag:'${ft.tag}'` : `(${FANCY_TYPES.map(t => `tag:'${t.tag}'`).join(" OR ")})`, "-tag:Configured", "-tag:'Karat variant'"] : ["tag:'Engagement Ring'"];
  // Fancy-colour pieces are titled "… Fancy Blue Cushion Cut Diamond …"; the fancy page lists only those, in one colour or all four.
  if (sel.fancy === "all") parts.push("title:Fancy");
  else if (sel.fancy && ["Yellow", "Pink", "Blue", "Green"].includes(sel.fancy)) parts.push(`title:'Fancy ${sel.fancy}'`);
  const shapes = sel.shapes.filter(s => RING_SHAPES.includes(s)).map(s => `tag:${s}`);
  const metals = RING_METALS.filter(m => sel.metals.includes(m.label)).map(m => `title:${m.phrase}`);
  const styles = RING_STYLES.filter(s => sel.styles.includes(s.label)).map(s => `tag:${s.tag}`);
  if (shapes.length) parts.push(or(shapes));
  if (metals.length) parts.push(or(metals));
  if (styles.length) parts.push(or(styles));
  if (sel.min && sel.min > RING_PRICE.min) parts.push(`variants.price:>=${Math.round(sel.min)}`);
  if (sel.max && sel.max < RING_PRICE.max) parts.push(`variants.price:<=${Math.round(sel.max)}`);
  if (!sel.fancy) return parts.join(" AND ");
  // Fancy Colors is one collection: the catalogue's fancy pieces AND the coloured one-of-ones, in the same grid, under the same filters
  // (stone colour, jewelry type, price; the ring-only filters — shape, metal, style — narrow the catalogue side only).
  const kind: Record<string, string> = { Rings: "(tag:'Rings' OR tag:'Engagement Rings')", Earrings: "tag:'Earrings'", Necklaces: "(tag:'Necklaces' OR tag:'Pendants')", Bracelets: "tag:'Bracelets'" };
  if (sel.type === "Bands") return parts.join(" AND ");
  const one = ["tag:'One of One'", "tag:'Fancy'"];
  if (sel.type && kind[sel.type]) one.push(kind[sel.type]);
  if (["Yellow", "Pink", "Blue", "Green"].includes(sel.fancy)) one.push(`tag:'${sel.fancy}'`);
  if (sel.min && sel.min > RING_PRICE.min) one.push(`variants.price:>=${Math.round(sel.min)}`);
  if (sel.max && sel.max < RING_PRICE.max) one.push(`variants.price:<=${Math.round(sel.max)}`);
  return `(${parts.join(" AND ")}) OR (${one.join(" AND ")})`;
}

/** Category pages without the ring filters (earrings, necklaces, bracelets, bands, gemstones). Every product carries its category
 *  tag (Earrings / Necklace / Bracelets / Wedding Bands), and most designs carry a style tag; the style match is "its tag OR the word
 *  in the title", so a tile never leaks into another category and never depends on one tag being present. */
const CAT_TAG: Record<string, string> = { earrings: "Earrings", necklaces: "Necklace", bracelets: "Bracelets", bands: "Wedding Bands" };
// style label → { tags that mean it, title words that mean it }
const STYLE: Record<string, { tags?: string[]; words?: string[] }> = {
  "Diamond Studs": { words: ["Stud", "Studs"] }, Hoop: { words: ["Hoop", "Hoops", "Huggie"] }, Climber: { tags: ["Climbers"], words: ["Climber"] },
  Cluster: { words: ["Cluster"] }, "Three Stone": { words: ["Three Stone", "Three-Stone"] }, Drop: { words: ["Drop", "Dangle"] },
  Pendants: { tags: ["pendant"], words: ["Pendant"] }, "Tennis Necklace": { tags: ["Tennis Necklace"], words: ["Tennis"] },
  "Lariat Necklace": { words: ["Lariat"] }, "Station Necklace": { words: ["Station"] },
  "Bar Set": { tags: ["Bar Set"], words: ["Bar Set"] }, "Bezel Set": { tags: ["Bezel set"], words: ["Bezel"] }, "Channel Set": { words: ["Channel"] },
  Chevron: { tags: ["Chevron Bands"], words: ["Chevron"] }, Curved: { tags: ["Curved Bands"], words: ["Curved"] },
  "Nature Inspired": { tags: ["Floral Inspired", "Nature Inspired"], words: ["Floral", "Leaf", "Vine", "Nature"] },
  "Pav\u00e9": { tags: ["Pave"], words: ["Pav\u00e9", "Pave"] }, Stackable: { tags: ["Stacking", "Stackable"], words: ["Stackable", "Stacking"] },
  Twisted: { words: ["Twisted", "Twist"] }, Eternity: { tags: ["Eternity Band"], words: ["Eternity"] },
};
const anyOf = (parts: string[]) => (parts.length === 1 ? parts[0] : `(${parts.join(" OR ")})`);
export function styleQuery(slug: string, style: string): string {
  const def = STYLE[style] || { words: [style.replace(/^Diamond /i, "")] };
  const or = [...(def.tags || []).map(t => `tag:'${t.replace(/'/g, "")}'`), ...(def.words || []).map(w => `title:'${w.replace(/'/g, "")}'`)];
  const parts = [anyOf(or)];
  const cat = CAT_TAG[slug]; if (cat) parts.push(`tag:'${cat}'`);
  parts.push("-tag:'Configured'", "-tag:'Karat variant'", "-tag:'Diamond'");
  return parts.join(" AND ");
}

/** Jewelry types on the Gemstones page. Every gemstone piece carries "Gemstone" plus its own type tag; necklaces and bracelets are listed
 *  so they appear by themselves as soon as the catalogue has them (today it has rings, earrings and bands). */
export const GEM_TYPES: { label: string; tags: string[] }[] = [
  { label: "Rings", tags: ["Gemstone Engagement Rings"] },
  { label: "Earrings", tags: ["Gemstone Earrings"] },
  { label: "Bands", tags: ["Gemstone Wedding Bands"] },
  { label: "Necklaces", tags: ["Gemstone Necklaces", "Gemstone Necklace", "Gemstone Pendants"] },
  { label: "Bracelets", tags: ["Gemstone Bracelets", "Gemstone Bracelet"] },
];
/** Gemstone pieces of one jewelry type, optionally in one stone / colour (the same stone match the colour tiles use). */
export function gemQuery(style: string, type: string): string {
  const t = GEM_TYPES.find(x => x.label === type);
  const parts = ["tag:Gemstone"];
  if (t) parts.push(anyOf(t.tags.map(x => `tag:'${x}'`)));
  if (style) {
    const def = STYLE[style] || { words: [style.replace(/^Diamond /i, "")] };
    parts.push(anyOf([...(def.tags || []).map(x => `tag:'${x.replace(/'/g, "")}'`), ...(def.words || []).map(w => `title:'${w.replace(/'/g, "")}'`)]));
  }
  parts.push("-tag:'Configured'", "-tag:'Karat variant'", "-tag:'Diamond'");
  return parts.join(" AND ");
}


/* One of One / Ready to Ship circles: every circle is a tag (shape, style, colour, size, metal) or a price band */
export function oneOfOneQuery(handle: string, style: string): string {
  const base = handle === "one-of-one" ? "tag:'One of One'" : "tag:'Ready to Ship'";
  if (style.startsWith("fancy|")) { // Fancy Colors page: coloured one-of-ones, by kind and colour
    const [, kind, colour] = style.split("|");
    const k = kind === "Rings" ? " AND (tag:'Rings' OR tag:'Engagement Rings')" : kind === "Necklaces" ? " AND (tag:'Necklaces' OR tag:'Pendants')" : kind ? ` AND tag:'${kind.replace(/'/g, "")}'` : "";
    return `${base} AND tag:'Fancy'${k}${colour ? ` AND tag:'${colour.replace(/'/g, "")}'` : ""}`;
  }
  if (style === "Under $4,000") return `${base} AND variants.price:<4000`;
  if (style === "$4–8K") return `${base} AND variants.price:>=4000 AND variants.price:<8000`;
  if (style === "$8K+") return `${base} AND variants.price:>=8000`;
  if (style === "Rings") return `${base} AND (tag:'Rings' OR tag:'Engagement Rings')`;
  if (style === "Necklaces") return `${base} AND (tag:'Necklaces' OR tag:'Pendants')`;
  if (style === "Fancy colour") return `${base} AND tag:'Fancy'`;
  if (style === "4 ct and up") return `${base} AND tag:'Big stone'`;
  return `${base} AND tag:'${style.replace(/'/g, "")}'`;
}

/** The Floating collection: every piece made with the house floating setting (named "Floating …"). */
export const FLOATING_QUERY = "title:Floating OR tag:Floating"; // plus one-of-ones picked into the collection (tag "Floating")
