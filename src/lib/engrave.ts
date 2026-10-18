// Some supplier renders carry a brand engraving inside the ring band. We look for it by its shape, flat on in the main
// photo and tilted in the angled photos, and paint it out. Server-only (uses sharp).

const MW = 107, MH = 15;
const MASK_HEX = "00000000000001f000000000001e1800000000003f800000381c03e300300000000c3000000703807c600600000001c0040000e0700fcc79f773f3e03e0fc7cfdcce21bd9b38ee7eec03f1dddcfb99cfb3b36319ce1dc03f31931c7019b63e0c6338c3b011e630630e8367c3c58c631870020cc66c61f86ff879b18ce70e006198d98e3b0d83077f79fce1f80fe3bbb9c773b9706fe71f9c1e0178743778ef73ee000000000000000c0000000638000000000000000180000000000000000000000000780000000000";
const FLAT_ANCHOR = [0.30, 0.28, 0.70, 0.60];   // x0, y0, x1, y1 as fractions of the picture
const TILT_ANCHOR = [0.20, 0.45, 0.95, 0.97];
const FLAT = { dice: 0.55, dark: 55 };          // real engravings score ~0.7+ / ~70; look-alikes (gem edges) stay under ~0.63 / ~46
const TILT = { dice: 0.56, dark: 40 };          // tilted text is slightly distorted, so the shape match is allowed to be looser (real ~0.6-0.7, look-alikes <= 0.52)
const ANGLES = [-20, -10, 0, 10, 20, 30];          // the angled renders tilt the text about 20 degrees

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
type Found = { x: number; y: number; w: number; h: number; dice: number };

