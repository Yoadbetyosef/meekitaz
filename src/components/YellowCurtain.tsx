"use client";
import { useEffect } from "react";
import Logo from "./Logo";

/* Home (2026-11-03): the page opens on a butter-yellow curtain covering the top three-quarters of the hero, with a huge white Meekitaz
   watermark and nothing else — not even the menu pill. The moment you start to scroll, the menu and bag fade in and the curtain lifts
   away, uncovering the hero photo underneath (which stays put). */
export default function YellowCurtain() {
  useEffect(() => {
    const b = document.body;
    // computers: when the yellow has lifted, the hero's still photo dissolves into the film (watermark and its light stay on top);
    // scrolling back up brings the still back. The film only loads on computers, and only then.
    const film = () => document.querySelector<HTMLVideoElement>(".cover.one .cv-film video");
    const big = window.matchMedia("(min-width:768px)");
    const set = () => {
      const y = window.scrollY, H = window.innerHeight;
      b.classList.toggle("ycur-top", y < 24);
      const v = film(); if (!v || !big.matches) return;
      if (y > H * .72 && !b.classList.contains("hero-film")) { if (!v.getAttribute("src") && v.dataset.src) v.src = v.dataset.src; v.currentTime = 0; v.play().catch(() => {}); b.classList.add("hero-film"); }
      else if (y < H * .4 && b.classList.contains("hero-film")) { b.classList.remove("hero-film"); v.pause(); }
    };
    set(); window.addEventListener("scroll", set, { passive: true });
    return () => { window.removeEventListener("scroll", set); b.classList.remove("ycur-top", "hero-film"); };
  }, []);
  return (
    <div className="ycur-panel" aria-hidden="true">
      <div className="ycur-wm"><Logo /></div>
      <span className="ycur-plus ycur-p1" /><span className="ycur-plus ycur-p2" />
      <span className="ycur-qt">Quite the catch.</span>
    </div>
  );
}
