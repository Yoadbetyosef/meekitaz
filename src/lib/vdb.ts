// Server-only client for the VDB diamond API. Credentials come from env vars and never reach the browser.
import { unstable_cache } from "next/cache";
const BASE = process.env.VDB_BASE_URL || "https://apiservices.vdbapp.com";
export const vdbConfigured = !!(process.env.VDB_API_KEY && process.env.VDB_ACCESS_TOKEN);
// Price shown on the site = VDB price x DIAMOND_MARKUP (default 1 = the price VDB returns).
const m = parseFloat(process.env.DIAMOND_MARKUP || "1");
export const MARKUP = isFinite(m) && m >= 1 ? m : 1;

export const SHAPES = ["Round", "Oval", "Cushion", "Emerald", "Pear", "Princess", "Radiant", "Marquise", "Asscher", "Heart"];
export const COLORS = ["D", "E", "F", "G", "H", "I"];
export const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2"];
const SORTS: Record<string, string> = { price_asc: "total_sales_price ASC", price_desc: "total_sales_price DESC", carat_desc: "size DESC", carat_asc: "size ASC" };

export type DiamondQuery = {
  shapes?: string[]; caratFrom?: number; caratTo?: number; priceFrom?: number; priceTo?: number;
  colorFrom?: string; colorTo?: string; clarityFrom?: string; clarityTo?: string; sort?: string; page?: number; pageSize?: number;
};
export type Diamond = {
  id: string; vendor: number; stock: string; shape: string; carat: number; color: string | null; clarity: string | null;
  cut: string | null; polish: string | null; symmetry: string | null; fluor: string | null; lab: string; cert: string; certUrl: string;
  image: string; video: string | null; embed: string | null; price: number; fancy: string | null; fancyColor: string | null; intensity: number | null; ratio: string | null; depth: string | null; table: string | null; measurements: string | null; country: string | null;
};

const enc = encodeURIComponent;
function build(q: DiamondQuery) {
  const p: string[] = ["type=Lab_grown_Diamond", "markup_mode=true", "with_images=true", "total_or_price_per_carat=total_sales_price"];
  (q.shapes || []).filter(s => SHAPES.includes(s)).forEach(s => p.push(`shapes[]=${enc(s)}`));
  if (q.caratFrom != null) p.push(`size_from=${q.caratFrom}`);
  if (q.caratTo != null) p.push(`size_to=${q.caratTo}`);
  p.push(`price_total_from=${Math.max(1, Math.floor((q.priceFrom ?? 1) / MARKUP))}`);
  if (q.priceTo != null) p.push(`price_total_to=${Math.ceil(q.priceTo / MARKUP)}`);
  if (q.colorFrom && COLORS.includes(q.colorFrom)) p.push(`color_from=${q.colorFrom}`);
  if (q.colorTo && COLORS.includes(q.colorTo)) p.push(`color_to=${q.colorTo}`);
  if (q.clarityFrom && CLARITIES.includes(q.clarityFrom)) p.push(`clarity_from=${q.clarityFrom}`);
  if (q.clarityTo && CLARITIES.includes(q.clarityTo)) p.push(`clarity_to=${q.clarityTo}`);
  p.push("labs[]=IGI", "labs[]=GIA"); // each lab is its own parameter; a comma list returns nothing
  p.push(`preference[]=${enc(SORTS[q.sort || "price_asc"] || SORTS.price_asc)}`);
  p.push(`page_size=${Math.min(q.pageSize || 24, 50)}`, `page_number=${Math.max(1, q.page || 1)}`);
  return p.join("&");
}

