// Server-only client for the VDB diamond API. Credentials come from env vars and never reach the browser.
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
  image: string; video: string | null; embed: string | null; price: number; ratio: string | null; depth: string | null; table: string | null; measurements: string | null; country: string | null;
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

async function vdb(qs: string) {
  const res = await fetch(`${BASE}/v2/diamonds?${qs}`, {
    headers: { Authorization: `Token token=${process.env.VDB_ACCESS_TOKEN}, api_key=${process.env.VDB_API_KEY}` },
    next: { revalidate: 300 },
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

const s = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));
function norm(d: Record<string, unknown>): Diamond | null {
  const raw = Number(d.total_sales_price), carat = Number(d.size);
  const certUrl = s(d.cert_url);
  // Quality gate: only available stones with a price, photo, lab, certificate number and a working certificate link.
  if (!d.available || !(raw > 0) || !(carat > 0) || !d.image_url || !d.cert_num || !d.lab || !certUrl || certUrl.includes("/.pdf")) return null;
  const L = s(d.meas_length), W = s(d.meas_width), D = s(d.meas_depth);
  return {
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
