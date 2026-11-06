"use client";
import { useEffect } from "react";

/* Home hero (approved 2026-11-06): her film includes the lift — at the end she raises a flat board straight up. The board's top edge
   was measured frame by frame in advance (EDGES: time → edge height, 0 = top). The next section's look (grid, plus marks, labels,
   "Worn loudly", our M) is printed on the board: anchored to its top edge, it rides up with the board in her hands. When the board
   reaches the top, the print sits exactly where the real section draws it, and the page scrolls itself there (then opens the M).
   Scrolling back up never meets a blank screen: her film rests on her frame. Any user move stops the automation. */
const EDGES: Record<string, [number, number][]> = {"d": [[4.0, 1.0], [4.083, 1.0], [4.167, 1.0], [4.25, 1.0], [4.333, 1.0], [4.417, 1.0], [4.5, 1.0], [4.583, 1.0], [4.667, 1.0], [4.75, 1.0], [4.833, 1.0], [4.917, 1.0], [5.0, 1.0], [5.083, 1.0], [5.167, 1.0], [5.25, 1.0], [5.333, 1.0], [5.417, 0.741], [5.5, 0.593], [5.583, 0.481], [5.667, 0.37], [5.75, 0.315], [5.833, 0.204], [5.917, 0.167], [6.0, 0.074], [6.083, 0.037], [6.167, 0.0]], "m": [[7.0, 1.0], [7.083, 1.0], [7.167, 1.0], [7.25, 1.0], [7.333, 1.0], [7.417, 1.0], [7.5, 1.0], [7.583, 1.0], [7.667, 0.782], [7.75, 0.747], [7.833, 0.712], [7.917, 0.682], [8.0, 0.641], [8.083, 0.606], [8.167, 0.565], [8.25, 0.529], [8.333, 0.5], [8.417, 0.465], [8.5, 0.441], [8.583, 0.424], [8.667, 0.4], [8.75, 0.371], [8.833, 0.347], [8.917, 0.324], [9.0, 0.3], [9.083, 0.276], [9.167, 0.253], [9.25, 0.229], [9.333, 0.212], [9.417, 0.188], [9.5, 0.171], [9.583, 0.147], [9.667, 0.124], [9.75, 0.106], [9.833, 0.088], [9.917, 0.071], [10.0, 0.053], [10.083, 0.029], [10.167, 0.012], [10.25, 0.0], [10.333, 0.0]]};
const M_W = 866, M_H = 627;

