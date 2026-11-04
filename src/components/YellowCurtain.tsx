"use client";
import { useEffect } from "react";
import Logo from "./Logo";

/* Home (2026-11-03): the page opens on a butter-yellow curtain covering the top three-quarters of the hero, with a huge white Meekitaz
   watermark and nothing else — not even the menu pill. The moment you start to scroll, the menu and bag fade in and the curtain lifts
   away, uncovering the hero photo underneath (which stays put). */
export default function YellowCurtain() {
  useEffect(() => {
    const b = document.body;
    // when the yellow has lifted, the hero's still photo dissolves into the film (computers: the wide film, the watermark and its light
    // on top; phones: the tall film); scrolling back up brings the still back. The film only loads then.
    const film = () => document.querySelector<HTMLVideoElement>(".cover.one .cv-film video");
    { const v = film(); if (v) { const phone0 = window.matchMedia("(max-width:767px)").matches; const want = phone0 ? v.dataset.srcM : v.dataset.src; if (want && !v.getAttribute("src")) { if (phone0 && v.dataset.posterM) v.poster = v.dataset.posterM; v.preload = "auto"; v.src = want; v.load(); } } }
    const phone = window.matchMedia("(max-width:767px)");
    let armed = true;
    // the one-second hold: freezes the page where it is — on computers via overflow, on phones by swallowing the touch and wheel moves
    const block = (e: Event) => e.preventDefault();
    const hold = (minMs: number) => {
      // the page has just landed on the yellow's top edge (native scroll-snap brings it there smoothly, no bounce). Now it stays:
      // touch and wheel are swallowed until the person makes a NEW gesture after the minimum hold
      const start = performance.now();
      let holding = true;
      const release = () => { if (!holding || performance.now() - start < minMs) return; holding = false;
        window.removeEventListener("touchmove", block); window.removeEventListener("wheel", block);
        window.removeEventListener("touchstart", release); window.removeEventListener("wheel", release, true); window.removeEventListener("keydown", release); };
      window.addEventListener("touchmove", block, { passive: false }); window.addEventListener("wheel", block, { passive: false });
      window.addEventListener("touchstart", release, { passive: true }); window.addEventListener("wheel", release, true); window.addEventListener("keydown", release);
    };
    const set = () => {
      const y = window.scrollY, H = window.innerHeight;
      b.classList.toggle("ycur-top", y < 24);
      const v = film(); if (!v) return;
      const Y = H * .75;
      if (y >= Y - 1 && !b.classList.contains("hero-film")) {
        const want = phone.matches ? v.dataset.srcM : v.dataset.src;
        if (want && v.getAttribute("src") !== want) { if (phone.matches && v.dataset.posterM) v.poster = v.dataset.posterM; v.src = want; }
        v.currentTime = 0; v.play().catch(() => {}); b.classList.add("hero-film");
        // a one-second pause on the film (approved 2026-11-04): the page holds here, then the scroll goes on
        if (armed) { armed = false; hold(600); } // held until the next scroll gesture
      }
      else if (y < H * .4 && b.classList.contains("hero-film")) { b.classList.remove("hero-film"); v.pause(); armed = true; }
    };
    set(); window.addEventListener("scroll", set, { passive: true });
    return () => { window.removeEventListener("scroll", set); window.removeEventListener("touchmove", block); window.removeEventListener("wheel", block); b.classList.remove("ycur-top", "hero-film"); document.documentElement.style.overflow = ""; };
  }, []);
  return (<>
    <i className="ycur-snap" aria-hidden="true" />{/* the one snap point: where the yellow's top meets the screen's top */}
    <div className="ycur-panel" aria-hidden="true">
      <div className="ycur-wm"><Logo /></div>
      <span className="ycur-plus ycur-p1" /><span className="ycur-plus ycur-p2" />
      <span className="ycur-qt">Quite the catch.</span>
    </div>
  </>);
}
