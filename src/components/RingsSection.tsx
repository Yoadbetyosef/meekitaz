import { getProductsByQuery, shopifyConfigured } from "@/lib/shopify";
import { ringQuery } from "@/lib/ringfilters";
import RingsBrowser from "./RingsBrowser";

export default async function RingsSection() {
  const r = shopifyConfigured ? await getProductsByQuery(ringQuery({ shapes: [], metals: [], styles: [] }), { first: 24 }) : null;
  return <RingsBrowser initial={r?.products ?? []} hasNext={r?.hasNext ?? false} cursor={r?.cursor ?? null} />;
}
