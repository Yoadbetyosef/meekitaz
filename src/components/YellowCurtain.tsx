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
    const preload = () => { const v = film(); if (v) { const phone0 = window.matchMedia("(max-width:767px)").matches; const want = phone0 ? v.dataset.srcM : v.dataset.src; if (want && !v.getAttribute("src")) { if (phone0 && v.dataset.posterM) v.poster = v.dataset.posterM; v.preload = "auto"; v.src = want; v.load(); } } };
    if (document.documentElement.classList.contains("mk-intro-on")) window.addEventListener("mk-intro-done", preload, { once: true }); else preload(); // not while the opening plays
    const phone = window.matchMedia("(max-width:767px)");
    let armed = true;
    // the one-second hold: freezes the page where it is — on computers via overflow, on phones by swallowing the touch and wheel moves
    const block = (e: Event) => e.preventDefault();
    const hold = (ms: number) => {
      // computers only: scrolling is switched off for a second, then back on (this is the version that worked).
      // Phones get no stop for now: every way of fighting Safari's swipe momentum either slid through or froze the page.
      if (phone.matches) return;
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("wheel", block, { passive: false });
      setTimeout(() => { document.documentElement.style.overflow = ""; window.removeEventListener("wheel", block); }, ms);
    };
    // on phones the yellow and the hero live inside their own scroller (#ycur-stage); on computers the window scrolls
    const stage = document.getElementById("ycur-stage");
    const scroller = () => (phone.matches && stage ? stage : null);
    const set = () => {
      const sc = scroller(), y = sc ? sc.scrollTop : window.scrollY, H = window.innerHeight;
      b.classList.toggle("ycur-top", y < 24);
      const v = film(); if (!v) return;
      const Y = sc ? sc.scrollHeight - sc.clientHeight : H * .75; // phones: the end of the stage box is exactly where the yellow has left
      if (y >= Y - 1 && !b.classList.contains("hero-film")) {
        const want = phone.matches ? v.dataset.srcM : v.dataset.src;
        if (want && v.getAttribute("src") !== want) { if (phone.matches && v.dataset.posterM) v.poster = v.dataset.posterM; v.src = want; }
        // start now if the film is ready; otherwise the moment it can play (a slow phone connection must not leave the still frozen)
        const go = () => { v.currentTime = 0; v.play().catch(() => {}); };
        if (v.readyState >= 2) go(); else v.addEventListener("canplay", go, { once: true });
        b.classList.add("hero-film");
        // a one-second pause on the film (approved 2026-11-04): the page holds here, then the scroll goes on
        if (armed) { armed = false; hold(1000); } // one second
      }
      else if (y < H * .4 && b.classList.contains("hero-film")) { b.classList.remove("hero-film"); v.pause(); armed = true; }
    };
    set(); window.addEventListener("scroll", set, { passive: true }); stage?.addEventListener("scroll", set, { passive: true });
    return () => { window.removeEventListener("scroll", set); stage?.removeEventListener("scroll", set); window.removeEventListener("touchmove", block); window.removeEventListener("wheel", block); b.classList.remove("ycur-top", "hero-film", "ycur-freeze"); document.documentElement.style.overflow = ""; };
  }, []);
  return (<>
    <div className="ycur-panel" aria-hidden="true">
      <div className="ycur-wm"><Logo /></div>
      <span className="ycur-plus ycur-p1" /><span className="ycur-plus ycur-p2" />
      <span className="ycur-qt">Quite the catch.</span>
    </div>
  </>);
}
