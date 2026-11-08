"use client";
import { useEffect } from "react";

/* Home hero (2026-11-06). Her film ends with her lifting a flat board straight up; the board's top edge was measured frame by frame
   (EDGES). COMPUTERS: when the board reaches the top, the page jumps to the next section (same colour) and starts the dancer there
   (FunSection) — a plain cut, nothing rides up. Scrolling earlier just brings that section up the normal way and starts her.
   PHONES: the next section's look is printed on the board while it rises. Scrolling back up replays her film (looping). */
const EDGES: Record<string, [number, number][]> = {"d": [[0.917, 1.0], [1.0, 1.0], [1.083, 1.0], [1.167, 1.0], [1.25, 1.0], [1.333, 1.0], [1.417, 1.0], [1.5, 0.685], [1.583, 0.593], [1.667, 0.444], [1.75, 0.389], [1.833, 0.278], [1.917, 0.204], [2.0, 0.13], [2.083, 0.074], [2.167, 0.0], [2.25, 0.0]], "m": [[0.917, 1.0], [1.0, 1.0], [1.083, 1.0], [1.167, 1.0], [1.25, 1.0], [1.333, 1.0], [1.417, 1.0], [1.5, 0.75], [1.583, 0.646], [1.667, 0.5], [1.75, 0.427], [1.833, 0.323], [1.917, 0.25], [2.0, 0.167], [2.083, 0.104], [2.167, 0.031], [2.25, 0.0]]};
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
    // (the printed board is retired: phones follow the same flow as computers now, 2026-11-06)
    let done = false, lifting = false, raf = 0, armed = false, moved = false, armedAt = 0;
    const stop = () => { moved = true; }; ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.addEventListener(e, stop, { passive: true }));
    const edge = () => { const t = v.currentTime; if (t < K[0][0]) return 1; for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (t >= a[0] && t <= b[0]) { const u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } } return K[K.length - 1][1]; };
    const resetLift = () => { lifting = false; board.style.top = "100%"; document.body.classList.remove("hero-lift-up"); };
    const armBack = () => { if (armed) return; armed = true; armedAt = performance.now(); const onScroll = () => { if (!armedAt || performance.now() - armedAt < 800) return; if (window.scrollY < window.innerHeight * .5) { window.removeEventListener("scroll", onScroll); armed = false; done = false; resetLift(); v.loop = true; v.currentTime = 0; v.play().catch(() => {}); } }; window.addEventListener("scroll", onScroll, { passive: true }); };
    const handoff = () => {
      done = true;
      const sec = document.getElementById("fun"); if (!sec) { armBack(); return; }
      if (window.scrollY > 40) { armBack(); return; } // the person already scrolled on: leave it
      const secTop = sec.offsetTop;
      (sec as HTMLElement & { __start?: () => void }).__start?.(); // the dancer appears on the page — a cut
      window.scrollTo({ top: secTop, behavior: "instant" as ScrollBehavior }); // one frame, no sliding — the section is the same colour
      v.pause(); v.currentTime = 1.0; resetLift();
      armBack();
    };
    const tick = () => {
      if (!done && document.body.classList.contains("hero-film")) {
        if (v.currentTime < .5 && lifting) resetLift();
        const e = edge();
        if (e < 1) {
          lifting = true; document.body.classList.add("hero-lift-up");
          if (e <= .005 || v.ended) handoff();
        } else if (v.ended) handoff();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); board.remove(); document.body.classList.remove("hero-lift-up"); };
  }, [mPath]);
  return null;
}