export async function vdbRaw(qs: string) { return vdb(qs, 0); }
async function vdbOnce(qs: string, revalidate: number, ms: number) {
  const res = await fetch(`${BASE}/v2/diamonds?${qs}`, {
    headers: { Authorization: `Token token=${process.env.VDB_ACCESS_TOKEN}, api_key=${process.env.VDB_API_KEY}` },
    next: { revalidate },
    signal: AbortSignal.timeout(ms), // the supplier sometimes stalls; a stalled call must not hang the whole page
  });
  if (!res.ok) throw new Error(`VDB http ${res.status}`);
  const r = (await res.json())?.response;
  // VDB answers HTTP 200 even when auth fails: the real status is inside the payload.
  if (!r || r.header?.status !== 200 || typeof r.body === "string") throw new Error(`VDB ${r?.header?.status ?? "bad response"}`);
  return r.body as { diamonds: Record<string, unknown>[]; total_diamonds_found: number };
}
async function vdb(qs: string, revalidate = 300) {
  try { return await vdbOnce(qs, revalidate, 14000); }
  catch { await new Promise(r => setTimeout(r, 350)); return vdbOnce(qs, revalidate, 14000); } // one quiet retry: most supplier errors are momentary
}


// 360 viewers we know how to embed without their buttons/arrows (same Vision360 engine accepts btn=0, sv=0, z=0).
function embedUrl(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return null; // http would be blocked as mixed content
    const h = u.hostname, p = u.pathname;
    const known = h === "v360.diamonds" || h === "v360.in" || (h === "labgrowns3.s3.ap-southeast-1.amazonaws.com" && p.endsWith("/stoneimages360.html")) || (h === "ssdweb.co" && p.endsWith("/Vision360.html")) || (h === "videos.gem360.in" && p.endsWith("/Vision360.html"));
    if (!known) return null;
    for (const [k, v] of [["btn", "0"], ["sv", "0"], ["z", "0"]]) if (!u.searchParams.has(k)) u.searchParams.set(k, v);
    return u.toString();
  } catch { return null; }
}

// Fancy-colour grades, light to rich. Indexes are what the filter scale uses.
export const INTENSITIES = ["Light", "Fancy Light", "Fancy", "Intense", "Vivid", "Deep"];
export const FANCY_COLORS = ["Pink", "Blue", "Yellow", "Green", "Orange", "Brown"];
function intensityIdx(v: string | null): number {
  const t = (v || "").toLowerCase();
  if (t.includes("deep") || t.includes("dark")) return 5;
  if (t.includes("vivid")) return 4;
  if (t.includes("intense")) return 3;
  if (t.includes("fancy light")) return 1;
  if (t === "fancy") return 2;
  if (t.includes("light")) return 0;
  return 2;
}
const s = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));
function norm(d: Record<string, unknown>): Diamond | null {
  const raw = Number(d.total_sales_price), carat = Number(d.size);
  const certUrl = s(d.cert_url);
  // Quality gate: only available stones with a price, photo, lab, certificate number and a working certificate link.
  if (!d.available || !(raw > 0) || !(carat > 0) || !d.image_url || !d.cert_num || !d.lab || !certUrl || certUrl.includes("/.pdf")) return null;
  const L = s(d.meas_length), W = s(d.meas_width), D = s(d.meas_depth);
  const fc = s(d.fancy_color_dominant_color), fi = s(d.fancy_color_intensity), fo = s(d.fancy_color_overtone), isFancy = !!(fc || fi);
  return {
    fancy: isFancy ? [fi || "Fancy", fo, fc].filter(Boolean).join(" ") : null, fancyColor: isFancy ? fc || "Other" : null, intensity: isFancy ? intensityIdx(fi) : null,
    id: String(d.id), vendor: Number(d.vendor_id), stock: String(d.stock_num), shape: String(d.shape), carat,
    color: s(d.color), clarity: s(d.clarity), cut: s(d.cut), polish: s(d.polish), symmetry: s(d.symmetry), fluor: s(d.fluor_intensity),
    lab: String(d.lab), cert: String(d.cert_num), certUrl, image: String(d.image_url), video: s(d.video_url), embed: embedUrl(s(d.video_url)),
    price: Math.round(raw * MARKUP), ratio: s(d.meas_ratio), depth: s(d.depth_percent), table: s(d.table_percent),
    measurements: L && W && D ? `${L} x ${W} x ${D} mm` : null, country: s(d.country),
  };
}

/** Live search at the supplier (the fallback). */
export async function searchDiamondsLive(q: DiamondQuery) {
  const b = await vdb(build(q));
  return { total: b.total_diamonds_found || 0, items: b.diamonds.map(norm).filter((x): x is Diamond => !!x) };
}

