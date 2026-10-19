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
  { label: "Gemstones", href: "/gemstones", re: /\bgem|sapphire|ruby|emerald|amethyst|tanzanite|citrine|aquamarine|morganite|peridot|garnet|moissanite/ },
];
export const POPULAR = ["Oval engagement rings", "Tennis bracelet", "Studs", "Pink diamonds", "Yellow gold ring", "Necklace under $3,000"];

/** Text that is safe to hand to Shopify's search: letters, digits, spaces, apostrophes and hyphens inside words; no operators, quotes, parentheses or wildcards. */
export function cleanQuery(raw: string): string {
  return raw.normalize("NFKC").replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/(^|\s)-+/g, "$1").replace(/-+(?=\s|$)/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
}

export function matchCategories(q: string) {
  const s = q.toLowerCase();
  return CATEGORIES.filter(c => c.re.test(s) || c.label.toLowerCase().startsWith(s)).slice(0, 4);
}

/** Reads a typed query: shape, carat, metal, fancy colour, price ceiling. Returns shortcuts into the existing filters, plus the words to search products with. */
export function parseIntent(raw: string): { go: Go[]; terms: string; max?: number } {
  const s = raw.toLowerCase().trim();
  const shape = RING_SHAPES.find(x => new RegExp(`\\b${x.toLowerCase()}\\b`).test(s));
  const cm = s.match(/(\d+(?:\.\d+)?)\s*(?:ct|carats?)\b/); const ct = cm && +cm[1] >= 0.3 && +cm[1] <= 20 ? +cm[1] : null; // the diamonds slider runs 0.5 to 20 ct
  const pm = s.match(/(?:under|below|less than|max|<)\s*\$?\s*([\d,]+)/); const maxRaw = pm ? +pm[1].replace(/,/g, "") : undefined; const max = maxRaw && Number.isFinite(maxRaw) && maxRaw > 0 ? Math.min(maxRaw, 1_000_000) : undefined;
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
  const terms = cleanQuery(s.replace(/(\d+(?:\.\d+)?)\s*(?:ct|carats?)\b/g, " ").replace(/(?:under|below|less than|max|<)\s*\$?\s*[\d,]+/g, " "));
  return { go, terms, max };
}

/** Words the catalogue is made of. A search that finds nothing is retried once with each unknown word moved to its nearest word here. */
const VOCAB = ["tennis", "necklace", "necklaces", "bracelet", "bracelets", "earring", "earrings", "stud", "studs", "hoop", "hoops", "huggie", "climber", "cluster", "drop", "pendant", "pendants", "solitaire", "engagement", "wedding", "eternity", "bezel", "halo", "hidden", "pave", "cushion", "oval", "pear", "princess", "radiant", "marquise", "asscher", "heart", "emerald", "round", "diamond", "diamonds", "yellow", "white", "rose", "gold", "platinum", "silver", "pink", "blue", "green", "ring", "rings", "bangle", "chain", "station", "lariat", "riviere", "sapphire", "ruby", "amethyst", "tanzanite", "citrine", "aquamarine", "morganite", "peridot", "garnet", "moissanite", "gemstone", "gemstones", "baguette", "stacking", "stackable", "twisted", "curved", "chevron", "channel", "martini", "pavé", "carat", "fancy", "setting", "band", "bands"];
function lev(a: string, b: string) {
  const m: number[][] = [];
  for (let i = 0; i <= a.length; i++) m[i] = [i];
  for (let j = 1; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}
export function correctWord(w: string): string {
  if (w.length < 4 || VOCAB.includes(w) || /\d/.test(w)) return w;
  const lim = w.length >= 7 ? 2 : 1;
  let best = w, bd = lim + 1;
  for (const v of VOCAB) { if (Math.abs(v.length - w.length) > lim) continue; const d = lev(w, v); if (d < bd) { best = v; bd = d; } }
  return best;
}
export const correctTerms = (terms: string) => terms.split(" ").map(correctWord).join(" ");