export default function HeroLift({ mPath }: { mPath: string }) {
  useEffect(() => {
    const phone = window.matchMedia("(max-width:767px)").matches, mode = phone ? "m" : "d";
    const hero = document.querySelector<HTMLElement>(".hero.cover.one"), v = hero?.querySelector<HTMLVideoElement>(".cv-film video");
    if (!hero || !v) return;
    v.loop = false;
    const board = document.createElement("div"); board.className = "mk-board"; board.setAttribute("aria-hidden", "true");
    board.innerHTML = phone ? `<div class="mk-board-in"><i class="mkd-grid"></i><i class="mkd-x x1"></i><i class="mkd-x x2"></i><i class="mkd-x x3"></i><i class="mkd-x x4"></i><span class="mkd-lab l1">Meekitaz</span><span class="mkd-lab l2">Est. New York</span><span class="mkd-lab l3">Lab-grown &middot; IGI certified</span><div class="mk-board-hd"><small>Made, not mined</small><h2>Worn loudly.</h2></div><div class="mk-board-m"><svg viewBox="0 0 ${M_W} ${M_H}" fill-rule="evenodd"><path d="${mPath}"/></svg></div></div>`
      : `<div class="mk-board-in"><video class="mk-board-dance" muted playsinline preload="auto" src="/media/dancer.mp4"></video></div>`; // computers: only the dancer, full-bleed
    hero.appendChild(board);
    const dancer = board.querySelector<HTMLVideoElement>(".mk-board-dance"); let dancing = false;
    const inner = board.firstElementChild as HTMLElement;
    let moved = false, done = false, raf = 0;
    const stop = () => { moved = true; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.addEventListener(e, stop, { passive: true }));
    const K = EDGES[mode];
    if (!phone) { const d2 = document.getElementById("fun-dance") as HTMLVideoElement | null; if (d2 && !d2.getAttribute("src")) { d2.src = "/media/dancer.mp4"; d2.preload = "auto"; d2.load(); } }
    const edge = () => { const t = v.currentTime; if (t < K[0][0]) return 1; for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (t >= a[0] && t <= b[0]) { const u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } } return K[K.length - 1][1]; };
    const box = () => { const r = v.getBoundingClientRect(), h = hero.getBoundingClientRect(); return { y: r.top - h.top, h: r.height }; };
    let switching = false;
    const handoff = () => {
      done = true; const sec = document.getElementById(phone ? "film" : "fun"); if (!sec) return;
      if (!phone) {
        // the section's copy of the dancer must show the SAME moment as the board's copy before the switch: keep syncing it every frame,
        // switch as soon as it is in step (or after 1.5s at most) — never a restart, never a jump back
        const d2 = document.getElementById("fun-dance") as HTMLVideoElement | null;
        if (d2 && dancer) {
          if (!d2.getAttribute("src")) { d2.src = "/media/dancer.mp4"; d2.preload = "auto"; d2.load(); }
          d2.muted = true; switching = true; const t0 = performance.now();
          const sync = () => {
            if (!switching) return;
            const want = dancer.currentTime; if (Math.abs(d2.currentTime - want) > .12) { try { d2.currentTime = want; } catch {} }
            if (d2.paused) d2.play().catch(() => {});
            const inStep = d2.readyState >= 3 && Math.abs(d2.currentTime - dancer.currentTime) <= .12;
            if (inStep || performance.now() - t0 > 1500) { switching = false; finish(); } else requestAnimationFrame(sync);
          };
          requestAnimationFrame(sync); return;
        }
      }
      finish();
    };
    const finish = () => {
      const sec = document.getElementById(phone ? "film" : "fun"); if (!sec) return;
      const rest = () => { v.pause(); v.currentTime = 1.0; board.style.top = "100%"; document.body.classList.remove("hero-lift-up"); armBack(); };
      if (moved || window.scrollY > 40) { rest(); return; }
      const H = window.innerHeight, secTop = sec.offsetTop, openAt = secTop + Math.round((sec.offsetHeight - H) * .86);
      const tween = (to: number, dur: number, ease: (p: number) => number, then?: () => void) => { const y0 = window.scrollY, t0 = performance.now(); const step = (now: number) => { if (moved) { rest(); return; } const p = Math.min(1, (now - t0) / dur); window.scrollTo(0, y0 + (to - y0) * ease(p)); if (p < 1) requestAnimationFrame(step); else if (then) then(); }; requestAnimationFrame(step); };
      const out = (p: number) => 1 - Math.pow(1 - p, 3), inout = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      // the board already IS the page: no second rise. Jump to the real section in one frame (it looks identical), then open the M.
      void out; window.scrollTo(0, secTop); rest(); if (phone) window.setTimeout(() => { if (!moved) tween(openAt, 1200, inout); }, 450);
    };
    // after the hand-off: when the hero comes back into view, her film plays again from the start (looping), the board rides up again
    // with the dancer — but nothing scrolls the page any more; the person is in charge
    let back = false;
    const armBack = () => { if (back) return; back = true;
      const onScroll = () => { if (window.scrollY < window.innerHeight * .5) { window.removeEventListener("scroll", onScroll); done = false; dancing = false; moved = true; v.loop = true; v.currentTime = 0; v.play().catch(() => {}); if (dancer) { dancer.pause(); dancer.currentTime = 0; } back = false; } };
      window.addEventListener("scroll", onScroll, { passive: true }); };
    const tick = () => {
      if (!done && document.body.classList.contains("hero-film")) {
        const e = edge();
        if (v.currentTime < .5 && dancing) { dancing = false; board.style.top = "100%"; document.body.classList.remove("hero-lift-up"); if (dancer) { dancer.pause(); dancer.currentTime = 0; } }
        if (e < 1) { const b = box(); const yv = b.y + e * b.h; board.style.top = Math.max(0, yv) + "px"; inner.style.top = Math.min(0, yv) + "px"; document.body.classList.add("hero-lift-up");
          if (dancer && !dancing) { dancing = true; dancer.currentTime = 0; dancer.play().catch(() => {}); } if (yv <= 1 || v.ended) handoff(); }
        else if (v.ended) handoff();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); board.remove(); document.body.classList.remove("hero-lift-up"); };
  }, [mPath]);
  return null;
}
