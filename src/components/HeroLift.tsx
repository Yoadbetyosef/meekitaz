"use client";
import { useEffect } from "react";

/* Home hero (approved 2026-11-06): her film includes the lift — at the end she raises a flat board straight up. The board's top edge
   was measured frame by frame in advance (EDGES: time → edge height, 0 = top). The next section's look (grid, plus marks, labels,
   "Worn loudly", our M) is printed on the board: anchored to its top edge, it rides up with the board in her hands. When the board
   reaches the top, the print sits exactly where the real section draws it, and the page scrolls itself there (then opens the M).
   Scrolling back up never meets a blank screen: her film rests on her frame. Any user move stops the automation. */
const EDGES: Record<string, [number, number][]> = {"d": [[7.0, 1.0], [7.083, 1.0], [7.167, 1.0], [7.25, 1.0], [7.333, 1.0], [7.417, 1.0], [7.5, 1.0], [7.583, 1.0], [7.667, 0.741], [7.75, 0.704], [7.833, 0.667], [7.917, 0.648], [8.0, 0.611], [8.083, 0.574], [8.167, 0.537], [8.25, 0.481], [8.333, 0.463], [8.417, 0.426], [8.5, 0.407], [8.583, 0.389], [8.667, 0.37], [8.75, 0.333], [8.833, 0.315], [8.917, 0.296], [9.0, 0.259], [9.083, 0.241], [9.167, 0.222], [9.25, 0.204], [9.333, 0.185], [9.417, 0.167], [9.5, 0.148], [9.583, 0.13], [9.667, 0.111], [9.75, 0.093], [9.833, 0.074], [9.917, 0.056], [10.0, 0.037], [10.083, 0.019], [10.167, 0.0], [10.25, 0.0], [10.333, 0.0]], "m": [[7.0, 1.0], [7.083, 1.0], [7.167, 1.0], [7.25, 1.0], [7.333, 1.0], [7.417, 1.0], [7.5, 1.0], [7.583, 1.0], [7.667, 0.782], [7.75, 0.747], [7.833, 0.712], [7.917, 0.682], [8.0, 0.641], [8.083, 0.606], [8.167, 0.565], [8.25, 0.529], [8.333, 0.5], [8.417, 0.465], [8.5, 0.441], [8.583, 0.424], [8.667, 0.4], [8.75, 0.371], [8.833, 0.347], [8.917, 0.324], [9.0, 0.3], [9.083, 0.276], [9.167, 0.253], [9.25, 0.229], [9.333, 0.212], [9.417, 0.188], [9.5, 0.171], [9.583, 0.147], [9.667, 0.124], [9.75, 0.106], [9.833, 0.088], [9.917, 0.071], [10.0, 0.053], [10.083, 0.029], [10.167, 0.012], [10.25, 0.0], [10.333, 0.0]]};
const M_W = 866, M_H = 627;

export default function HeroLift({ mPath }: { mPath: string }) {
  useEffect(() => {
    const phone = window.matchMedia("(max-width:767px)").matches, mode = phone ? "m" : "d";
    const hero = document.querySelector<HTMLElement>(".hero.cover.one"), v = hero?.querySelector<HTMLVideoElement>(".cv-film video");
    if (!hero || !v) return;
    v.loop = false;
    const board = document.createElement("div"); board.className = "mk-board"; board.setAttribute("aria-hidden", "true");
    board.innerHTML = `<div class="mk-board-in"><i class="mkd-grid"></i><i class="mkd-x x1"></i><i class="mkd-x x2"></i><i class="mkd-x x3"></i><i class="mkd-x x4"></i><span class="mkd-lab l1">Meekitaz</span><span class="mkd-lab l2">Est. New York</span><span class="mkd-lab l3">Lab-grown &middot; IGI certified</span><div class="mk-board-hd"><small>Made, not mined</small><h2>Worn loudly.</h2></div><div class="mk-board-m"><svg viewBox="0 0 ${M_W} ${M_H}" fill-rule="evenodd"><path d="${mPath}"/></svg></div></div>`;
    hero.appendChild(board);
    const inner = board.firstElementChild as HTMLElement;
    let moved = false, done = false, raf = 0;
    const stop = () => { moved = true; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.addEventListener(e, stop, { passive: true }));
    const K = EDGES[mode];
    const edge = () => { const t = v.currentTime; if (t < K[0][0]) return 1; for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (t >= a[0] && t <= b[0]) { const u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } } return K[K.length - 1][1]; };
    const box = () => { const r = v.getBoundingClientRect(), h = hero.getBoundingClientRect(); return { y: r.top - h.top, h: r.height }; };
    const handoff = () => {
      done = true; const sec = document.getElementById("film"); if (!sec) return;
      const rest = () => { v.pause(); v.currentTime = 1.0; board.style.top = "100%"; document.body.classList.remove("hero-lift-up"); };
      if (moved || window.scrollY > 40) { rest(); return; }
      const H = window.innerHeight, secTop = sec.offsetTop, openAt = secTop + Math.round((sec.offsetHeight - H) * .86);
      const tween = (to: number, dur: number, ease: (p: number) => number, then?: () => void) => { const y0 = window.scrollY, t0 = performance.now(); const step = (now: number) => { if (moved) { rest(); return; } const p = Math.min(1, (now - t0) / dur); window.scrollTo(0, y0 + (to - y0) * ease(p)); if (p < 1) requestAnimationFrame(step); else if (then) then(); }; requestAnimationFrame(step); };
      const out = (p: number) => 1 - Math.pow(1 - p, 3), inout = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      tween(secTop, 700, out, () => { rest(); window.setTimeout(() => { if (!moved) tween(openAt, 1200, inout); }, 350); });
    };
    const tick = () => {
      if (!done && document.body.classList.contains("hero-film")) {
        const e = edge();
        if (e < 1) { const b = box(); const yv = b.y + e * b.h; board.style.top = Math.max(0, yv) + "px"; inner.style.top = Math.min(0, yv) + "px"; document.body.classList.add("hero-lift-up"); if (yv <= 1 || v.ended) handoff(); }
        else if (v.ended) handoff();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); board.remove(); document.body.classList.remove("hero-lift-up"); };
  }, [mPath]);
  return null;
}
