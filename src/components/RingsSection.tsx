import { getProductsByQuery, shopifyConfigured } from "@/lib/shopify";
import { ringQuery, FANCY_TYPES } from "@/lib/ringfilters";
import RingsBrowser from "./RingsBrowser";
import { fancySwatches, vdbConfigured } from "@/lib/vdb";

/** The ring settings grid. With `fancy`, only the fancy-colour settings (one colour, or "all"), used on the Fancy Colors page. */
let typesCache: { at: number; labels: string[] } | null = null;
/** The jewelry types that really have fancy-colour pieces in the catalogue (one tiny query per type, remembered for 10 minutes). */
async function fancyTypes(): Promise<string[]> {
  if (typesCache && Date.now() - typesCache.at < 600_000) return typesCache.labels;
  const hits = await Promise.all(FANCY_TYPES.map(async t => { try { const r = await getProductsByQuery(ringQuery({ shapes: [], metals: [], styles: [], fancy: "all", type: t.label }), { first: 1 }); return r && r.products.length ? t.label : ""; } catch { return ""; } }));
  const labels = hits.filter(Boolean);
  if (labels.length) typesCache = { at: Date.now(), labels };
  return labels;
}

export default async function RingsSection({ fancy }: { fancy?: string } = {}) {
  const r = shopifyConfigured ? await getProductsByQuery(ringQuery({ shapes: [], metals: [], styles: [], fancy }), { first: 24 }) : null;
  const types = fancy && shopifyConfigured ? await fancyTypes() : [];
  const swatches = fancy && vdbConfigured ? await fancySwatches() : {};
  return <RingsBrowser initial={r?.products ?? []} hasNext={r?.hasNext ?? false} cursor={r?.cursor ?? null} handle={fancy ? "fancy-colors" : "engagement-rings"} fancy={fancy} swatches={swatches} types={types} />;
}
