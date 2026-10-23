import { OLD_HANDLE_TAG } from "./slug";
import { OPTIONS_KEY, OPTIONS_NS, parseNsOptions, type ProductOptions } from "./options";

/** A piece (earrings, necklace, bracelet, pendant) whose weight / colour / clarity options were never copied from the supplier page: copy them now, once,
 *  and keep them on the product so every later visit is instant. The page is only accepted if it carries the piece's own NS code, so two designs that
 *  share a title can never take each other's prices. A short time budget keeps the first visit from waiting long; a failure is remembered for ten minutes. */
const UA = "Mozilla/5.0 (Meekitaz catalogue sync)";
const TYPES = /^(earrings?|necklaces?|bracelets?|pendants?)$/i;
const failed = new Map<string, number>();
const get = async (url: string, ms: number): Promise<string | null> => {
  try { const r = await fetch(url, { headers: { "User-Agent": UA }, cache: "no-store", signal: AbortSignal.timeout(Math.max(300, ms)) }); return r.ok ? await r.text() : null; } catch { return null; }
};
export type HealPiece = { id: string; handle: string; title: string; productType: string; tags: string[] };
export type HealDeps = { save?: (ownerId: string, opts: ProductOptions) => Promise<void> };
async function defaultSave(ownerId: string, opts: ProductOptions) {
  const { adminGraphql } = await import("./shopifyAdmin");
  await adminGraphql(`mutation($m:[MetafieldsSetInput!]!){ metafieldsSet(metafields:$m){ userErrors{ message } } }`,
    { m: [{ ownerId, namespace: OPTIONS_NS, key: OPTIONS_KEY, type: "json", value: JSON.stringify(opts) }] });
}
export async function healOptions(p: HealPiece, deps: HealDeps = {}): Promise<ProductOptions | null> {
  const code = p.tags.find(t => /^NS-\d+$/.test(t));
  if (!code || !TYPES.test(p.productType) || p.tags.some(t => ["Diamond", "Karat variant", "Configured"].includes(t))) return null;
  const last = failed.get(p.handle); if (last && Date.now() - last < 10 * 60 * 1000) return null;
  const t0 = Date.now(), left = () => 6500 - (Date.now() - t0);
  const old = p.tags.find(t => t.startsWith(OLD_HANDLE_TAG))?.slice(OLD_HANDLE_TAG.length);
  const candidates = [...new Set([old, p.handle].filter((x): x is string => !!x))];
  const tryHandle = async (h: string) => { const url = `https://naturesparkle.com/products/${h}`; const html = await get(url, Math.min(3000, left())); return html && html.includes(code) ? { html, url } : null; };
  let hit: { html: string; url: string } | null = null;
  for (const h of candidates) { if (left() < 400) break; hit = await tryHandle(h); if (hit) break; }
  if (!hit && left() > 800) {
    // no page at the handles we know (the "-2" copies of a shared title): look the piece up by its title and keep the page that carries its NS code
    const sj = await get(`https://naturesparkle.com/search/suggest.json?q=${encodeURIComponent(p.title)}&resources[type]=product&resources[limit]=10`, Math.min(2500, left()));
    let hs: string[] = [];
    try { hs = (JSON.parse(sj || "{}") as { resources?: { results?: { products?: { handle: string }[] } } })?.resources?.results?.products?.map(x => x.handle) || []; } catch { /* none */ }
    for (const h of hs.filter(x => !candidates.includes(x)).slice(0, 4)) { if (left() < 1200) break; hit = await tryHandle(h); if (hit) break; }
  }
  const opts = hit ? parseNsOptions(hit.html, hit.url) : null;
  if (!opts) { failed.set(p.handle, Date.now()); return null; }
  try { await (deps.save || defaultSave)(p.id, opts); } catch { /* the options are still shown now; the save is retried on a later visit */ }
  return opts;
}
export const _resetHealMemory = () => failed.clear();
