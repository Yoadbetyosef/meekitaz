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
    b.classList.add("ycur-top"); b.classList.remove("hero-film", "hero-lift-up"); // a fresh start every time the home page mounts
    // (return mode no longer needs the scroll spacer)
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
        // (2026-11-08) entry goes straight from the blue to her film — no yellow
        setGone(true); start(); b.classList.add("hero-film", "ycur-beat"); b.classList.remove("ycur-top");
        tm.push(window.setTimeout(() => b.classList.remove("ycur-beat"), 2000));
      };
      if (html.classList.contains("mk-intro-on")) window.addEventListener("mk-intro-done", run, { once: true }); else run();
    } else {
      // RETURN mode (2026-11-06): the page itself does not scroll during the curtain. It is locked; the first scroll gesture
      // (wheel down, swipe up, a key) lifts the yellow with the same animation as on entry, starts her film, and keeps the lock for
      // two more seconds — nothing to fight, nothing to flicker — then the page is released.
      load();
      let lifted = false;
      const block = (e: Event) => { if (e.cancelable) e.preventDefault(); };
      const lock = () => { document.documentElement.style.overflow = "hidden"; window.addEventListener("wheel", block, { passive: false }); window.addEventListener("touchmove", block, { passive: false }); };
      const unlock = () => { document.documentElement.style.overflow = ""; window.removeEventListener("wheel", block); window.removeEventListener("touchmove", block); };
      let ty = 0;
      const lift = () => { if (lifted) return; lifted = true;
        document.getElementById("ycur-panel")?.classList.add("ycur-up");
        tm.push(window.setTimeout(() => { start(); b.classList.add("hero-film"); b.classList.remove("ycur-top"); }, 600));
        tm.push(window.setTimeout(() => setGone(true), 700));
        tm.push(window.setTimeout(() => { unlock(); cleanupGestures(); }, 600 + 2000)); };
      const onWheel = (e: WheelEvent) => { if (e.deltaY > 0) lift(); };
      const onKey = (e: KeyboardEvent) => { if (["ArrowDown", "PageDown", " ", "End"].includes(e.key)) lift(); };
      const onTs = (e: TouchEvent) => { ty = e.touches[0].clientY; };
      const onTm = (e: TouchEvent) => { if (ty - e.touches[0].clientY > 12) lift(); };
      const cleanupGestures = () => { window.removeEventListener("wheel", onWheel); window.removeEventListener("keydown", onKey); window.removeEventListener("touchstart", onTs); window.removeEventListener("touchmove", onTm); };
      lock(); window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      window.addEventListener("wheel", onWheel, { passive: true }); window.addEventListener("keydown", onKey); window.addEventListener("touchstart", onTs, { passive: true }); window.addEventListener("touchmove", onTm, { passive: true });
      return () => { tm.forEach(clearTimeout); unlock(); cleanupGestures(); b.classList.remove("ycur-top", "hero-film", "hero-lift-up", "ycur-return"); };
    }
    return () => { tm.forEach(clearTimeout); b.classList.remove("ycur-top", "ycur-beat", "hero-film", "hero-lift-up"); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); };
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
