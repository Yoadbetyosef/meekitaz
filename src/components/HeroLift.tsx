"use client";
import { useEffect } from "react";

/* Home hero (2026-11-06). Her film ends with her lifting a flat board straight up; the board's top edge was measured frame by frame
   (EDGES). COMPUTERS: ONE dancer film, fixed over the page, clipped to the board while it rises (so she is "on" the board), unclipped
   when the board reaches the top — the page jumps to the next section (same colour) and she keeps dancing on it; when she leaves, the
   line fills in. PHONES: the next section's look is printed on the board instead. Any user move stops the automation; scrolling back
   up replays her film (looping) with the board; the person is in charge. */
const EDGES: Record<string, [number, number][]> = {"d": [[4.0, 1.0], [4.083, 1.0], [4.167, 1.0], [4.25, 1.0], [4.333, 1.0], [4.417, 1.0], [4.5, 1.0], [4.583, 1.0], [4.667, 1.0], [4.75, 1.0], [4.833, 1.0], [4.917, 1.0], [5.0, 1.0], [5.083, 1.0], [5.167, 1.0], [5.25, 1.0], [5.333, 1.0], [5.417, 0.741], [5.5, 0.593], [5.583, 0.481], [5.667, 0.37], [5.75, 0.315], [5.833, 0.204], [5.917, 0.167], [6.0, 0.074], [6.083, 0.037], [6.167, 0.0]], "m": [[7.0, 1.0], [7.083, 1.0], [7.167, 1.0], [7.25, 1.0], [7.333, 1.0], [7.417, 1.0], [7.5, 1.0], [7.583, 1.0], [7.667, 0.782], [7.75, 0.747], [7.833, 0.712], [7.917, 0.682], [8.0, 0.641], [8.083, 0.606], [8.167, 0.565], [8.25, 0.529], [8.333, 0.5], [8.417, 0.465], [8.5, 0.441], [8.583, 0.424], [8.667, 0.4], [8.75, 0.371], [8.833, 0.347], [8.917, 0.324], [9.0, 0.3], [9.083, 0.276], [9.167, 0.253], [9.25, 0.229], [9.333, 0.212], [9.417, 0.188], [9.5, 0.171], [9.583, 0.147], [9.667, 0.124], [9.75, 0.106], [9.833, 0.088], [9.917, 0.071], [10.0, 0.053], [10.083, 0.029], [10.167, 0.012], [10.25, 0.0], [10.333, 0.0]]};
const M_W = 866, M_H = 627;

