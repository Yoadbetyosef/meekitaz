import { getReelByHandles } from "@/lib/shopify";
import ReelHand from "@/components/ReelHand";

/* Home · Ready to Ship, under One of One: "The Hand" — a fanned deck of filmed pieces on the same Mist as One of One
   with the big white M behind it; every few seconds the front card is dealt away and the next one comes forward
   (the same swipe gesture as the Reel). Five hand-picked pieces. */
const PICKS = ["reel-bc5309", "reel-er24721", "reel-eb3319", "reel-rg8537", "reel-pd2891"];

export default async function ReelStrip() {
  const items = await getReelByHandles(PICKS).catch(() => []);
  if (!items.length) return null;
  return <ReelHand items={items.map(i => ({ handle: i.handle, title: i.title, price: i.price, video: i.video, image: i.image, detail: i.detail }))} />;
}
