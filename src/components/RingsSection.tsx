import { getProductsByQuery, shopifyConfigured } from "@/lib/shopify";
import { ringQuery } from "@/lib/ringfilters";
import RingsBrowser from "./RingsBrowser";
import { fancySwatches, vdbConfigured } from "@/lib/vdb";

/** The ring settings grid. With `fancy`, only the fancy-colour settings (one colour, or "all"), used on the Fancy Colors page. */
export default async function RingsSection({ fancy }: { fancy?: string } = {}) {
  const r = shopifyConfigured ? await getProductsByQuery(ringQuery({ shapes: [], metals: [], styles: [], fancy }), { first: 24 }) : null;
  const swatches = fancy && vdbConfigured ? await fancySwatches() : {};
  return <RingsBrowser initial={r?.products ?? []} hasNext={r?.hasNext ?? false} cursor={r?.cursor ?? null} handle={fancy ? "fancy-colors" : "engagement-rings"} fancy={fancy} swatches={swatches} />;
}