export default function HeroLift({ mPath }: { mPath: string }) {
  useEffect(() => {
    const phone = window.matchMedia("(max-width:767px)").matches, mode = phone ? "m" : "d";
    const hero = document.querySelector<HTMLElement>(".hero.cover.one"), v = hero?.querySelector<HTMLVideoElement>(".cv-film video");
    if (!hero || !v) return;
    v.loop = false;
    const K = EDGES[mode];
    // phones: the printed look on the board
    const board = document.createElement("div"); board.className = "mk-board"; board.setAttribute("aria-hidden", "true");
    board.innerHTML = `<div class="mk-board-in"><i class="mkd-grid"></i><i class="mkd-x x1"></i><i class="mkd-x x2"></i><i class="mkd-x x3"></i><i class="mkd-x x4"></i><span class="mkd-lab l1">Meekitaz</span><span class="mkd-lab l2">Est. New York</span><span class="mkd-lab l3">Lab-grown &middot; IGI certified</span><div class="mk-board-hd"><small>Made, not mined</small><h2>Worn loudly.</h2></div><div class="mk-board-m"><svg viewBox="0 0 ${M_W} ${M_H}" fill-rule="evenodd"><path d="${mPath}"/></svg></div></div>`;
    if (phone) hero.appendChild(board);
    const inner = board.firstElementChild as HTMLElement;
    // computers: the one dancer, fixed over the page
    let dancer: HTMLVideoElement | null = null;
    if (!phone) { dancer = document.createElement("video"); dancer.className = "mk-dancer"; dancer.muted = true; dancer.playsInline = true; dancer.preload = "auto"; dancer.src = "/media/dancer.mp4"; dancer.setAttribute("aria-hidden", "true"); dancer.load(); document.body.appendChild(dancer); }
    let moved = false, done = false, dancing = false, raf = 0, armed = false;
    const stop = () => { moved = true; };
    ["keydown", "pointerdown"].forEach(e => window.addEventListener(e, stop, { passive: true }));
    const nudge = (e: Event) => {
      const down = e.type === "wheel" ? (e as WheelEvent).deltaY > 0 : true;
      if (!done && !dancing && down && document.body.classList.contains("hero-film") && window.scrollY < 40 && v.currentTime < K[0][0]) { v.currentTime = K[0][0] - .05; v.play().catch(() => {}); if (e.cancelable) e.preventDefault(); return; }
      if (done || dancing) moved = true;
    };
    window.addEventListener("wheel", nudge, { passive: false }); window.addEventListener("touchmove", nudge, { passive: false });
    const edge = () => { const t = v.currentTime; if (t < K[0][0]) return 1; for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (t >= a[0] && t <= b[0]) { const u = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * u; } } return K[K.length - 1][1]; };
    const box = () => { const r = v.getBoundingClientRect(), h = hero.getBoundingClientRect(); return { y: r.top - h.top, h: r.height }; };
    const resetLift = () => { dancing = false; board.style.top = "100%"; document.body.classList.remove("hero-lift-up", "dancer-on", "dancer-gone"); if (dancer) { dancer.pause(); dancer.currentTime = 0; dancer.style.clipPath = "inset(100% 0 0 0)"; } };
    // after the hand-off: when the hero is back in view, her film plays again (looping) with the board — nothing scrolls by itself any more
    const armBack = () => { if (armed) return; armed = true; const onScroll = () => { if (window.scrollY < window.innerHeight * .5) { window.removeEventListener("scroll", onScroll); armed = false; done = false; moved = true; resetLift(); v.loop = true; v.currentTime = 0; v.play().catch(() => {}); } }; window.addEventListener("scroll", onScroll, { passive: true }); };
    const handoff = () => {
      done = true;
      const sec = document.getElementById(phone ? "film" : "fun"); if (!sec) { armBack(); return; }
      const H = window.innerHeight, secTop = sec.offsetTop;
      if (moved || window.scrollY > 40) { // the person has taken over: leave the dancer on the page, no scrolling
        if (dancer) dancer.style.clipPath = "inset(0 0 0 0)"; armBack(); return; }
      if (dancer) dancer.style.clipPath = "inset(0 0 0 0)"; // she is on the whole page now
      window.scrollTo(0, secTop); // the section has the same colour: the jump is invisible; the dancer (fixed) carries on untouched
      v.pause(); v.currentTime = 1.0; board.style.top = "100%"; document.body.classList.remove("hero-lift-up");
      if (phone) { const openAt = secTop + Math.round((sec.offsetHeight - H) * .86), inout = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; window.setTimeout(() => { if (moved) return; const y0 = window.scrollY, t0 = performance.now(); const step = (now: number) => { if (moved) return; const p = Math.min(1, (now - t0) / 1200); window.scrollTo(0, y0 + (openAt - y0) * inout(p)); if (p < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); }, 450); }
      armBack();
    };
    const tick = () => {
      if (document.body.classList.contains("hero-film")) {
        if (!done) {
          if (v.currentTime < .5 && dancing) resetLift(); // her film looped: the board starts over
          const e = edge();
          if (e < 1) {
            const b = box(); const yv = b.y + e * b.h;
            if (!dancing) { dancing = true; document.body.classList.add("dancer-on"); if (dancer) { dancer.currentTime = 0; dancer.play().catch(() => {}); } }
            document.body.classList.add("hero-lift-up");
            if (phone) { board.style.top = Math.max(0, yv) + "px"; inner.style.top = Math.min(0, yv) + "px"; }
            else if (dancer) dancer.style.clipPath = `inset(${Math.max(0, yv)}px 0 0 0)`; // the dancer shows only on the board
            if (yv <= 1 || v.ended) handoff();
          } else if (v.ended) handoff();
        }
      }
      if (dancer && dancing && (dancer.ended || (dancer.duration > 0 && dancer.currentTime >= dancer.duration - .25))) document.body.classList.add("dancer-gone");
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); ["keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); window.removeEventListener("wheel", nudge); window.removeEventListener("touchmove", nudge); board.remove(); dancer?.remove(); document.body.classList.remove("hero-lift-up", "dancer-on", "dancer-gone"); };
  }, [mPath]);
  return null;
}
