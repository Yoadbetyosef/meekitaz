// Some supplier renders carry a brand engraving inside the ring band. We look for it where those renders put it
// (inside the band, upper middle of the picture) and paint it out. Server-only (uses sharp).

const MW = 107, MH = 15;
const MASK_HEX = "00000000000001f000000000001e1800000000003f800000381c03e300300000000c3000000703807c600600000001c0040000e0700fcc79f773f3e03e0fc7cfdcce21bd9b38ee7eec03f1dddcfb99cfb3b36319ce1dc03f31931c7019b63e0c6338c3b011e630630e8367c3c58c631870020cc66c61f86ff879b18ce70e006198d98e3b0d83077f79fce1f80fe3bbb9c773b9706fe71f9c1e0178743778ef73ee000000000000000c0000000638000000000000000180000000000000000000000000780000000000";
const ANCHOR = [0.30, 0.28, 0.70, 0.60]; // x0, y0, x1, y1 as fractions of the picture
const DICE_MIN = 0.55, DARK_MIN = 55;   // real engravings score ~0.73 / ~74; look-alikes (gem edges) stay under ~0.63 / ~46

function baseMask() {
  const bytes = Buffer.from(MASK_HEX, "hex"), m = new Uint8Array(MW * MH);
  for (let i = 0; i < MW * MH; i++) m[i] = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
  return m;
}
const BASE = baseMask();
type V = "up" | "rot" | "flipv";
function variant(v: V) {
  const m = new Uint8Array(MW * MH);
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const sx = v === "rot" ? MW - 1 - x : x, sy = v === "rot" || v === "flipv" ? MH - 1 - y : y;
    m[y * MW + x] = BASE[sy * MW + sx];
  }
  return m;
}
const VARIANTS: Record<V, Uint8Array> = { up: variant("up"), rot: variant("rot"), flipv: variant("flipv") };

/** Finds the engraving. Returns its box inside the picture, or null. */
export function findEngraving(gray: Float32Array, W: number, H: number, mean: (x0: number, y0: number, x1: number, y1: number) => number) {
  const sc = W / 1000;
  const ax0 = Math.round(ANCHOR[0] * W), ay0 = Math.round(ANCHOR[1] * H), ax1 = Math.round(ANCHOR[2] * W), ay1 = Math.round(ANCHOR[3] * H);
  const w = ax1 - ax0, h = ay1 - ay0;
  const dev = new Float32Array(w * h), dark = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = mean(ax0 + x - 7, ay0 + y - 7, ax0 + x + 8, ay0 + y + 8) - gray[(ay0 + y) * W + ax0 + x];
    dev[y * w + x] = d; dark[y * w + x] = d > 25 ? 1 : 0;
  }
  const rows = new Int32Array(h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += dark[y * w + x]; rows[y] = s; }
  const hb = Math.max(8, Math.round(15 * sc));
  let best: { x: number; y: number; w: number; h: number; dice: number; v: V; dx: number; dy: number } | null = null;
  for (let y = 0; y + hb < h; y += 2) {
    let s = 0; for (let k = 0; k < hb; k++) s += rows[y + k];
    if (s < 22 * sc * sc) continue;
    // columns with dark pixels in this band, grouped across small gaps (letters), keep the group with most ink
    const col = new Uint8Array(w); let any = 0;
    for (let x = 0; x < w; x++) { for (let k = 0; k < hb; k++) if (dark[(y + k) * w + x]) { col[x] = 1; any++; break; } }
    if (any < 10) continue;
    const groups: [number, number][] = []; let st = -1, prev = -1;
    for (let x = 0; x < w; x++) if (col[x]) { if (st < 0) st = prev = x; else if (x - prev > 16 * sc) { groups.push([st, prev]); st = x; } prev = x; }
    if (st >= 0) groups.push([st, prev]);
    let g = groups[0], gm = -1;
    for (const gr of groups) { let ink = 0; for (let yy = y; yy < y + hb; yy++) for (let x = gr[0]; x <= gr[1]; x++) ink += dark[yy * w + x]; if (ink > gm) { gm = ink; g = gr; } }
    const bw = g[1] - g[0] + 1; let y0 = -1, y1 = -1;
    for (let yy = y; yy < y + hb; yy++) { let hit = 0; for (let x = g[0]; x <= g[1]; x++) hit |= dark[yy * w + x]; if (hit) { if (y0 < 0) y0 = yy; y1 = yy + 1; } }
    const bh = y1 - y0;
    if (bh < 4 || bw < 0.07 * W || bw / bh < 5 || bw / bh > 9.5) continue;
    for (const v of ["up", "rot", "flipv"] as V[]) {
      const tpl = VARIANTS[v];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const ox = g[0] + dx, oy = y0 + dy;
        if (ox < 0 || oy < 0 || ox + bw > w || oy + bh > h) continue;
        let inter = 0, a = 0, b = 0;
        for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) {
          const t = tpl[Math.min(MH - 1, Math.floor((yy * MH) / bh)) * MW + Math.min(MW - 1, Math.floor((xx * MW) / bw))], d = dark[(oy + yy) * w + ox + xx];
          a += d; b += t; inter += d & t;
        }
        const dice = a + b ? (2 * inter) / (a + b) : 0;
        if (dice >= DICE_MIN && (!best || dice > best.dice)) {
          let dsum = 0, n = 0;
          for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) {
            const t = tpl[Math.min(MH - 1, Math.floor((yy * MH) / bh)) * MW + Math.min(MW - 1, Math.floor((xx * MW) / bw))];
            if (t) { dsum += dev[(oy + yy) * w + ox + xx]; n++; }
          }
          if (n && dsum / n >= DARK_MIN) best = { x: ax0 + ox, y: ay0 + oy, w: bw, h: bh, dice, v, dx, dy };
        }
      }
    }
  }
  return best;
}