// ---------- White diamonds: our own copy of the inventory ----------
// The supplier goes down or crawls now and then (502/503s, dropped sockets). So the stones the site actually sells — every shape,
// 0.5 ct and up, colour D–I, clarity FL–VS2, IGI/GIA, with photos — are copied to our database by a cron every 20 minutes, the
// cheapest 150 of each shape × carat band (the ones a shopper sees first anyway). The diamonds page then filters our copy in
// milliseconds; the supplier is only asked live when there is no copy yet.
const WHITE_BANDS: [number, number][] = [[0.5, 0.7], [0.7, 1], [1, 1.5], [1.5, 2], [2, 2.5], [2.5, 3], [3, 4], [4, 30]];
const WHITE_SHARDS: [string, number, number][] = [];
for (const sh of SHAPES) for (const [lo, hi] of WHITE_BANDS) WHITE_SHARDS.push([sh, lo, hi]);
const WHITE_PAGES = 3; // 3 × 50 = the 150 cheapest per shard
async function harvestWhiteShard(shape: string, lo: number, hi: number): Promise<Diamond[]> {
  const out = new Map<string, Diamond>();
  for (let n = 1; n <= WHITE_PAGES; n++) {
    const page = await vdb(build({ shapes: [shape], caratFrom: lo, caratTo: hi, colorFrom: "D", colorTo: "I", clarityFrom: "FL", clarityTo: "VS2", sort: "price_asc", page: n, pageSize: 50 }), 1200);
    page.diamonds.forEach(x => { const d = norm(x); if (d) out.set(`${d.vendor}-${d.stock}`, d); });
    if (page.diamonds.length < 50) break;
  }
  return [...out.values()];
}
const cachedWhiteShard = (sh: string, lo: number, hi: number) => unstable_cache(() => harvestWhiteShard(sh, lo, hi), ["vdb-white-v1", sh, String(lo), String(hi)], { revalidate: 1200 })();
async function harvestWhite(budgetMs = 100_000): Promise<Diamond[]> {
  const t0 = Date.now(), out = new Map<string, Diamond>();
  let i = 0;
  const worker = async () => {
    while (i < WHITE_SHARDS.length && Date.now() - t0 < budgetMs) {
      const [sh, lo, hi] = WHITE_SHARDS[i++];
      try { (await cachedWhiteShard(sh, lo, hi)).forEach(d => out.set(`${d.vendor}-${d.stock}`, d)); } catch { /* one shard failing must not lose the rest */ }
    }
  };
  await Promise.all(Array.from({ length: 12 }, worker));
  return [...out.values()];
}
let whiteCache: { at: number; items: Diamond[] } | null = null;
let whiteBusy: Promise<Diamond[]> | null = null;
async function loadWhiteSnapshot(): Promise<{ at: number; items: Diamond[] } | null> {
  try {
    const { sql, ensureSchema } = await import("./db"); if (!sql) return null; await ensureSchema();
    const r = await sql`SELECT data, updated_at FROM snapshots WHERE name='white'`;
    return r[0] ? { at: new Date(r[0].updated_at as string).getTime(), items: r[0].data as Diamond[] } : null;
  } catch { return null; }
}
/** Cron: copy the inventory and save it. A bad run (supplier down) never replaces a good copy. */
export async function refreshWhiteSnapshot(): Promise<number> {
  const items = await harvestWhite();
  const prev = whiteCache?.items.length || (await loadWhiteSnapshot())?.items.length || 0;
  if (items.length < 500 || items.length < prev * 0.7) return items.length;
  whiteCache = { at: Date.now(), items };
  try {
    const { sql, ensureSchema } = await import("./db");
    if (sql) { await ensureSchema(); await sql`INSERT INTO snapshots (name, data, count) VALUES ('white', ${JSON.stringify(items)}::jsonb, ${items.length}) ON CONFLICT (name) DO UPDATE SET data=EXCLUDED.data, count=EXCLUDED.count, updated_at=now()`; }
  } catch (e) { console.error("[white snapshot]", e); }
  return items.length;
}
/** Our copy of the white inventory, or [] when there is none yet. Never waits on the supplier. */
export async function getWhite(): Promise<Diamond[]> {
  if (whiteCache && Date.now() - whiteCache.at < 10 * 60 * 1000) return whiteCache.items;
  if (!whiteBusy) whiteBusy = (async () => {
    const snap = await loadWhiteSnapshot();
    if (snap && snap.items.length) { whiteCache = snap; return snap.items; }
    return [];
  })().catch(() => (whiteCache ? whiteCache.items : [])).finally(() => { whiteBusy = null; });
  return whiteCache ? whiteCache.items : whiteBusy;
}
const GRADE = (list: string[], v: string | null) => { const i = v ? list.indexOf(v) : -1; return i < 0 ? 99 : i; };
/** The diamonds page: our copy first (instant, works when the supplier is down); live search only when there is no copy. */
export async function searchDiamonds(q: DiamondQuery) {
  const all = await getWhite();
  if (!all.length) return searchDiamondsLive(q);
  const shapes = (q.shapes || []).flatMap(x => (x === "Cushion" ? ["Cushion", "Elongated Cushion"] : [x]));
  const cf = GRADE(COLORS, q.colorFrom || null), ct = q.colorTo ? GRADE(COLORS, q.colorTo) : 98, lf = GRADE(CLARITIES, q.clarityFrom || null), lt = q.clarityTo ? GRADE(CLARITIES, q.clarityTo) : 98;
  const r = all.filter(d =>
    (!shapes.length || shapes.includes(d.shape)) &&
    (q.caratFrom == null || d.carat >= q.caratFrom) && (q.caratTo == null || d.carat <= q.caratTo) &&
    (q.priceFrom == null || d.price >= q.priceFrom) && (q.priceTo == null || d.price <= q.priceTo) &&
    (!q.colorFrom || GRADE(COLORS, d.color) >= (cf === 99 ? 0 : cf)) && (!q.colorTo || GRADE(COLORS, d.color) <= ct) &&
    (!q.clarityFrom || GRADE(CLARITIES, d.clarity) >= (lf === 99 ? 0 : lf)) && (!q.clarityTo || GRADE(CLARITIES, d.clarity) <= lt));
  const by: Record<string, (a: Diamond, b: Diamond) => number> = {
    price_asc: (a, b) => a.price - b.price, price_desc: (a, b) => b.price - a.price,
    carat_desc: (a, b) => b.carat - a.carat || a.price - b.price, carat_asc: (a, b) => a.carat - b.carat || a.price - b.price,
  };
  r.sort(by[q.sort || "price_asc"] || by.price_asc);
  const size = Math.min(q.pageSize || 24, 50), page = Math.max(1, q.page || 1);
  return { total: r.length, items: r.slice((page - 1) * size, page * size) };
}

