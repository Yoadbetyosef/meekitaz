"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";

/* Home (2026-11-06, "P1"): after the site opening, the page shows the colour curtain over the top 75% of the hero — cycling fast through our
   colours (1s a cycle) with the huge white watermark, "Quite the catch." and the plus marks — and after 1.2s it lifts away BY ITSELF.
   Then the hero's still dissolves into the film, and the menu pill "lands" with two heartbeats (the bag hops in after it). No scrolling
   needed; scrolling back up never brings the curtain back. */
export default function YellowCurtain() {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    const b = document.body, html = document.documentElement;
    const phone = window.matchMedia("(max-width:767px)").matches;
    const film = () => document.querySelector<HTMLVideoElement>(".cover.one .cv-film video");
    b.classList.add("ycur-top");
    let tm: number[] = [];
    const run = () => {
      // the film loads while the colours cycle
      const v = film();
      if (v) { const want = phone ? v.dataset.srcM : v.dataset.src; if (want && !v.getAttribute("src")) { if (phone && v.dataset.posterM) v.poster = v.dataset.posterM; v.preload = "auto"; v.src = want; v.load(); } }
      tm.push(window.setTimeout(() => { document.getElementById("ycur-panel")?.classList.add("ycur-up"); }, 1200));
      tm.push(window.setTimeout(() => {
        const vv = film();
        if (vv) { const go = () => { vv.currentTime = 0; vv.play().catch(() => {}); }; if (vv.readyState >= 2) go(); else vv.addEventListener("canplay", go, { once: true }); }
        b.classList.add("hero-film", "ycur-beat"); b.classList.remove("ycur-top");
      }, 1200 + 600));
      tm.push(window.setTimeout(() => setGone(true), 1200 + 700));
      tm.push(window.setTimeout(() => b.classList.remove("ycur-beat"), 1200 + 2600));
    };
    if (html.classList.contains("mk-intro-on")) window.addEventListener("mk-intro-done", run, { once: true }); else run();
    return () => { tm.forEach(clearTimeout); window.removeEventListener("mk-intro-done", run); b.classList.remove("ycur-top", "ycur-beat"); };
  }, []);
  if (gone) return null;
  return (
    <div className="ycur-panel" id="ycur-panel" aria-hidden="true">
      <div className="ycur-wm"><Logo /></div>
      <span className="ycur-plus ycur-p1" /><span className="ycur-plus ycur-p2" />
      <span className="ycur-qt">Quite the catch.</span>
    </div>
  );
}
