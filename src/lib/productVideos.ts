/** A real film of the piece, by design (the NS code). It replaces the brand reel on that design's page, in every metal.
 *  The files are the supplier's own stock-piece films shrunk to 720p without sound (public/media/products/<lot>.mp4 and .jpg); the lot is the supplier's lot name. */
const v = (lot: string) => ({ src: `/media/products/${lot}.mp4`, poster: `/media/products/${lot}.jpg` });
export const PRODUCT_VIDEOS: Record<string, { src: string; poster: string }> = {
  "NS-2465": v("bc5820"), // Basket Set Round Diamond Tennis Bracelet
  "NS-2472": v("bc3283"), // Round Diamond Bezel Tennis Bracelet
  "NS-2475": v("bc5442"), // East-West Heart Shape Diamond Bezel Tennis Bracelet
  "NS-2476": v("bc6204"), // East-West Pear Shape Diamond Bezel Tennis Bracelet
  "NS-2479": v("bc6522"), // Emerald Cut Diamond Four-Prong Tennis Bracelet
  "NS-2481": v("bc7046"), // Oval Shape Diamond Four-Prong Tennis Bracelet
  "NS-2482": v("bc7117"), // Pear Shape Diamond Four-Prong Tennis Bracelet
  "NS-2484": v("bc6499"), // Radiant Cut Diamond Four-Prong Tennis Bracelet
  "NS-2485": v("bc5814"), // Four Prong Round Tennis Bracelet
  "NS-2488": v("bc6177"), // Multi Shape Diamond Tennis Bracelet
  "NS-2492": v("bc5814"), // Round Diamond Three-Prong Tennis Bracelet
};
