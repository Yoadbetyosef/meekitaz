// Some supplier renders carry a brand engraving inside the ring band. Two styles exist: a serif one (bands, mostly) and a bold
// capital-letter one (solitaire rings). We look for each by its shape, flat on in the main photo and tilted in the angled photos,
// and paint it out. Server-only (uses sharp).

type V = "up" | "rot" | "flipv";
type Mask = { w: number; h: number; v: Record<V, Uint8Array> };
function makeMask(hex: string, w: number, h: number): Mask {
  const bytes = Buffer.from(hex, "hex"), base = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) base[i] = (bytes[i >> 3] >> (7 - (i & 7))) & 1;
  const flip = (rot: boolean, vflip: boolean) => { const m = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) m[y * w + x] = base[(rot || vflip ? h - 1 - y : y) * w + (rot ? w - 1 - x : x)]; return m; };
  return { w, h, v: { up: base, rot: flip(true, false), flipv: flip(false, true) } };
}
const SERIF = makeMask("00000000000001f000000000001e1800000000003f800000381c03e300300000000c3000000703807c600600000001c0040000e0700fcc79f773f3e03e0fc7cfdcce21bd9b38ee7eec03f1dddcfb99cfb3b36319ce1dc03f31931c7019b63e0c6338c3b011e630630e8367c3c58c631870020cc66c61f86ff879b18ce70e006198d98e3b0d83077f79fce1f80fe3bbb9c773b9706fe71f9c1e0178743778ef73ee000000000000000c0000000638000000000000000180000000000000000000000000780000000000", 107, 15);
const CAPS = makeMask("f0e0000000000000003000000009c3fbe3838ff10000000000c0007c18e70e0f8e1e3fee1df87f03e7e1c3fc631c383f386c1fb867f1fc3f9fef0e319870f6eee1b070e198e7b0e661bc38c641c3fb9b8ce1c386639807018698e31e070e0e7e61870e198c7e0f061a63b8781c3838f9fe1c3067e1f81e1dd9cfe1f070e3e3effc70c19f87201e7cff39c6e1ffff87b871c38e67180039c3fee799c7ffe00ec0e70ffb8e7018e71c3b8e639c000000039c1fce39fc7f9c707e19800000000000001c1877f0fc6180800000000000000000000000000180000000000000", 126, 14);

type Cfg = { mask: Mask; variants: V[]; minW: number; aspect: [number, number]; hbs: number[]; gap: number; minInk: number; dice: number; dark: number; minH?: number };   // minH: the least height of a line of text (at 1000 px wide)
const FLAT_ANCHOR = [0.30, 0.28, 0.70, 0.60];   // x0, y0, x1, y1 as fractions of the picture
const TILT_ANCHOR = [0.20, 0.45, 0.95, 0.97];
const CAPS_ANCHOR = [0.12, 0.28, 0.88, 0.97];
const SERIF_FLAT: Cfg = { mask: SERIF, variants: ["up", "rot", "flipv"], minW: 0.07, aspect: [5, 10.5], hbs: [12, 15, 19, 24], gap: 16, minInk: 22, dice: 0.55, dark: 55, minH: 8 }; // real ~0.7 / ~70; look-alikes <= 0.63 / ~46
const SERIF_TILT: Cfg = { ...SERIF_FLAT, minW: 0.06, dice: 0.56, dark: 40 };                                                                         // tilted text is a bit distorted
const CAPS_CFG: Cfg = { mask: CAPS, variants: ["up", "rot"], minW: 0.10, aspect: [5.5, 12], hbs: [22, 28, 34, 42], gap: 22, minInk: 30, dice: 0.57, dark: 42, minH: 16 };   // a thin dark edge under a stone is not lettering // real ~0.6-0.76 / 45-70
const SERIF_ANGLES = [-20, -10, 0, 10, 20, 30];  // the angled renders tilt the text about 20 degrees
const CAPS_ANGLES = [0, 10, 20, 30];

