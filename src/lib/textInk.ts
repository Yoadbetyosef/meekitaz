// Server-only (plain typed arrays; the caller decodes with sharp).
type Comp = { id: number; minx: number; maxx: number; miny: number; maxy: number; cnt: number; cx: number; cy: number; w: number; h: number };
type Line = { s: Comp[]; th: number; len: number };
/** Engraved text as a generic shape: a run of small dark glyph-like blobs lying in a line on a smooth metal surface, at any angle.
 *  Found and painted out in place (returns false when nothing was found). Works for any metal colour; coloured stones and white diamonds are left alone. */
export function cleanTextInk(data: Buffer, W: number, H: number): boolean {
  const N = W * H, gray = new Float32Array(N);
  for (let i = 0; i < N; i++) gray[i] = 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
  // local background = box mean of a 31px window (integral image)
  const R = 15, ii = new Float64Array((W + 1) * (H + 1));
  for (let y = 1; y <= H; y++) { let row = 0; for (let x = 1; x <= W; x++) { row += gray[(y - 1) * W + x - 1]; ii[y * (W + 1) + x] = ii[(y - 1) * (W + 1) + x] + row; } }
  const mean = (x: number, y: number) => { const x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(W, x + R + 1), y1 = Math.min(H, y + R + 1);
    return (ii[y1 * (W + 1) + x1] - ii[y0 * (W + 1) + x1] - ii[y1 * (W + 1) + x0] + ii[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0)); };
  const ink = new Uint8Array(N), bgm = new Float32Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, m = mean(x, y); bgm[i] = m;
    if (m > 70 && m < 235 && gray[i] < m - 20 && gray[i] < 190) { const r = data[i * 3], gg = data[i * 3 + 1], b = data[i * 3 + 2]; if (b <= r + 10 && gg <= r + 10 && r - gg <= 60) ink[i] = 1; } }
  // connected components (4-neigh) of ink
  const lab = new Int32Array(N); const comps: Comp[] = []; const st = new Int32Array(N);
  for (let i = 0; i < N; i++) { if (!ink[i] || lab[i]) continue; let n = 0, k = 0; st[n++] = i; lab[i] = comps.length + 1;
    let minx = W, maxx = 0, miny = H, maxy = 0, cnt = 0, sx = 0, sy = 0;
    while (k < n) { const p = st[k++]; const x = p % W, y = (p - x) / W; cnt++; sx += x; sy += y; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      const nb = [p - 1, p + 1, p - W, p + W]; for (const q of nb) { if (q < 0 || q >= N) continue; if ((q === p - 1 && x === 0) || (q === p + 1 && x === W - 1)) continue; if (ink[q] && !lab[q]) { lab[q] = lab[i]; st[n++] = q; } } }
    comps.push({ id: comps.length + 1, minx, maxx, miny, maxy, cnt, cx: sx / cnt, cy: sy / cnt, w: maxx - minx + 1, h: maxy - miny + 1 }); }
  // glyph-sized components only
  const sc = W / 1000;
  const g = comps.filter(c => c.h >= 2 * sc && c.h <= 42 * sc && c.w <= 60 * sc && c.cnt >= 2 * sc && c.cnt <= 900 * sc * sc);
  // greedy line clustering: for each glyph, gather glyphs with similar height whose centre lies near the line through this glyph at angle in [-45,45]
  const used = new Set<number>(); const lines: Line[] = [];
  g.sort((a, b) => a.cx - b.cx);
  for (const a of g) { if (used.has(a.id)) continue;
    let best: Line | null = null;
    for (let th = -45; th <= 45; th += 5) { const t = th * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t), nx = -uy, ny = ux;
      const run = g.filter(b => !used.has(b.id) && Math.abs(b.h - a.h) <= Math.max(3 * sc, a.h * 0.9) && Math.abs((b.cx - a.cx) * nx + (b.cy - a.cy) * ny) <= Math.max(3 * sc, a.h * 0.6));
      if (run.length < 4) continue;
      run.sort((p, q) => ((p.cx - a.cx) * ux + (p.cy - a.cy) * uy) - ((q.cx - a.cx) * ux + (q.cy - a.cy) * uy));
      // split on big gaps along the line
      let seg: Comp[] = [run[0]];
      const segs: Comp[][] = [];
      for (let i = 1; i < run.length; i++) { const d = ((run[i].cx - run[i - 1].cx) * ux + (run[i].cy - run[i - 1].cy) * uy) - (run[i - 1].w + run[i].w) / 2; if (d > 1.1 * a.h) { segs.push(seg); seg = []; } seg.push(run[i]); }
      segs.push(seg);
      for (const s of segs) { if (s.length < (a.h < 5 * sc ? 7 : a.h < 7 * sc ? 4 : 5) || !s.includes(a)) continue; const len = ((s[s.length - 1].cx - s[0].cx) * ux + (s[s.length - 1].cy - s[0].cy) * uy) + (s[0].w + s[s.length - 1].w) / 2;
        if (len < 3 * a.h || len > 30 * a.h || len > 0.45 * W) continue; if (!best || s.length > best.s.length) best = { s, th, len }; } }
    if (best) { best.s.forEach(b => used.add(b.id)); lines.push(best); } }
  // colour guard: most of the pixels right around the glyphs must be metal (warm or grey, not white, not a blue/pink stone)
  const keep = lines.filter(L => { let ok = 0, n = 0; const h = Math.max(2, L.s[0].h); for (const c of L.s) { for (let dy = -h; dy <= h; dy += Math.max(1, Math.round(h / 2))) for (let dx = -h; dx <= h; dx += Math.max(1, Math.round(h / 2))) { const x = Math.round(c.cx + dx), y = Math.round(c.cy + dy); if (x < 0 || y < 0 || x >= W || y >= H) continue; const i = y * W + x; if (ink[i]) continue; const r = data[i * 3], gg = data[i * 3 + 1], b = data[i * 3 + 2], lum = 0.299 * r + 0.587 * gg + 0.114 * b; n++; if (b <= r + 12 && lum > 60 && lum < 240) ok++; } }
    return n > 0 && ok / n >= 0.6; });
  // surface check: between the glyphs the surface must be smooth metal (a band), not the busy facets of a stone or a prong edge
  const boxOf = (L: Line) => { const t = L.th * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t), nx = -uy, ny = ux; const a = L.s[0], hs = L.s.map(c => c.h).sort((p, q) => p - q), h = hs[hs.length >> 1];
    let lo = Infinity, hi = -Infinity, plo = Infinity, phi = -Infinity;
    for (const c of L.s) for (const [px, py] of [[c.minx, c.miny], [c.maxx, c.miny], [c.minx, c.maxy], [c.maxx, c.maxy]]) { const u = (px - a.cx) * ux + (py - a.cy) * uy, v = (px - a.cx) * nx + (py - a.cy) * ny; if (u < lo) lo = u; if (u > hi) hi = u; if (c.h >= 0.6 * h && c.h <= 1.5 * h) { if (v < plo) plo = v; if (v > phi) phi = v; } }
    if (!isFinite(plo)) { plo = -h / 2; phi = h / 2; }
    return { ux, uy, nx, ny, a, h, lo, hi, plo, phi }; };
  const inBox = (B: ReturnType<typeof boxOf>, x: number, y: number, padU: number, padV: number) => { const u = (x - B.a.cx) * B.ux + (y - B.a.cy) * B.uy, v = (x - B.a.cx) * B.nx + (y - B.a.cy) * B.ny; return u >= B.lo - padU && u <= B.hi + padU && v >= B.plo - padV && v <= B.phi + padV; };
  const keep2 = keep.filter(L => { const B = boxOf(L); const h = B.h; let n = 0, bad = 0, inkN = 0, tot = 0;
    const x0 = Math.max(0, Math.floor(Math.min(...L.s.map(c => c.minx)) - 2 * h)), x1 = Math.min(W - 1, Math.ceil(Math.max(...L.s.map(c => c.maxx)) + 2 * h)), y0 = Math.max(0, Math.floor(Math.min(...L.s.map(c => c.miny)) - 2 * h)), y1 = Math.min(H - 1, Math.ceil(Math.max(...L.s.map(c => c.maxy)) + 2 * h));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!inBox(B, x, y, 0.5 * h, 0.3 * h)) continue; const i = y * W + x; tot++; if (ink[i]) { inkN++; continue; } n++; const r = data[i * 3], gg = data[i * 3 + 1], b = data[i * 3 + 2]; if ((r > 236 && gg > 236 && b > 228) || b > r + 10 || gg > r + 10 || r - gg > 60) bad++; }
    if (!tot || !n) return false; const dens = inkN / tot, badf = bad / n;
            
        const fill = L.s.reduce((p, c) => p + c.cnt / (c.w * c.h), 0) / L.s.length; // round pavé stones fill their box; letters do not
    return badf < 0.12 && dens >= 0.05 && dens <= 0.6 && (h < 5 * sc || fill < 0.66); });
  keep.length = 0; keep.push(...keep2);
  if (!keep.length) return false;
  // paint: inside each line's rotated box, every pixel darker than its surroundings (the strokes we did not catch as blobs too)
  const mask = new Uint8Array(N);
  for (const L of keep) { const t = L.th * Math.PI / 180, ux = Math.cos(t), uy = Math.sin(t), nx = -uy, ny = ux; const a = L.s[0], h = Math.max(...L.s.map(c => c.h));
    let lo = Infinity, hi = -Infinity, plo = Infinity, phi = -Infinity;
    for (const c of L.s) { for (const [px, py] of [[c.minx, c.miny], [c.maxx, c.miny], [c.minx, c.maxy], [c.maxx, c.maxy]]) { const u = (px - a.cx) * ux + (py - a.cy) * uy, v = (px - a.cx) * nx + (py - a.cy) * ny; if (u < lo) lo = u; if (u > hi) hi = u; if (v < plo) plo = v; if (v > phi) phi = v; } }
    lo -= 1.2 * h; hi += 1.2 * h; plo -= 0.5 * h; phi += 0.5 * h;
    const x0 = Math.max(0, Math.floor(Math.min(...L.s.map(c => c.minx)) - 2 * h)), x1 = Math.min(W - 1, Math.ceil(Math.max(...L.s.map(c => c.maxx)) + 2 * h)), y0 = Math.max(0, Math.floor(Math.min(...L.s.map(c => c.miny)) - 2 * h)), y1 = Math.min(H - 1, Math.ceil(Math.max(...L.s.map(c => c.maxy)) + 2 * h));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const u = (x - a.cx) * ux + (y - a.cy) * uy, v = (x - a.cx) * nx + (y - a.cy) * ny; if (u < lo || u > hi || v < plo || v > phi) continue; const i = y * W + x; const r = data[i * 3], gg = data[i * 3 + 1], b = data[i * 3 + 2]; if (gray[i] < bgm[i] - 10 && b <= r + 10 && gg <= r + 10 && r - gg <= 60) { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) mask[yy * W + xx] = 1; } } } }
  const out = data;
  for (let pass = 0; pass < 2; pass++) { const src = Buffer.from(out);
    for (let i = 0; i < N; i++) { if (!mask[i]) continue; const x = i % W, y = (i - x) / W; let sr = 0, sg = 0, sb = 0, sw = 0;
      for (let dy = -9; dy <= 9; dy++) for (let dx = -9; dx <= 9; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const j = yy * W + xx; if (mask[j] && pass === 0) continue; const w = 1 / (1 + dx * dx + dy * dy); sr += src[j * 3] * w; sg += src[j * 3 + 1] * w; sb += src[j * 3 + 2] * w; sw += w; }
      if (sw > 0) { out[i * 3] = sr / sw; out[i * 3 + 1] = sg / sw; out[i * 3 + 2] = sb / sw; } } }
  return true;
}