export async function getDiamond(vendor: number, stock: string) {
  const b = await vdb(`type=Lab_grown_Diamond&markup_mode=true&stock_num=${enc(stock)}`);
  const hit = b.diamonds.find(d => Number(d.vendor_id) === vendor);
  return hit ? norm(hit) : null;
}

// ---------- Fancy colours ----------
// VDB's own fancy-colour filter does not work for lab-grown stones, and these stones carry no letter colour, so
// they sit at the very end of a colour-sorted list. We read that tail, keep what is fancy, and cache it.
const FANCY_QS = "type=Lab_grown_Diamond&markup_mode=true&with_images=true&total_or_price_per_carat=total_sales_price&price_total_from=1&labs[]=IGI&labs[]=GIA&size_from=0.3&preference[]=color%20ASC&page_size=50";
const fancyPage = (n: number) => vdb(`${FANCY_QS}&page_number=${n}`, 3600);
const rawFancy = (d: Record<string, unknown>) => !!(d.fancy_color_dominant_color || d.fancy_color_intensity);

// VDB offers no fancy-colour filter and deep pages (offset 100,000) take 10–20 s each. So the feed is split into small shards
// (shape × carat band, a few thousand stones each): in every shard the stones without a letter colour (the fancy ones) sit on the
// last pages, which are shallow and fast. Each shard is read from its last page backwards until the fancy stones stop.
const CARAT_BANDS: [number, number][] = [[0.3, 0.5], [0.5, 0.7], [0.7, 1], [1, 1.5], [1.5, 2], [2, 3], [3, 5], [5, 30]];
const SHARD_SHAPES = [...SHAPES, "Elongated Cushion"];
const shardQs = (shape: string, lo: number, hi: number) => `${FANCY_QS.replace("size_from=0.3", `size_from=${lo}&size_to=${hi}`)}&shapes[]=${enc(shape)}`;
async function harvestShard(shape: string, lo: number, hi: number): Promise<Diamond[]> {
  const base = shardQs(shape, lo, hi), out = new Map<string, Diamond>();
  const head = await vdb(`${base}&page_number=1`, 3600);
  const last = Math.max(1, Math.ceil((head.total_diamonds_found || 0) / 50));
  for (let n = last; n >= 1; n--) {
    const page = n === 1 ? head : await vdb(`${base}&page_number=${n}`, 3600);
    let hit = 0;
    page.diamonds.forEach(x => { if (!rawFancy(x)) return; hit++; const d = norm(x); if (d) out.set(`${d.vendor}-${d.stock}`, d); });
    if (hit === 0) break;
  }
  return [...out.values()];
}
// Every shard is its own entry in Vercel's shared data cache (small, well under the 2 MB limit), refreshed in the background every
// 30 minutes with the stale copy served meanwhile. A request that runs out of time keeps the shards it finished, so the next request
// only has the rest to do; the cron in vercel.json keeps everything warm. The harvest never tries to do it all in one go.
const SHARDS: [string, number, number][] = [];
for (const sh of SHARD_SHAPES) for (const [lo, hi] of CARAT_BANDS) SHARDS.push([sh, lo, hi]);
const cachedShard = (sh: string, lo: number, hi: number) => unstable_cache(() => harvestShard(sh, lo, hi), ["vdb-fancy-v5", sh, String(lo), String(hi)], { revalidate: 1800 })();
async function harvestFancy(budgetMs = 45_000): Promise<Diamond[]> {
  const t0 = Date.now(), out = new Map<string, Diamond>();
  let i = 0;
  const worker = async () => {
    while (i < SHARDS.length && Date.now() - t0 < budgetMs) {
      const [sh, lo, hi] = SHARDS[i++];
      try { (await cachedShard(sh, lo, hi)).forEach(d => out.set(`${d.vendor}-${d.stock}`, d)); } catch { /* one shard failing must not lose the rest */ }
    }
  };
  await Promise.all(Array.from({ length: 20 }, worker));
  return [...out.values()];
}