type Found = { x: number; y: number; w: number; h: number; dice: number; v: V };

/** Looks for one line of engraved text inside a region (dark = text-like pixels, dev = how much darker than the surroundings). */
function searchBands(dark: Uint8Array, dev: Float32Array, w: number, h: number, sc: number, c: Cfg): Found | null {
  const { mask } = c, rows = new Int32Array(h);
  for (let y = 0; y < h; y++) { let s = 0; for (let x = 0; x < w; x++) s += dark[y * w + x]; rows[y] = s; }
  const hbs = [...new Set(c.hbs.map(v => Math.max(6, Math.round(v * sc))))];
  let best: Found | null = null;
  for (const hb of hbs) for (let y = 0; y + hb < h; y += 2) {
    let s = 0; for (let k = 0; k < hb; k++) s += rows[y + k];
    if (s < c.minInk * sc * sc) continue;
    const col = new Uint8Array(w); let any = 0;
    for (let x = 0; x < w; x++) { for (let k = 0; k < hb; k++) if (dark[(y + k) * w + x]) { col[x] = 1; any++; break; } }
    if (any < 10) continue;
    const groups: [number, number][] = []; let st = -1, prev = -1;
    for (let x = 0; x < w; x++) if (col[x]) { if (st < 0) st = prev = x; else if (x - prev > c.gap * sc) { groups.push([st, prev]); st = x; } prev = x; }
    if (st >= 0) groups.push([st, prev]);
    let g = groups[0], gm = -1;
    for (const gr of groups) { let ink = 0; for (let yy = y; yy < y + hb; yy++) for (let x = gr[0]; x <= gr[1]; x++) ink += dark[yy * w + x]; if (ink > gm) { gm = ink; g = gr; } }
    const bw = g[1] - g[0] + 1; let y0 = -1, y1 = -1;
    for (let yy = y; yy < y + hb; yy++) { let hit = 0; for (let x = g[0]; x <= g[1]; x++) hit |= dark[yy * w + x]; if (hit) { if (y0 < 0) y0 = yy; y1 = yy + 1; } }
    const bh = y1 - y0;
    if (bh < Math.max(4, (c.minH || 0) * sc) || bw < c.minW * 1000 * sc || bw / bh < c.aspect[0] || bw / bh > c.aspect[1]) continue;
    for (const v of c.variants) {
      const tpl = mask.v[v];
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const ox = g[0] + dx, oy = y0 + dy;
        if (ox < 0 || oy < 0 || ox + bw > w || oy + bh > h) continue;
        let inter = 0, a = 0, b = 0;
        for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) {
          const t = tpl[Math.min(mask.h - 1, Math.floor((yy * mask.h) / bh)) * mask.w + Math.min(mask.w - 1, Math.floor((xx * mask.w) / bw))], d = dark[(oy + yy) * w + ox + xx];
          a += d; b += t; inter += d & t;
        }
        const dice = a + b ? (2 * inter) / (a + b) : 0;
        if (dice >= c.dice && (!best || dice > best.dice)) {
          let dsum = 0, n = 0;
          for (let yy = 0; yy < bh; yy++) for (let xx = 0; xx < bw; xx++) {
            const t = tpl[Math.min(mask.h - 1, Math.floor((yy * mask.h) / bh)) * mask.w + Math.min(mask.w - 1, Math.floor((xx * mask.w) / bw))];
            if (t) { dsum += dev[(oy + yy) * w + ox + xx]; n++; }
          }
          if (n && dsum / n >= c.dark) best = { x: ox, y: oy, w: bw, h: bh, dice, v };
        }
      }
    }
  }
  return best;
}

