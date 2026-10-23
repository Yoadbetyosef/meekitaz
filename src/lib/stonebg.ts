// The colour of a diamond photograph's own background (the supplier's studio grey, white or blue-grey), so the window around the stone can match it exactly.
// Server only (uses sharp). Never slows or breaks the page: a slow or unreadable photo gives a neutral grey.
const FALL = "#dfe2e6";
const cache = new Map<string, string>();
export async function stoneBg(url: string, ms = 1500): Promise<string> {
  if (!/^https?:\/\//.test(url)) return FALL;
  const hit = cache.get(url); if (hit) return hit;
  try {
    const sharp = (await import("sharp").catch(() => null))?.default; if (!sharp) return FALL;
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    const r = await fetch(url, { signal: ctl.signal, next: { revalidate: 86400 }, headers: { Accept: "image/*" } }).finally(() => clearTimeout(t));
    if (!r.ok || !(r.headers.get("content-type") || "").startsWith("image/")) return FALL;
    const { data, info } = await sharp(Buffer.from(await r.arrayBuffer())).resize(24, 24, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const pts: [number, number][] = [[1, 1], [22, 1], [1, 10], [22, 10], [11, 1], [1, 5], [22, 5]]; // the top edge and the upper corners: the studio backdrop, never the stone
    let R = 0, G = 0, B = 0;
    for (const [x, y] of pts) { const i = (y * info.width + x) * 3; R += data[i]; G += data[i + 1]; B += data[i + 2]; }
    const c = `rgb(${Math.round(R / pts.length)},${Math.round(G / pts.length)},${Math.round(B / pts.length)})`;
    cache.set(url, c); return c;
  } catch { return FALL; }
}