// The whole fancy-colour list is saved in the database by the cron (every 20 minutes), so a visitor never waits for the supplier:
// a cold server reads the saved list (well under a second) instead of harvesting ~90 supplier pages.
let fancyCache: { at: number; items: Diamond[] } | null = null;
let fancyBusy: Promise<Diamond[]> | null = null;
async function loadSnapshot(): Promise<{ at: number; items: Diamond[] } | null> {
  try {
    const { sql, ensureSchema } = await import("./db"); if (!sql) return null; await ensureSchema();
    const r = await sql`SELECT data, updated_at FROM snapshots WHERE name='fancy'`;
    return r[0] ? { at: new Date(r[0].updated_at as string).getTime(), items: r[0].data as Diamond[] } : null;
  } catch { return null; }
}
/** Cron: harvest the supplier and save the list. */
export async function refreshFancySnapshot(): Promise<number> {
  const items = await harvestFancy(100_000);
  const prev = fancyCache?.items.length || 0;
  if (items.length < 20 || items.length < prev * 0.8) return items.length; // a bad run never replaces a good list
  fancyCache = { at: Date.now(), items };
  try {
    const { sql, ensureSchema } = await import("./db");
    if (sql) { await ensureSchema(); await sql`INSERT INTO snapshots (name, data, count) VALUES ('fancy', ${JSON.stringify(items)}::jsonb, ${items.length}) ON CONFLICT (name) DO UPDATE SET data=EXCLUDED.data, count=EXCLUDED.count, updated_at=now()`; }
  } catch (e) { console.error("[fancy snapshot]", e); }
  return items.length;
}
export async function getFancy(): Promise<Diamond[]> {
  if (fancyCache && Date.now() - fancyCache.at < 10 * 60 * 1000) return fancyCache.items;
  if (!fancyBusy) fancyBusy = (async () => {
    const snap = await loadSnapshot();
    if (snap && snap.items.length) { fancyCache = snap; return snap.items; }
    // no saved list yet (first run): harvest now, as before
    const items = await harvestFancy();
    if (items.length) fancyCache = { at: Date.now(), items };
    return items;
  })().catch(e => { if (fancyCache) return fancyCache.items; throw e; }).finally(() => { fancyBusy = null; });
  return fancyCache ? fancyCache.items : fancyBusy;
}

