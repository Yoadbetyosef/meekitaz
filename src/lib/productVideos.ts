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
  "NS-2468": v("bc6158"), // Emerald Cut Diamond Bezel Tennis Bracelet
  "NS-2497": v("er24698"), // Cushion Diamond Solitaire Stud Earrings
  "NS-2501": v("er24883"), // Round Diamond Hoop Earrings
  "NS-2507": v("er17704"), // Round Diamond Pave Hoop Earrings
  "NS-2521": v("er24883"), // Round Diamond Hoop Earrings
  "NS-2315": v("eb5585"), // Bezel Diamond Bubble Eternity Band
  "NS-2316": v("eb7325"), // Round Diamond Shared Prong Eternity Band
  "NS-2322": v("eb1071"), // Pear Diamond Eternity Band
  "NS-2332": v("eb8758"), // Round Diamond Half Eternity Band with Prong Setting
  "NS-2343": v("eb8068"), // Round Diamond Chevron Pavé Band
  "NS-2349": v("eb5578"), // Round Diamond Eternity Band
  "NS-2350": v("eb6543"), // Multi Shape Diamond Eternity Band with Bezel Setting
  "NS-2354": v("eb8801"), // Round Diamond Half Eternity Band with Prong Setting
  "NS-2358": v("eb8798"), // Round Diamond Half Eternity Band with Prong Setting
  "NS-2367": v("eb4522"), // Round Diamond Half Eternity Band with Shared Prong Setting
  "NS-2376": v("eb8801"), // Round Diamond Half Eternity Band with Micro Prong Setting
  "NS-2378": v("eb8786"), // Marquise Diamond Half Eternity Band with Bezel Setting
  "NS-2392": v("eb752"), // Emerald Diamond Eternity Band
  "NS-2393": v("eb7393"), // Oval Diamond Full Eternity Band
  "NS-2397": v("eb5578"), // Round Diamond Full Eternity Band with Shared Prong Setting
  "NS-2398": v("eb5582"), // Asscher Diamond Half Eternity Band
  "NS-2399": v("eb8357"), // Cushion Diamond Half Eternity Band
  "NS-2400": v("eb5292"), // Emerald Diamond Half Eternity Band
  "NS-2402": v("eb8784"), // Oval Diamond Half Eternity Band
  "NS-2406": v("eb4522"), // Round Diamond Half Eternity Band
  "NS-2408": v("eb7291"), // Emerald Bezel Diamond Eternity Band
  "NS-2410": v("eb5288"), // Oval Bezel Diamond Eternity Band
  "NS-2413": v("eb6566"), // Radiant Bezel Diamond Eternity Band
  "NS-2414": v("eb5585"), // Round Bezel Diamond Eternity Band
  "NS-2420": v("eb7266"), // Radiant Diamond Full Eternity Band with Bezel Setting
  "NS-2422": v("eb8790"), // Emerald Half Bezel Diamond Eternity Band
  "NS-2424": v("eb5286"), // Oval Cut Diamond Half Eternity Band with Bezel Setting
};