/** Per-picture maps: brightness, how much darker than the surroundings, and a dark mask. */
function maps(gray: Float32Array, W: number, H: number, k: number, thr: number) {
  const I = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) { let row = 0; for (let x = 0; x < W; x++) { row += gray[y * W + x]; I[(y + 1) * (W + 1) + x + 1] = I[y * (W + 1) + x + 1] + row; } }
  const mean = (x0: number, y0: number, x1: number, y1: number) => {
    x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(W, x1); y1 = Math.min(H, y1);
    const n = (x1 - x0) * (y1 - y0); if (n <= 0) return 255;
    return (I[y1 * (W + 1) + x1] - I[y0 * (W + 1) + x1] - I[y1 * (W + 1) + x0] + I[y0 * (W + 1) + x0]) / n;
  };
  const dev = new Float32Array(W * H), dark = new Uint8Array(W * H), r = k >> 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = mean(x - r, y - r, x + r + 1, y + r + 1) - gray[y * W + x]; dev[y * W + x] = d; dark[y * W + x] = d > thr ? 1 : 0; }
  return { dev, dark, mean };
}

/** Turns the picture by `ang` degrees around its centre and samples a region of it (the text then lies flat). */
function sample(dark: Uint8Array, dev: Float32Array, W: number, H: number, ang: number, anchor: number[]) {
  const a = (ang * Math.PI) / 180, al = Math.cos(a), be = Math.sin(a), cx = W / 2, cy = H / 2;
  const ax0 = Math.round(anchor[0] * W), ay0 = Math.round(anchor[1] * H), aw = Math.round(anchor[2] * W) - ax0, ah = Math.round(anchor[3] * H) - ay0;
  const rd = new Uint8Array(aw * ah), rv = new Float32Array(aw * ah);
  for (let y = 0; y < ah; y++) for (let x = 0; x < aw; x++) {
    const dx = ax0 + x, dy = ay0 + y, sx = Math.round(cx + al * (dx - cx) - be * (dy - cy)), sy = Math.round(cy + be * (dx - cx) + al * (dy - cy));
    if (sx >= 0 && sy >= 0 && sx < W && sy < H) { rd[y * aw + x] = dark[sy * W + sx]; rv[y * aw + x] = dev[sy * W + sx]; }
  }
  return { rd, rv, aw, ah, ax0, ay0 };
}

/** Paints the masked pixels of a region from the untouched pixels around them (nearest counting most). A wide stroke has no untouched pixel within
 *  reach of its middle, so the paint works in from the edges in several rounds, each round treating what was just painted as known. */
function fillMasked(data: Uint8Array, W: number, rx: number, ry: number, rw: number, rh: number, er2: Uint8Array, usable?: Uint8Array) {
  const R = 9, Kw = new Float32Array((2 * R + 1) * (2 * R + 1));
  for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) Kw[(j + R) * (2 * R + 1) + i + R] = i === 0 && j === 0 ? 0 : 1 / Math.pow(i * i + j * j + 1, 1.5);
  const reg = new Float32Array(rw * rh * 3), known = new Uint8Array(rw * rh), pend = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const o = ((ry + y) * W + rx + x) * 3, o2 = (y * rw + x) * 3; reg[o2] = data[o]; reg[o2 + 1] = data[o + 1]; reg[o2 + 2] = data[o + 2]; known[y * rw + x] = er2[y * rw + x] || (usable && !usable[y * rw + x]) ? 0 : 1; pend[y * rw + x] = er2[y * rw + x]; }
  for (let round = 0; round < 8; round++) {
    const upd: number[] = [];
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
      if (!pend[y * rw + x]) continue;
      let s0 = 0, s1 = 0, s2 = 0, n = 0;
      for (let j = -R; j <= R; j++) for (let i = -R; i <= R; i++) {
        const qx = x + i, qy = y + j;
        if (qx < 0 || qy < 0 || qx >= rw || qy >= rh || !known[qy * rw + qx]) continue;
        const wgt = Kw[(j + R) * (2 * R + 1) + i + R], o2 = (qy * rw + qx) * 3; s0 += wgt * reg[o2]; s1 += wgt * reg[o2 + 1]; s2 += wgt * reg[o2 + 2]; n += wgt;
      }
      if (n) upd.push(y * rw + x, s0 / n, s1 / n, s2 / n);
    }
    if (!upd.length) break;
    for (let u = 0; u < upd.length; u += 4) { const p = upd[u], o2 = p * 3; reg[o2] = upd[u + 1]; reg[o2 + 1] = upd[u + 2]; reg[o2 + 2] = upd[u + 3]; known[p] = 1; pend[p] = 0; }
  }
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (er2[y * rw + x] && !pend[y * rw + x]) {
    const o = ((ry + y) * W + rx + x) * 3, o2 = (y * rw + x) * 3; data[o] = reg[o2]; data[o + 1] = reg[o2 + 1]; data[o + 2] = reg[o2 + 2];
  }
}

