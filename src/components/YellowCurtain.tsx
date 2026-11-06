"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";

/* Home (2026-11-06).
   ENTRY from outside (the same gate as the opening): the colour curtain cycles fast (1s) over the top 75% of the hero and lifts BY ITSELF
   after 1.2s; the still dissolves into her film; the menu pill lands with two heartbeats. When her film ends, the page scrolls itself
   down (O1): the next section rises over her and our M opens into the second film.
   RETURN to home from inside the site: no opening; the curtain cycles slowly (4.2s) and lifts only with a scroll or a swipe, as before.
   Every automatic move stops the moment the person scrolls, swipes, taps or presses a key. */
export default function YellowCurtain() {
  const [gone, setGone] = useState(false);
  const [mode, setMode] = useState<"entry" | "return" | null>(null);
  useEffect(() => {
    const b = document.body, html = document.documentElement;
    const phone = window.matchMedia("(max-width:767px)").matches;
    const film = () => document.querySelector<HTMLVideoElement>(".cover.one .cv-film video");
    const entry = html.classList.contains("mk-intro-on") || sessionStorage.getItem("mk-entry") === "1";
    try { sessionStorage.removeItem("mk-entry"); } catch {}
    setMode(entry ? "entry" : "return");
    b.classList.add("ycur-top"); if (!entry) b.classList.add("ycur-return"); // return mode: the spacer after the hero gives the scroll room
    const tm: number[] = [];
    let userMoved = false;
    const stop = () => { userMoved = true; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.addEventListener(e, stop, { passive: true }));
    const load = () => { const v = film(); if (v) { const want = phone ? v.dataset.srcM : v.dataset.src; if (want && !v.getAttribute("src")) { if (phone && v.dataset.posterM) v.poster = v.dataset.posterM; v.preload = "auto"; v.src = want; v.load(); } } };
    const start = () => { const v = film(); if (!v) return; const go = () => { v.currentTime = 0; v.play().catch(() => {}); }; if (v.readyState >= 2) go(); else v.addEventListener("canplay", go, { once: true });
      // (what happens when her film ends is handled by HeroLift on computers)
    };
    if (entry) {
      const run = () => {
        load();
        tm.push(window.setTimeout(() => { if (!userMoved) document.getElementById("ycur-panel")?.classList.add("ycur-up"); }, 750));
        tm.push(window.setTimeout(() => { start(); b.classList.add("hero-film", "ycur-beat"); b.classList.remove("ycur-top"); }, 1350));
        tm.push(window.setTimeout(() => setGone(true), 1450));
        tm.push(window.setTimeout(() => b.classList.remove("ycur-beat"), 3350));
      };
      if (html.classList.contains("mk-intro-on")) window.addEventListener("mk-intro-done", run, { once: true }); else run();
    } else {
      // return mode: the slow curtain, lifted by scrolling; her film starts when the curtain has left
      load();
      const set = () => { const y = window.scrollY, H = window.innerHeight; b.classList.toggle("ycur-top", y < 24);
        if (y >= H * .75 - 1 && !b.classList.contains("hero-film")) { start(); b.classList.add("hero-film"); } };
      set(); window.addEventListener("scroll", set, { passive: true });
      tm.push(window.setTimeout(() => {}, 0));
      return () => { window.removeEventListener("scroll", set); tm.forEach(clearTimeout); b.classList.remove("ycur-top", "hero-film", "ycur-return"); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); };
    }
    return () => { tm.forEach(clearTimeout); b.classList.remove("ycur-top", "ycur-beat"); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); };
  }, []);
  if (gone) return null; // the curtain is on screen from the first paint; its mode (fast/slow) is decided right after
  return (<>
    <div className={`ycur-panel${mode === "return" ? " ycur-slow" : ""}`} id="ycur-panel" aria-hidden="true">
      <div className="ycur-wm"><Logo /></div>
      <span className="ycur-plus ycur-p1" /><span className="ycur-plus ycur-p2" />
      <span className="ycur-qt">Quite the catch.</span>
    </div>
  </>);
}
