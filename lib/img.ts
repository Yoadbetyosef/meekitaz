// Photos of products whose supplier renders can carry an engraving go through /api/img, which paints it out.
// ENGRAVED matches the product families where the scan found it; everything else is served straight from Shopify.
const ENGRAVED = /\b(?:eternity|bands?|rings?)\b/i; // whole words: rings and bands, not earrings
// The engraving shows in the main photo (flat) and in the angled photos (tilted) of ring and band products.
export function photoSrc(url: string, width: number, title: string, slot = 0) {
  if (!/cdn\.shopify\.com/.test(url)) return url; // only Shopify product photos carry the engraving; on-model photos are left alone
  return slot <= 3 && ENGRAVED.test(title) ? `/api/img?u=${encodeURIComponent(url)}&w=${width}&s=${slot}` : url;
}
export const isCleaned = (src: string) => src.startsWith("/api/img?");
