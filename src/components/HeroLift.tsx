"use client";
import { useEffect } from "react";

/* Home hero (2026-11-06). Her film ends with her lifting a flat board straight up; the board's top edge was measured frame by frame
   (EDGES). COMPUTERS: when the board reaches the top, the page jumps to the next section (same colour) and starts the dancer there
   (FunSection) — a plain cut, nothing rides up. Scrolling earlier just brings that section up the normal way and starts her.
   PHONES: the next section's look is printed on the board while it rises. Scrolling back up replays her film (looping). */
const EDGES: Record<string, [number, number][]> = {"d": [[4.0, 1.0], [4.083, 1.0], [4.167, 1.0], [4.25, 1.0], [4.333, 1.0], [4.417, 1.0], [4.5, 1.0], [4.583, 1.0], [4.667, 1.0], [4.75, 1.0], [4.833, 1.0], [4.917, 1.0], [5.0, 1.0], [5.083, 1.0], [5.167, 1.0], [5.25, 1.0], [5.333, 1.0], [5.417, 0.741], [5.5, 0.593], [5.583, 0.481], [5.667, 0.37], [5.75, 0.315], [5.833, 0.204], [5.917, 0.167], [6.0, 0.074], [6.083, 0.037], [6.167, 0.0]], "m": [[7.0, 1.0], [7.083, 1.0], [7.167, 1.0], [7.25, 1.0], [7.333, 1.0], [7.417, 1.0], [7.5, 1.0], [7.583, 1.0], [7.667, 0.782], [7.75, 0.747], [7.833, 0.712], [7.917, 0.682], [8.0, 0.641], [8.083, 0.606], [8.167, 0.565], [8.25, 0.529], [8.333, 0.5], [8.417, 0.465], [8.5, 0.441], [8.583, 0.424], [8.667, 0.4], [8.75, 0.371], [8.833, 0.347], [8.917, 0.324], [9.0, 0.3], [9.083, 0.276], [9.167, 0.253], [9.25, 0.229], [9.333, 0.212], [9.417, 0.188], [9.5, 0.171], [9.583, 0.147], [9.667, 0.124], [9.75, 0.106], [9.833, 0.088], [9.917, 0.071], [10.0, 0.053], [10.083, 0.029], [10.167, 0.012], [10.25, 0.0], [10.333, 0.0]]};
const M_W = 866, M_H = 627;

export default function HeroLift({ mPath }: { mPath: string }) {
  useEffect(() => {
    const phone = window.matchMedia("(max-width:767px)").matches, mode = phone ? "m" : "d";
    const hero = document.querySelector<HTMLElement>(".hero.cover.one"), v = hero?.querySelector<HTMLVideoElement>(".cv-film video");
    if (!hero || !v) return;
    v.loop = false;
    const K = EDGES[mode];
    const board = document.createElement("div"); board.className = "mk-board"; board.setAttribute("aria-hidden", "true");
    board.innerHTML = `<div class="mk-board-in"><i class="mkd-grid"></i><i class="mkd-x x1"></i><i class="mkd-x x2"></i><i class="mkd-x x3"></i><i class="mkd-x x4"></i><span class="mkd-lab l1">Meekitaz</span><span class="mkd-lab l2">Est. New York</span><span class="mkd-lab l3">Lab-grown &middot; IGI certified</span><div class="mk-board-hd"><small>Made, not mined</small><h2>Worn loudly.</h2></div><div class="mk-board-m"><svg viewBox="0 0 ${M_W} ${M_H}" fill-rule="evenodd"><path d="${mPath}"/></svg></div></div>`;
    if (phone) hero.appendChild(board);
    const inner = board.firstElementChild as HTMLElement;
    let done = false, lifting = false, raf = 0, armed = false, moved = false;
    const stop = () => { moved = true; }; ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.addEventListener(e, stop, { passive: true }));
    const edge = () => { const t = v.currentTime; if (t < K[0][0]) return 1; for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (t >= a[0] && t <= b[0]) { const u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } } return K[K.length - 1][1]; };
    const box = () => { const r = v.getBoundingClientRect(), h = hero.getBoundingClientRect(); return { y: r.top - h.top, h: r.height }; };
    const resetLift = () => { lifting = false; board.style.top = "100%"; document.body.classList.remove("hero-lift-up"); };
    const armBack = () => { if (armed) return; armed = true; const onScroll = () => { if (window.scrollY < window.innerHeight * .5) { window.removeEventListener("scroll", onScroll); armed = false; done = false; resetLift(); v.loop = true; v.currentTime = 0; v.play().catch(() => {}); } }; window.addEventListener("scroll", onScroll, { passive: true }); };
    const handoff = () => {
      done = true;
      const sec = document.getElementById(phone ? "film" : "fun"); if (!sec) { armBack(); return; }
      if (window.scrollY > 40 || (phone && moved)) { armBack(); return; } // the person already scrolled on: leave it
      const H = window.innerHeight, secTop = sec.offsetTop;
      if (!phone) (sec as HTMLElement & { __start?: () => void }).__start?.(); // the dancer appears on the page — a cut
      window.scrollTo(0, secTop);
      v.pause(); v.currentTime = 1.0; resetLift();
      if (phone) { const openAt = secTop + Math.round((sec.offsetHeight - H) * .86), inout = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; window.setTimeout(() => { if (moved) return; const y0 = window.scrollY, t0 = performance.now(); const step = (now: number) => { if (moved) return; const p = Math.min(1, (now - t0) / 1200); window.scrollTo(0, y0 + (openAt - y0) * inout(p)); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, 450); }
      armBack();
    };
    const tick = () => {
      if (!done && document.body.classList.contains("hero-film")) {
        if (v.currentTime < .5 && lifting) resetLift();
        const e = edge();
        if (e < 1) {
          lifting = true; document.body.classList.add("hero-lift-up");
          if (phone) { const b = box(); const yv = b.y + e * b.h; board.style.top = Math.max(0, yv) + "px"; inner.style.top = Math.min(0, yv) + "px"; if (yv <= 1 || v.ended) handoff(); }
          else if (e <= .005 || v.ended) handoff();
        } else if (v.ended) handoff();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); board.remove(); document.body.classList.remove("hero-lift-up"); };
  }, [mPath]);
  return null;
}