/** The small engraving along the inside of the band in the front-on photo: a row of tiny dark-gold marks on a smooth gold band. Looks for that row
 *  (many small marks, in a line, wide enough to be a word) and paints the marks out. Returns false when there is no such row. */
function cleanTiny(data: Uint8Array, gray: Float32Array, W: number, H: number): boolean {
  const sc = W / 1000, ax0 = Math.round(0.30 * W), ax1 = Math.round(0.70 * W), ay0 = Math.round(0.66 * H), ay1 = Math.round(0.92 * H), rw = ax1 - ax0, rh = ay1 - ay0;
  const g0 = new Float32Array(rw * rh), gold = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    const o = ((ay0 + y) * W + ax0 + x) * 3, r = data[o], g = data[o + 1], b = data[o + 2];
    g0[y * rw + x] = gray[(ay0 + y) * W + ax0 + x]; gold[y * rw + x] = r > g && g > b + 14 ? 1 : 0;   // the band: a saturated yellow
  }
  const cr = Math.max(2, Math.round(3 * sc));
  const filt = (src: Float32Array, mx: boolean) => {
    const t = new Float32Array(rw * rh), d2 = new Float32Array(rw * rh);
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = mx ? -1 : 999; for (let i = -cr; i <= cr; i++) { const q = Math.min(rw - 1, Math.max(0, x + i)), b = src[y * rw + q]; v = mx ? Math.max(v, b) : Math.min(v, b); } t[y * rw + x] = v; }
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = mx ? -1 : 999; for (let j = -cr; j <= cr; j++) { const q = Math.min(rh - 1, Math.max(0, y + j)), b = t[q * rw + x]; v = mx ? Math.max(v, b) : Math.min(v, b); } d2[y * rw + x] = v; }
    return d2;
  };
  const clo = filt(filt(g0, true), false), mark = new Uint8Array(rw * rh);
  for (let i = 0; i < rw * rh; i++) mark[i] = clo[i] - g0[i] > 14 && (gold[i] || g0[i] < 70) ? 1 : 0;   // dark gold, or the near-black of a deep cut
  // connected marks
  const lab = new Int32Array(rw * rh), comps: { x0: number; x1: number; y0: number; y1: number; n: number; pts: number[] }[] = [];
  for (let p = 0; p < rw * rh; p++) {
    if (!mark[p] || lab[p]) continue;
    const id = comps.length + 1, c = { x0: rw, x1: 0, y0: rh, y1: 0, n: 0, pts: [] as number[] }, st = [p]; lab[p] = id;
    while (st.length) {
      const q = st.pop()!, qx = q % rw, qy = (q / rw) | 0; c.n++; c.pts.push(q); c.x0 = Math.min(c.x0, qx); c.x1 = Math.max(c.x1, qx); c.y0 = Math.min(c.y0, qy); c.y1 = Math.max(c.y1, qy);
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const nx = qx + i, ny = qy + j; if (nx < 0 || ny < 0 || nx >= rw || ny >= rh) continue; const nq = ny * rw + nx; if (mark[nq] && !lab[nq]) { lab[nq] = id; st.push(nq); } }
    }
    comps.push(c);
  }
  const small = comps.filter(c => c.n >= 5 * sc * sc && c.n <= 500 * sc * sc && c.y1 - c.y0 + 1 <= 28 * sc && c.y1 - c.y0 + 1 >= 5 * sc && c.x1 - c.x0 + 1 <= 34 * sc);
  if (small.length < 7) return false;
  // the row: the most marks within a band that follows a gentle curve (the baseline may bend by a few pixels per letter)
  let best: typeof small = [];
  for (const seed of small) {
    const cy = (seed.y0 + seed.y1) / 2, cx = (seed.x0 + seed.x1) / 2, grp = small.filter(c => Math.abs((c.y0 + c.y1) / 2 - cy) <= 18 * sc + Math.abs((c.x0 + c.x1) / 2 - cx) * 0.06);
    if (grp.length > best.length) best = grp;
  }
  if (best.length < 7) return false;
  const xs0 = Math.min(...best.map(c => c.x0)), xs1 = Math.max(...best.map(c => c.x1)), ys0 = Math.min(...best.map(c => c.y0)), ys1 = Math.max(...best.map(c => c.y1));
  if (xs1 - xs0 < 60 * sc || xs1 - xs0 > 300 * sc) return false;   // a word, not a line of gems or an edge
  const er = new Uint8Array(rw * rh), prot = new Uint8Array(rw * rh);
  for (const c of comps) if (!small.includes(c) && c.x1 - c.x0 > 150 * sc) for (const q of c.pts) { const qx = q % rw, qy = (q / rw) | 0; prot[qy * rw + qx] = 1; }   // the long edges of the band stay
  for (const c of best) for (const q of c.pts) { const qx = q % rw, qy = (q / rw) | 0; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) { const nx = qx + i, ny = qy + j; if (nx >= 0 && ny >= 0 && nx < rw && ny < rh) er[ny * rw + nx] = 1; } }
  // the last letters of a line are often fainter against the bright edge of the band: along the line (a little beyond its ends) paint fainter marks too
  const wx0 = Math.max(0, xs0 - 10), wx1 = Math.min(rw - 1, xs1 + Math.round(80 * sc)), wy0 = Math.max(0, ys0 - Math.round(8 * sc)), wy1 = Math.min(rh - 1, ys1 + Math.round(10 * sc));
  for (let y = wy0; y <= wy1; y++) for (let x = wx0; x <= wx1; x++) {
    const p = y * rw + x; if (prot[p] || g0[p] >= 110 || clo[p] - g0[p] <= 10) continue;   // only what is really ink-dark
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const nx = x + i, ny = y + j; if (nx >= 0 && ny >= 0 && nx < rw && ny < rh && !prot[ny * rw + nx]) er[ny * rw + nx] = 1; }
  }
  fillMasked(data, W, ax0, ay0, rw, rh, er, gold);   // paint from gold only, never from the white behind the ring
  return true;
}

