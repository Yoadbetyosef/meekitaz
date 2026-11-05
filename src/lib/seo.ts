import primaries from "./seoPrimary.json";

/** The one public address of the site: every canonical, the sitemap and the schema.org data use it. */
export const SITE = "https://www.meekitaz.com";
export const abs = (path = "/") => `${SITE}${path.startsWith("/") ? path : `/${path}`}`;

/** True for the real domain (with or without www); false for *.vercel.app copies and previews. */
export const isPublicHost = (host: string) => { const h = host.toLowerCase().split(":")[0]; return h === "meekitaz.com" || h === "www.meekitaz.com"; };

// ---- one indexable page per design: the metal versions of a piece point at one page ---------------------------------------------------------
// seoPrimary.json is built from the Shopify export by scripts/gen-seo-primaries.py (yellow gold first, then white, rose, platinum, silver).
export const primaryHandles = primaries as string[];
const PRIMARY = new Set<string>(primaryHandles);
const METAL_RX = /(?<![a-z])(white-gold|yellow-gold|rose-gold|platinum|silver)(?![a-z])/;
const METAL_ORDER = ["yellow-gold", "white-gold", "rose-gold", "platinum", "silver"];
/** The handle Google should index for this product. A product the list does not know (new since the export) is its own page. */
export function canonicalHandle(handle: string): string {
  if (PRIMARY.has(handle)) return handle;
  if (METAL_RX.test(handle)) for (const m of METAL_ORDER) { const c = handle.replace(METAL_RX, m); if (PRIMARY.has(c)) return c; }
  return handle;
}

/** A meta description of at most ~158 characters, cut at a sentence end when one fits, else at a word. */
export function metaDesc(s: string): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= 158) return t;
  const cut = t.slice(0, 158), dot = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("."));
  if (dot > 90) return cut.slice(0, dot + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
}

/** Search titles and descriptions for the category pages (the on-page headlines are poetic; these are what people type into Google). */
export const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  "engagement-rings": { title: "Lab-Grown Diamond Engagement Rings", description: "Lab-grown diamond engagement rings in every shape and metal, made for you in New York. IGI and GIA certified stones, free insured shipping and 30-day free returns." },
  diamonds: { title: "Certified Lab-Grown Diamonds", description: "Browse certified lab-grown diamonds by shape, carat, color and clarity. IGI and GIA reports, free insured shipping and 30-day free returns." },
  earrings: { title: "Lab-Grown Diamond Earrings & Studs", description: "Diamond studs, huggies and drops set with lab-grown diamonds, in white, yellow or rose gold, platinum or silver. Made for you in New York." },
  necklaces: { title: "Lab-Grown Diamond Necklaces & Pendants", description: "Diamond pendants and necklaces set with lab-grown diamonds, in white, yellow or rose gold, platinum or silver. Made for you in New York." },
  bracelets: { title: "Lab-Grown Diamond Tennis Bracelets", description: "Tennis bracelets and diamond bracelets set with lab-grown diamonds, in white, yellow or rose gold, platinum or silver. Made for you in New York." },
  bands: { title: "Diamond Wedding Bands & Eternity Rings", description: "Wedding bands and eternity rings set with lab-grown diamonds, in white, yellow or rose gold, platinum or silver. Made for you in New York." },
};