/** Looks for one line of engraved text inside a region (dark = text-like pixels, dev = how much darker than the surroundings). */
function searchBands(dark: Uint8Array, dev: Float32Array, w: number, h: number, sc: number, minW: number, th: { dice: number; dark: number }): Found | null {
  const rows = new Int32Array(h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += dark[y * w + x]; rows[y] = s; }
  const hbs = [...new Set([12, 15, 19, 24].map(v => Math.max(6, Math.round(v * sc))))];
  let best: Found | null = null;
  for (const hb of hbs) for (let y = 0; y + hb < h; y += 2) {
    let s = 0; for (let k = 0; k < hb; k++) s += rows[y + k];
    if (s < 22 * sc * sc) continue;
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
    if (bh < 4 || bw < minW || bw / bh < 5 || bw / bh > 10.5) continue;
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
        if (dice >= th.dice && (!best || dice > best.dice)) {
          let dsum = 0, n = 0;
          for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) {
            const t = tpl[Math.min(MH - 1, Math.floor((yy * MH) / bh)) * MW + Math.min(MW - 1, Math.floor((xx * MW) / bw))];
            if (t) { dsum += dev[(oy + yy) * w + ox + xx]; n++; }
          }
          if (n && dsum / n >= th.dark) best = { x: ox, y: oy, w: bw, h: bh, dice };
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
  const W = info.width, H = info.height, sc = W / 1000;
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) gray[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += gray[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
  const mean = (x0: number, y0: number, x1: number, y1: number) => {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    const n = (x1 - x0) * (y1 - y0); if (n <= 0) return 255;
    return (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / n;
  };
  const dev = new Float32Array(W * H), dark = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = mean(x - 7, y - 7, x + 8, y + 8) - gray[y * W + x]; dev[y * W + x] = d; dark[y * W + x] = d > 25 ? 1 : 0; }

  // 1) flat text in the main photo
  let box: { x: number; y: number; w: number; h: number } | null = null, ang = 0;
  {
    const ax0 = Math.round(FLAT_ANCHOR[0] * W), ay0 = Math.round(FLAT_ANCHOR[1] * H), aw = Math.round(FLAT_ANCHOR[2] * W) - ax0, ah = Math.round(FLAT_ANCHOR[3] * H) - ay0;
    const rd = new Uint8Array(aw * ah), rv = new Float32Array(aw * ah);
    for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) { rd[y * aw + x] = dark[(ay0 + y) * W + ax0 + x]; rv[y * aw + x] = dev[(ay0 + y) * W + ax0 + x]; }
    const f = searchBands(rd, rv, aw, ah, sc, 0.07 * W, FLAT);
    if (f) box = { x: ax0 + f.x, y: ay0 + f.y, w: f.w, h: f.h };
  }
  // 2) tilted text in the angled photos: turn the picture until the text lies flat
  const cx = W / 2, cy = H / 2;
  if (!box) {
    const ax0 = Math.round(TILT_ANCHOR[0] * W), ay0 = Math.round(TILT_ANCHOR[1] * H), aw = Math.round(TILT_ANCHOR[2] * W) - ax0, ah = Math.round(TILT_ANCHOR[3] * H) - ay0;
    let bestF: Found | null = null, bestA = 0;
    for (const th of ANGLES) {
      const a = (th * Math.PI) / 180, al = Math.cos(a), be = Math.sin(a);
      const rd = new Uint8Array(aw * ah), rv = new Float32Array(aw * ah);
      for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) {
        const dx = ax0 + x, dy = ay0 + y, sx = Math.round(cx + al * (dx - cx) - be * (dy - cy)), sy = Math.round(cy + be * (dx - cx) + al * (dy - cy));
        if (sx >= 0 && sy >= 0 && sx < W && sy < H) { rd[y * aw + x] = dark[sy * W + sx]; rv[y * aw + x] = dev[sy * W + sx]; }
      }
      const f = searchBands(rd, rv, aw, ah, sc, 0.06 * W, TILT);
      if (f && (!bestF || f.dice > bestF.dice)) { bestF = { ...f, x: ax0 + f.x, y: ay0 + f.y }; bestA = th; }
    }
    if (bestF) { box = { x: bestF.x, y: bestF.y, w: bestF.w, h: bestF.h }; ang = bestA; }
  }
  if (!box) return null;

  // erase mask: thin dark strokes (the letters) inside the turned box. Wide dark areas (shadow stripes) and deep shadows are left alone.
  const a = (ang * Math.PI) / 180, al = Math.cos(a), be = Math.sin(a), pad = 4;
  const corners = [[box.x - pad, box.y - pad], [box.x + box.w + pad, box.y - pad], [box.x - pad, box.y + box.h + pad], [box.x + box.w + pad, box.y + box.h + pad]]
    .map(([dx, dy]) => [cx + al * (dx - cx) - be * (dy - cy), cy + be * (dx - cx) + al * (dy - cy)]);
  const rx = Math.max(0, Math.floor(Math.min(...corners.map(c => c[0]))) - 6), ry = Math.max(0, Math.floor(Math.min(...corners.map(c => c[1]))) - 6);
  const rw = Math.min(W, Math.ceil(Math.max(...corners.map(c => c[0]))) + 6) - rx, rh = Math.min(H, Math.ceil(Math.max(...corners.map(c => c[1]))) + 6) - ry;
  if (rw <= 0 || rh <= 0) return null;
  const dk = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) dk[y * rw + x] = dev[(ry + y) * W + rx + x] > 12 ? 1 : 0;
  const k = Math.max(3, Math.round(5 * sc)) | 1, hk = k >> 1;
  const morph = (src: Uint8Array, erode: boolean) => {
    const tmp = new Uint8Array(rw * rh), dst = new Uint8Array(rw * rh);
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = erode ? 1 : 0; for (let i = -hk; i <= hk; i++) { const q = x + i; const b = q < 0 || q >= rw ? (erode ? 0 : 0) : src[y * rw + q]; if (erode) v &= b; else v |= b; } tmp[y * rw + x] = v; }
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = erode ? 1 : 0; for (let j = -hk; j <= hk; j++) { const q = y + j; const b = q < 0 || q >= rh ? 0 : tmp[q * rw + x]; if (erode) v &= b; else v |= b; } dst[y * rw + x] = v; }
    return dst;
  };
  const blob = morph(morph(dk, true), false);
  const er = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    if (!dk[y * rw + x] || blob[y * rw + x]) continue;
    const px = rx + x, py = ry + y;
    if (mean(px - 7, py - 7, px + 8, py + 8) <= 100) continue; // deep shadow: leave it
    const dx = cx + al * (px - cx) + be * (py - cy), dy = cy - be * (px - cx) + al * (py - cy);
    if (dx >= box.x - pad && dx < box.x + box.w + pad && dy >= box.y - pad && dy < box.y + box.h + pad) er[y * rw + x] = 1;
  }
  const er2 = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (er[y * rw + x]) for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
    const qx = x + i, qy = y + j; if (qx >= 0 && qy >= 0 && qx < rw && qy < rh) er2[qy * rw + qx] = 1;
  }
  // paint: nearby untouched pixels, nearest ones counting most
  const R = 9, Kw = new Float32Array((2 * R + 1) * (2 * R + 1));
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) Kw[(j + R) * (2 * R + 1) + i + R] = i === 0 && j === 0 ? 0 : 1 / Math.pow(i * i + j * j + 1, 1.5);
  const out = new Uint8Array(rw * rh * 3);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    if (!er2[y * rw + x]) continue;
    let s0 = 0, s1 = 0, s2 = 0, n = 0;
    for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
      const qx = x + i, qy = y + j;
      if (qx < 0 || qy < 0 || qx >= rw || qy >= rh || er2[qy * rw + qx]) continue;
      const wgt = Kw[(j + R) * (2 * R + 1) + i + R], o = ((ry + qy) * W + rx + qx) * 3; s0 += wgt * data[o]; s1 += wgt * data[o + 1]; s2 += wgt * data[o + 2]; n += wgt;
    }
    const o2 = (y * rw + x) * 3; if (n) { out[o2] = s0 / n; out[o2 + 1] = s1 / n; out[o2 + 2] = s2 / n; } else er2[y * rw + x] = 0;
  }
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (er2[y * rw + x]) {
    const o = ((ry + y) * W + rx + x) * 3, o2 = (y * rw + x) * 3; data[o] = out[o2]; data[o + 1] = out[o2 + 1]; data[o + 2] = out[o2 + 2];
  }
  return sharp(data, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
}