/** Engraving on the back plates and posts of earrings (and on anything else that is gold): black or dark-brown marks sitting right on gold, in a cluster.
 *  A mark counts when it is small, near-black and has gold all around it (diamonds, white background and shadows do not); a handful of them close together
 *  is a word. They are painted out from the gold around them. Returns false when there is nothing like that. */
function cleanGoldInk(data: Uint8Array, gray: Float32Array, W: number, H: number): boolean {
  const sc = W / 1000, N = W * H, gold = new Uint8Array(N), ink = new Uint8Array(N), strong = new Uint8Array(N);
  for (let i = 0; i < N; i++) { const r = data[i * 3], g = data[i * 3 + 1], b = data[i * 3 + 2]; gold[i] = r > g && g > b + 14 && gray[i] > 100 ? 1 : 0; ink[i] = gray[i] < 105 ? 1 : 0; strong[i] = gray[i] < 62 ? 1 : 0; }
  const lab = new Int32Array(N), comps: { n: number; x0: number; x1: number; y0: number; y1: number; pts: number[]; gf: number }[] = [];
  for (let p = 0; p < N; p++) {
    if (!ink[p] || lab[p]) continue;
    const id = comps.length + 1, c = { n: 0, x0: W, x1: 0, y0: H, y1: 0, pts: [] as number[], gf: 0 }, st = [p]; lab[p] = id;
    while (st.length) {
      const q = st.pop()!, qx = q % W, qy = (q / W) | 0; c.n++; c.pts.push(q); c.x0 = Math.min(c.x0, qx); c.x1 = Math.max(c.x1, qx); c.y0 = Math.min(c.y0, qy); c.y1 = Math.max(c.y1, qy);
      if (c.n > 9000) break;
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const nx = qx + i, ny = qy + j; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const nq = ny * W + nx; if (ink[nq] && !lab[nq]) { lab[nq] = id; st.push(nq); } }
    }
    comps.push(c);
  }
  const rr = Math.max(3, Math.round(5 * sc)), cand: typeof comps = [], near: typeof comps = [], seeds: typeof comps = [];
  for (const c of comps) {
    const h = c.y1 - c.y0 + 1, w = c.x1 - c.x0 + 1;
    if (c.n < 6 * sc * sc || c.n > 1600 * sc * sc || h > 48 * sc || w > 90 * sc) continue;   // letters that touch each other make one larger mark
    let g = 0, t = 0;
    for (let y = Math.max(0, c.y0 - rr); y <= Math.min(H - 1, c.y1 + rr); y++) for (let x = Math.max(0, c.x0 - rr); x <= Math.min(W - 1, c.x1 + rr); x++) {
      const q = y * W + x; if (ink[q]) continue; t++; if (gold[q]) g++;
    }
    c.gf = t ? g / t : 0;
    near.push(c);
    let st = 0; for (const q of c.pts) st += strong[q];
    // a letter: tall enough, solid, and its core is near-black (the dark crevices of hinges and clasps are dark gold, not black)
    if (c.gf >= 0.85 && h >= 11 * sc && c.n >= 40 * sc * sc && st >= 0.35 * c.n) seeds.push(c);   // bold letters of the back plate; the tiny print of a screw-back is not touched
    if (c.gf >= 0.8) cand.push(c);
  }
  // a word: marks with several other marks close by
  const hts = (c: (typeof comps)[number]) => c.y1 - c.y0 + 1;
  // is there an engraving at all? a row of letter-sized, near-black, solid marks on gold (hinges, clasps and gem gaps do not look like that)
  const sure = seeds.filter(c => { let k = 0; for (const d of seeds) if (d !== c && Math.abs((d.x0 + d.x1) / 2 - (c.x0 + c.x1) / 2) < 45 * sc && Math.abs((d.y0 + d.y1) / 2 - (c.y0 + c.y1) / 2) < 45 * sc && hts(d) / hts(c) > 0.55 && hts(d) / hts(c) < 1.8) k++; return k >= 2; });
  if (sure.length < 5) return false;
  // if so, paint out all of the word: every small dark mark in the neighbourhood of the sure ones that sits on gold, and then the faint ones next to those
  const keep = cand.filter(c => sure.includes(c) || sure.some(k => Math.abs((k.x0 + k.x1) / 2 - (c.x0 + c.x1) / 2) < 170 * sc && Math.abs((k.y0 + k.y1) / 2 - (c.y0 + c.y1) / 2) < 110 * sc));   // the pair: the same word is on both earrings
  const grown = near.filter(c => !keep.includes(c) && c.gf >= 0.45 && keep.some(k => Math.abs((k.x0 + k.x1) / 2 - (c.x0 + c.x1) / 2) < 26 * sc && Math.abs((k.y0 + k.y1) / 2 - (c.y0 + c.y1) / 2) < 26 * sc));
  keep.push(...grown);
  const er = new Uint8Array(N);
  for (const c of keep) for (const q of c.pts) { const qx = q % W, qy = (q / W) | 0; for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) { const nx = qx + i, ny = qy + j; if (nx >= 0 && ny >= 0 && nx < W && ny < H) er[ny * W + nx] = 1; } }
  // paint region by region (each cluster's bounding box, a little larger)
  const x0 = Math.max(0, Math.min(...keep.map(c => c.x0)) - 12), x1 = Math.min(W, Math.max(...keep.map(c => c.x1)) + 12), y0 = Math.max(0, Math.min(...keep.map(c => c.y0)) - 12), y1 = Math.min(H, Math.max(...keep.map(c => c.y1)) + 12);
  const rw = x1 - x0, rh = y1 - y0, e2 = new Uint8Array(rw * rh), use = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const q = (y0 + y) * W + x0 + x; e2[y * rw + x] = er[q]; use[y * rw + x] = gold[q] && !er[q] ? 1 : 0; }
  fillMasked(data, W, x0, y0, rw, rh, e2, use);
  return true;
}

