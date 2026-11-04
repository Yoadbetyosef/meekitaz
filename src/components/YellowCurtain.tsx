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
    const phone = window.matchMedia("(max-width:767px)");
    let armed = true;
    // the one-second hold: freezes the page where it is — on computers via overflow, on phones by swallowing the touch and wheel moves
    const block = (e: Event) => e.preventDefault();
    const hold = (ms: number) => {
      // a hard stop, also against a strong flick on iPhone: for the whole second the page is pushed back to the same spot on every
      // frame (which kills the momentum), and finger/wheel moves are swallowed
      const y = window.scrollY, until = performance.now() + ms;
      window.addEventListener("touchmove", block, { passive: false }); window.addEventListener("wheel", block, { passive: false });
      document.documentElement.style.overflow = "hidden";
      const pin = () => {
        if (window.scrollY !== y) window.scrollTo(0, y);
        if (performance.now() < until) requestAnimationFrame(pin);
        else { document.documentElement.style.overflow = ""; window.removeEventListener("touchmove", block); window.removeEventListener("wheel", block); }
      };
      requestAnimationFrame(pin);
    };
    const set = () => {
      const y = window.scrollY, H = window.innerHeight;
      b.classList.toggle("ycur-top", y < 24);
      const v = film(); if (!v) return;
      if (y >= H * .75 - 1 && !b.classList.contains("hero-film")) {
        const want = phone.matches ? v.dataset.srcM : v.dataset.src;
        if (want && v.getAttribute("src") !== want) { if (phone.matches && v.dataset.posterM) v.poster = v.dataset.posterM; v.src = want; }
        v.currentTime = 0; v.play().catch(() => {}); b.classList.add("hero-film");
        // a one-second pause on the film (approved 2026-11-04): the page holds here, then the scroll goes on
        if (armed) { armed = false; hold(1000); } // no snap-back: the page simply holds where it is
      }
      else if (y < H * .4 && b.classList.contains("hero-film")) { b.classList.remove("hero-film"); v.pause(); armed = true; }
    };
    set(); window.addEventListener("scroll", set, { passive: true });
    return () => { window.removeEventListener("scroll", set); window.removeEventListener("touchmove", block); window.removeEventListener("wheel", block); b.classList.remove("ycur-top", "hero-film"); document.documentElement.style.overflow = ""; };
  }, []);
  return (
    <div className="ycur-panel" aria-hidden="true">
      <div className="ycur-wm"><Logo /></div>
      <span className="ycur-plus ycur-p1" /><span className="ycur-plus ycur-p2" />
      <span className="ycur-qt">Quite the catch.</span>
    </div>
  );
}
