/** Photos that show another brand's name: the supplier's green gift box, a watermark, or its name engraved on the back discs of earrings.
 *  They are kept out of product cards and galleries. HIDDEN lists exact file names (lower case, without the ?v= part); the gemstone-earring
 *  back views are recognised by their file pattern instead, because there are hundreds of them. */
import { HIDDEN_IMAGES } from "./supplierImagesList";

const HIDDEN = new Set(HIDDEN_IMAGES);
export const baseName = (url: string) => (url.split("?")[0].split("/").pop() || "").toLowerCase();

/** The supplier's 3D renders of earrings (diamond and gemstone): every view except the front shows the back of the post, and the screw-back
 *  discs there are engraved with the supplier's name. Those views are files named "<Title>_1", "_2", ... ; the front view has no suffix. */
export function isRenderEarringAngle(url: string): boolean {
  return /\/[^/?]*(?:earring|hoop|stud|huggie|climber)[^/?]*_\d+\.(?:webp|jpe?g|png)(?:\?|$)/i.test(url);
}
export function isSupplierImage(url: string, _tags: string[] = []): boolean {
  return HIDDEN.has(baseName(url)) || isRenderEarringAngle(url);
}
type CardNode = { title: string; tags: string[]; featuredImage?: { url: string; altText?: string } | null; images?: { edges: { node: { url: string; altText?: string } }[] } };
/** The photo for a product card: the first one that does not show the supplier's name (the featured photo, then the next two). */
export function cardImage(n: CardNode): { url: string; alt: string } | undefined {
  const all = [n.featuredImage, ...(n.images?.edges || []).map(e => e.node)].filter((x): x is { url: string; altText?: string } => !!x);
  const ok = all.find(i => !isSupplierImage(i.url, n.tags));
  return ok ? { url: ok.url, alt: ok.altText || n.title } : undefined;
}