/** Returns a cleaned JPEG, or null when the picture has no engraving. `slot` is the photo's place in the gallery (0 = main). */
export async function cleanImage(input: Buffer, slot = 0, mode: "ring" | "gold" = "ring"): Promise<Buffer | null> {
  const sharp = (await import("sharp").catch(() => null))?.default;
  if (!sharp) return null; // never break the picture: no cleaner available means the original is shown
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, sc = W / 1000, cx = W / 2, cy = H / 2;
  const gray = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) gray[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
  if (mode === "gold") return cleanGoldInk(data, gray, W, H) ? sharp(data, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toBuffer() : null;
  const { dev, dark, mean } = maps(gray, W, H, 15, 25);

  let box: { x: number; y: number; w: number; h: number } | null = null, ang = 0, guide: { mask: Mask; v: V } | null = null;
  // 1) serif text, flat, in the main photo
  { const s = sample(dark, dev, W, H, 0, FLAT_ANCHOR), f = searchBands(s.rd, s.rv, s.aw, s.ah, sc, SERIF_FLAT); if (f) box = { x: s.ax0 + f.x, y: s.ay0 + f.y, w: f.w, h: f.h }; }
  // 2) serif text, tilted, in the angled photos
  if (!box) {
    let bf: Found | null = null, ba = 0, bo = [0, 0];
    for (const th of SERIF_ANGLES) { const s = sample(dark, dev, W, H, th, TILT_ANCHOR), f = searchBands(s.rd, s.rv, s.aw, s.ah, sc, SERIF_TILT); if (f && (!bf || f.dice > bf.dice)) { bf = f; ba = th; bo = [s.ax0, s.ay0]; } }
    if (bf) { box = { x: bo[0] + bf.x, y: bo[1] + bf.y, w: bf.w, h: bf.h }; ang = ba; }
  }
  // 3) capital-letter text of the solitaire rings (main photo and the first angled photo), searched on a smaller copy for speed
  if (!box && slot <= 1) {
    const sw = 500, sh = Math.max(1, Math.round((H * sw) / W)), f0 = W / sw;
    const small = await sharp(input).removeAlpha().greyscale().resize(sw, sh, { fit: "fill" }).raw().toBuffer();
    const g2 = new Float32Array(sw * sh); for (let i = 0; i < sw * sh; i++) g2[i] = small[i];
    const m2 = maps(g2, sw, sh, 11, 40);
    let bf: Found | null = null, ba = 0, bo = [0, 0];
    for (const th of CAPS_ANGLES) { const s = sample(m2.dark, m2.dev, sw, sh, th, CAPS_ANCHOR), f = searchBands(s.rd, s.rv, s.aw, s.ah, sw / 1000, CAPS_CFG); if (f && (!bf || f.dice > bf.dice)) { bf = f; ba = th; bo = [s.ax0, s.ay0]; } }
    if (bf) { box = { x: (bo[0] + bf.x) * f0, y: (bo[1] + bf.y) * (H / sh), w: bf.w * f0, h: bf.h * (H / sh) }; ang = ba; guide = { mask: CAPS, v: bf.v }; }
  }
  if (!box) {
    if (slot >= 2 && slot <= 5 && cleanTiny(data, gray, W, H)) return sharp(data, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
    return null;
  }

  // erase mask: thin dark strokes (the letters) inside the turned box; wide dark areas and deep shadows are left alone
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
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = erode ? 1 : 0; for (let i = -hk; i <= hk; i++) { const q = x + i; const b = q < 0 || q >= rw ? 0 : src[y * rw + q]; if (erode) v &= b; else v |= b; } tmp[y * rw + x] = v; }
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = erode ? 1 : 0; for (let j = -hk; j <= hk; j++) { const q = y + j; const b = q < 0 || q >= rh ? 0 : tmp[q * rw + x]; if (erode) v &= b; else v |= b; } dst[y * rw + x] = v; }
    return dst;
  };
  const blob = morph(morph(dk, true), false);
  // thin dark strokes by a second route: how much darker a pixel is than the same place with everything thinner than the letters filled in (a grey closing)
  const cr = Math.max(4, Math.round(8 * sc)), g0 = new Float32Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) g0[y * rw + x] = gray[(ry + y) * W + rx + x];
  const filt = (src: Float32Array, mx: boolean) => {
    const t = new Float32Array(rw * rh), d2 = new Float32Array(rw * rh);
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = mx ? -1 : 999; for (let i = -cr; i <= cr; i++) { const q = Math.min(rw - 1, Math.max(0, x + i)), b = src[y * rw + q]; v = mx ? Math.max(v, b) : Math.min(v, b); } t[y * rw + x] = v; }
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { let v = mx ? -1 : 999; for (let j = -cr; j <= cr; j++) { const q = Math.min(rh - 1, Math.max(0, y + j)), b = t[q * rw + x]; v = mx ? Math.max(v, b) : Math.min(v, b); } d2[y * rw + x] = v; }
    return d2;
  };
  const clo = filt(filt(g0, true), false), dk2 = new Uint8Array(rw * rh);
  for (let i = 0; i < rw * rh; i++) dk2[i] = dk[i] || clo[i] - g0[i] > 24 ? 1 : 0;
  const er = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    if (!dk2[y * rw + x] || (!guide && blob[y * rw + x])) continue; // plain mode: thin strokes only; guided mode: the template decides, plus any thin stroke left inside the text box
    const px = rx + x, py = ry + y;
    if (mean(px - 7, py - 7, px + 8, py + 8) <= 100 && gray[py * W + px] > 50) continue; // deep shadow: leave it (but a near-black pixel is ink, even in the middle of a bold letter)
    const dx = cx + al * (px - cx) + be * (py - cy), dy = cy - be * (px - cx) + al * (py - cy);
    if (!(dx >= box.x - pad && dx < box.x + box.w + pad && dy >= box.y - pad && dy < box.y + box.h + pad)) continue;
    if (guide) { // capital text can sit against gems: only paint where a letter of the template is (a little grown)
      let near = 0;
      for (let j = -6; j <= 6 && !near; j += 3) for (let i = -6; i <= 6 && !near; i += 3) {
        const ux = Math.floor(((dx + i - box.x) / box.w) * guide.mask.w), uy = Math.floor(((dy + j - box.y) / box.h) * guide.mask.h);
        if (ux >= 0 && uy >= 0 && ux < guide.mask.w && uy < guide.mask.h && guide.mask.v[guide.v][uy * guide.mask.w + ux]) near = 1;
      }
      if (!near && blob[y * rw + x] && gray[py * W + px] > 70) continue; // anything near-black inside the text box is ink
    }
    er[y * rw + x] = 1;
  }
  const er2 = new Uint8Array(rw * rh);
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) if (er[y * rw + x]) for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) {
    const qx = x + i, qy = y + j; if (qx >= 0 && qy >= 0 && qx < rw && qy < rh) er2[qy * rw + qx] = 1;
  }
  fillMasked(data, W, rx, ry, rw, rh, er2);
  return sharp(data, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toBuffer();
}
