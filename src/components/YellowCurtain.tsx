"use client";
import { useEffect } from "react";
import Logo from "./Logo";

/* Home (2026-11-03): the page opens on a butter-yellow curtain covering the top three-quarters of the hero, with a huge white Meekitaz
   watermark and nothing else — not even the menu pill. The moment you start to scroll, the menu and bag fade in and the curtain lifts
   away, uncovering the hero photo underneath (which stays put). */
export default function YellowCurtain() {
  useEffect(() => {
    const b = document.body;
    const set = () => b.classList.toggle("ycur-top", window.scrollY < 24);
    set(); window.addEventListener("scroll", set, { passive: true });
    return () => { window.removeEventListener("scroll", set); b.classList.remove("ycur-top"); };
  }, []);
  return <div className="ycur-panel" aria-hidden="true"><div className="ycur-wm"><Logo /></div></div>;
}
