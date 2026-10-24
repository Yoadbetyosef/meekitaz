// Photos of products whose supplier renders can carry an engraving go through /api/img, which paints it out.
// ENGRAVED matches the product families where the scan found it; everything else is served straight from Shopify.
const ENGRAVED = /\b(?:eternity|bands?|rings?)\b/i; // whole words: rings and bands, not earrings
// The engraving shows in the main photo (flat), in the angled photos (tilted) and, small, in the front-on photo of ring and band products. `slot` is the photo's place among the Shopify product photos (0 = the first).
export function photoSrc(url: string, width: number, title: string, slot = 0) {
  if (!/cdn\.shopify\.com/.test(url)) return url; // only Shopify product photos carry the engraving; on-model photos are left alone
  return slot <= 4 && ENGRAVED.test(title) ? `/api/img?u=${encodeURIComponent(url)}&w=${width}&s=${slot}&v=2` : url; // v=2: the cleaner got better, so older cleaned copies are not reused
}
export const isCleaned = (src: string) => src.startsWith("/api/img?");
