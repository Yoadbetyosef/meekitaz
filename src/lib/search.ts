import { RING_SHAPES } from "./ringfilters";

/** Search helpers shared by the palette (instant shortcuts) and the API (query for Shopify). No server-only imports. */
export type Go = { label: string; href: string; hint: string };
const FANCY = ["Yellow", "Pink", "Blue", "Green"];
const METALS = ["yellow gold", "white gold", "rose gold", "platinum", "silver"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const num = (n: number) => String(Number(n.toFixed(2)));

export const CATEGORIES: { label: string; href: string; re: RegExp }[] = [
  { label: "Engagement rings", href: "/engagement-rings", re: /engagement|\bring/ },
  { label: "Diamonds", href: "/diamonds", re: /diamond|stone/ },
  { label: "Fancy colors", href: "/fancy-colors", re: /fancy|colou?r/ },
  { label: "Earrings", href: "/earrings", re: /earring|stud|hoop|climber|huggie/ },
  { label: "Necklaces", href: "/necklaces", re: /necklace|pendant|chain|riviere|lariat/ },
  { label: "Bracelets", href: "/bracelets", re: /bracelet|bangle|tennis/ },
  { label: "Wedding bands", href: "/bands", re: /band|wedding|eternity/ },
  { label: "Gemstones", href: "/gemstones", re: /gem|sapphire|ruby|emerald|amethyst|tanzanite|citrine|aquamarine|morganite|peridot|garnet|moissanite/ },
];
export const POPULAR = ["Oval engagement rings", "Tennis bracelet", "Studs", "Pink diamonds", "Yellow gold ring", "Necklace under $3,000"];

export function matchCategories(q: string) {
  const s = q.toLowerCase();
  return CATEGORIES.filter(c => c.re.test(s) || c.label.toLowerCase().startsWith(s)).slice(0, 4);
}

/** Reads a typed query: shape, carat, metal, fancy colour, price ceiling. Returns shortcuts into the existing filters, plus the words to search products with. */
export function parseIntent(raw: string): { go: Go[]; terms: string; max?: number } {
  const s = raw.toLowerCase().trim();
  const shape = RING_SHAPES.find(x => new RegExp(`\\b${x.toLowerCase()}\\b`).test(s));
  const cm = s.match(/(\d+(?:\.\d+)?)\s*(?:ct|carats?)\b/); const ct = cm ? +cm[1] : null;
  const pm = s.match(/(?:under|below|less than|max|<)\s*\$?\s*([\d,]+)/); const max = pm ? +pm[1].replace(/,/g, "") : undefined;
  const metal = METALS.find(m => s.includes(m));
  const fancy = FANCY.find(c => new RegExp(`\\b${c.toLowerCase()}\\b`).test(s) && !(c === "Yellow" && /yellow gold/.test(s)));
  const isRing = /engagement|\bring|solitaire/.test(s), other = /stud|earring|necklace|pendant|bracelet|bangle|band|hoop|tennis|climber/.test(s);
  const go: Go[] = [];
  if (fancy) {
    go.push({ label: `Fancy ${fancy.toLowerCase()} diamonds${shape ? ` · ${shape}` : ""}`, href: `/diamonds?color=${fancy}${shape ? `&sh=${shape}` : ""}`, hint: "Loose stones" });
    go.push({ label: `Fancy ${fancy.toLowerCase()} rings${shape ? ` · ${shape}` : ""}`, href: `/fancy-colors?color=${fancy}${shape ? `&style=${shape}` : ""}`, hint: "Settings with a fancy stone" });
  } else if ((shape || ct) && !other) {
    go.push({ label: `${shape || "All shapes"} diamonds${ct ? ` · ${ct} ct` : ""}`, href: `/diamonds?${[shape && `style=${shape}`, ct && `c=${num(ct)}-${num(ct + 0.5)}`].filter(Boolean).join("&")}`.replace(/\?$/, ""), hint: "Choose the stone first" });
    go.push({ label: `${shape ? shape + " engagement rings" : "Engagement rings"}${metal ? ` · ${cap(metal)}` : ""}`, href: `/engagement-rings?${[shape && `style=${shape}`, metal && `metal=${encodeURIComponent(cap(metal))}`].filter(Boolean).join("&")}`.replace(/\?$/, ""), hint: "Choose the setting first" });
  } else if (isRing && !other) {
    go.push({ label: `Engagement rings${metal ? ` · ${cap(metal)}` : ""}`, href: `/engagement-rings${metal ? `?metal=${encodeURIComponent(cap(metal))}` : ""}`, hint: "All settings" });
  }
  // what is left once the carat and price words are taken out is what the product search looks for
  const terms = s.replace(/(\d+(?:\.\d+)?)\s*(?:ct|carats?)\b/g, " ").replace(/(?:under|below|less than|max|<)\s*\$?\s*[\d,]+/g, " ").replace(/[^a-z0-9é\s-]/g, " ").replace(/\s+/g, " ").trim();
  return { go, terms, max };
}