/** Returns a cleaned JPEG, or null when the picture has no engraving. */
export async function cleanImage(input: Buffer): Promise<Buffer | null> {
  const sharp = (await import("sharp").catch(() => null))?.default;
  if (!sharp) return null; // never break the picture: no cleaner available means the original is shown
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) gray[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += gray[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
  const mean = (x0: number, y0: number, x1: number, y1: number) => {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    const n = (x1 - x0) * (y1 - y0); if (n <= 0) return 255;
    return (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / n;
  };
  const f = findEngraving(gray, W, H, mean);
  if (!f) return null;
  // erase mask: everything noticeably darker than its surroundings inside the box (grown), including soft edges
  const pad = 4, rx = Math.max(0, f.x - pad), ry = Math.max(0, f.y - pad), rw = Math.min(W - rx, f.w + 2 * pad), rh = Math.min(H - ry, f.h + 2 * pad);
  const er = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const gx = rx + x, gy = ry + y;
    if (mean(gx - 7, gy - 7, gx + 8, gy + 8) - gray[gy * W + gx] > 12) er[y * rw + x] = 1;
  }
  const er2 = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (er[y * rw + x]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
    const qx = x + i, qy = y + j; if (qx >= 0 && qy >= 0 && qx < rw && qy < rh) er2[qy * rw + qx] = 1;
  }
  const out = new Uint8Array(rw * rh * 3), R = 9;
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    if (!er2[y * rw + x]) continue;
    let s0 = 0, s1 = 0, s2 = 0, n = 0;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const qx = x + i, qy = y + j;
      if (qx < 0 || qy < 0 || qx >= rw || qy >= rh || er2[qy * rw + qx]) continue;
      const o = ((ry + qy) * W + rx + qx) * 3; s0 += data[o]; s1 += data[o + 1]; s2 += data[o + 2]; n++;
    }
    const o2 = (y * rw + x) * 3; if (n) { out[o2] = s0 / n; out[o2 + 1] = s1 / n; out[o2 + 2] = s2 / n; } else er2[y * rw + x] = 0;
  }
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (er2[y * rw + x]) {
    const o = ((ry + y) * W + rx + x) * 3, o2 = (y * rw + x) * 3; data[o] = out[o2]; data[o + 1] = out[o2 + 1]; data[o + 2] = out[o2 + 2];
  }
  return sharp(data, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
}
