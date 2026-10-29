// Photos of products whose supplier renders can carry an engraving go through /api/img, which paints it out.
// Rings and bands carry the name inside the band (found by its letter shapes); earrings carry it on the back plates (found as rows of dark
// letter-sized marks sitting on gold). Everything else is served straight from Shopify.
const RING = /\b(?:eternity|bands?|rings?)\b/i; // whole words: rings and bands, not earrings
const EARRING = /\b(?:earrings?|studs?|hoops?|huggies?)\b/i;
// `slot` is the photo's place among the Shopify product photos (0 = the first).
export function photoSrc(url: string, width: number, title: string, slot = 0) {
  if (!/cdn\.shopify\.com/.test(url)) return url; // only Shopify product photos carry the engraving; on-model photos are left alone
  // v=6: the cleaners got better (generic text pass), so older cleaned copies are not reused; rings and bands: every studio photo
  if (slot <= 4 && EARRING.test(title)) return `/api/img?u=${encodeURIComponent(url)}&w=${width}&s=${slot}&m=gold&v=6`;
  if (slot <= 7 && RING.test(title)) return `/api/img?u=${encodeURIComponent(url)}&w=${width}&s=${slot}&v=6`;
  return url;
}
export const isCleaned = (src: string) => src.startsWith("/api/img?");
