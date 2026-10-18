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
async function vdb(qs: string, revalidate = 300) {
  const res = await fetch(`${BASE}/v2/diamonds?${qs}`, {
    headers: { Authorization: `Token token=${process.env.VDB_ACCESS_TOKEN}, api_key=${process.env.VDB_API_KEY}` },
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`VDB http ${res.status}`);
  const r = (await res.json())?.response;
  // VDB answers HTTP 200 even when auth fails: the real status is inside the payload.
  if (!r || r.header?.status !== 200 || typeof r.body === "string") throw new Error(`VDB ${r?.header?.status ?? "bad response"}`);
  return r.body as { diamonds: Record<string, unknown>[]; total_diamonds_found: number };
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

export async function searchDiamonds(q: DiamondQuery) {
  const b = await vdb(build(q));
  return { total: b.total_diamonds_found || 0, items: b.diamonds.map(norm).filter((x): x is Diamond => !!x) };
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

async function harvestFancy(): Promise<Diamond[]> {
  // The colour-ASC order puts the stones without a letter colour (the fancy ones) at the very end. Find where they start with a
  // binary search over page numbers (~11 requests), then read from there to the end in parallel batches.
  const head = await fancyPage(1);
  const last = Math.max(1, Math.ceil((head.total_diamonds_found || 0) / 50));
  const pageHasFancy = async (n: number) => (await fancyPage(n)).diamonds.some(rawFancy);
  if (!(await pageHasFancy(last))) return []; // nothing fancy in the feed at all
  let lo = 1, hi = last; // invariant: page hi has fancy stones; page lo may not
  while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (await pageHasFancy(mid)) hi = mid; else lo = mid; }
  const first = Math.max(1, hi - 2); // a little overlap in case the boundary page is mixed
  const out = new Map<string, Diamond>();
  for (let n = first; n <= last; n += 20) {
    const nums = Array.from({ length: Math.min(20, last - n + 1) }, (_, i) => n + i);
    const pages = await Promise.all(nums.map(k => fancyPage(k)));
    pages.forEach(pg => pg.diamonds.forEach(x => { if (!rawFancy(x)) return; const d = norm(x); if (d) out.set(`${d.vendor}-${d.stock}`, d); }));
  }
  return [...out.values()];
}

// The harvested list is kept in Vercel's shared data cache (one copy for every server instance, refreshed in the background every
// 30 minutes, stale copy served meanwhile) and also in memory on this instance. The cron in vercel.json keeps it warm.
const harvestCached = unstable_cache(async () => { const items = await harvestFancy(); return items.map(d => ({ ...d })); }, ["vdb-fancy-v2"], { revalidate: 1800 });
let fancyCache: { at: number; items: Diamond[] } | null = null;
let fancyBusy: Promise<Diamond[]> | null = null;
export async function getFancy(): Promise<Diamond[]> {
  const fresh = fancyCache && Date.now() - fancyCache.at < 10 * 60 * 1000;
  if (fresh) return fancyCache!.items;
  if (!fancyBusy) fancyBusy = harvestCached().then(items => { if (items.length || !fancyCache) fancyCache = { at: Date.now(), items }; return fancyCache!.items; })
    .catch(e => { if (fancyCache) return fancyCache.items; throw e; }).finally(() => { fancyBusy = null; });
  return fancyCache ? fancyCache.items : fancyBusy; // stale list is served while the refresh runs
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