export type FancyQuery = { color?: string; intFrom?: number; intTo?: number; caratFrom?: number; caratTo?: number; priceFrom?: number; priceTo?: number; shapes?: string[]; sort?: string; page?: number };
export async function searchFancy(q: FancyQuery) {
  const all = await getFancy();
  const shapes = (q.shapes || []).flatMap(x => (x === "Cushion" ? ["Cushion", "Elongated Cushion"] : [x]));
  const base = all.filter(d =>
    (q.intFrom == null || d.intensity! >= q.intFrom) && (q.intTo == null || d.intensity! <= q.intTo) &&
    (q.caratFrom == null || d.carat >= q.caratFrom) && (q.caratTo == null || d.carat <= q.caratTo) &&
    (q.priceFrom == null || d.price >= q.priceFrom) && (q.priceTo == null || d.price <= q.priceTo) &&
    (!shapes.length || shapes.includes(d.shape)));
  const pick = (c: string) => {
    const pool = all.filter(d => d.fancyColor === c && d.intensity === 4 && ["Oval", "Round", "Cushion", "Pear", "Radiant"].includes(d.shape));
    return (pool.length ? pool : all.filter(d => d.fancyColor === c)).sort((a, b) => Math.abs(a.carat - 1.5) - Math.abs(b.carat - 1.5))[0]?.image || null;
  };
  const facets = FANCY_COLORS.map(c => ({ color: c, count: base.filter(d => d.fancyColor === c).length, image: pick(c) })).filter(f => f.image);
  const r = (q.color ? base.filter(d => d.fancyColor === q.color) : base).slice();
  const by: Record<string, (a: Diamond, b: Diamond) => number> = {
    price_asc: (a, b) => a.price - b.price, price_desc: (a, b) => b.price - a.price,
    carat_desc: (a, b) => b.carat - a.carat, intensity_desc: (a, b) => (b.intensity! - a.intensity!) || a.price - b.price,
  };
  r.sort(by[q.sort || "price_asc"] || by.price_asc);
  const page = Math.max(1, q.page || 1);
  return { total: r.length, items: r.slice((page - 1) * 24, page * 24), facets };
}

/** One representative photo per fancy colour (a vivid stone near 1.5 ct), for the small colour circles across the site. */
export async function fancySwatches(): Promise<Record<string, string>> {
  try {
    // never hold a page for the harvest: if the list is not ready within a moment, the circles fall back to plain tints
    // (the harvest keeps running in the background and the next visit gets the photos)
    const all = await Promise.race([getFancy(), new Promise<Diamond[]>(res => setTimeout(() => res([]), 1500))]);
    if (!all.length) return {};
    const out: Record<string, string> = {};
    for (const c of ["Yellow", "Pink", "Blue", "Green"]) {
      const pool = all.filter(d => d.fancyColor === c && d.intensity === 4 && ["Round", "Oval", "Cushion", "Radiant"].includes(d.shape));
      const img = (pool.length ? pool : all.filter(d => d.fancyColor === c)).sort((a, b) => Math.abs(a.carat - 1.5) - Math.abs(b.carat - 1.5))[0]?.image;
      if (img) out[c] = img;
    }
    return out;
  } catch { return {}; }
}
