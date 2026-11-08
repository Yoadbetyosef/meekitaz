"use client";
import { useEffect } from "react";

/* Home (2026-11-08): no curtain any more — no yellow, no pill heartbeat. Her film (the crouch → the lift) is loaded at once and starts
   the moment the blue opening begins to lift (or at once when there is no opening, e.g. back from inside the site), so the blue, her and
   the next section flow as one piece. The name is kept so page.tsx stays as it was. */
export default function YellowCurtain() {
  useEffect(() => {
    const b = document.body, html = document.documentElement;
    const phone = window.matchMedia("(max-width:767px)").matches;
    const v = document.querySelector<HTMLVideoElement>(".cover.one .cv-film video");
    try { sessionStorage.removeItem("mk-entry"); } catch {}
    b.classList.remove("ycur-top", "ycur-beat", "ycur-return", "hero-lift-up");
    if (!v) return;
    const want = phone ? v.dataset.srcM : v.dataset.src;
    if (want && !v.getAttribute("src")) { if (phone && v.dataset.posterM) v.poster = v.dataset.posterM; v.preload = "auto"; v.src = want; v.load(); }
    let started = false;
    const start = () => {
      if (started) return; started = true;
      const go = () => { v.currentTime = 0; v.play().catch(() => {}); b.classList.add("hero-film"); };
      if (v.readyState >= 2) go(); else v.addEventListener("canplay", go, { once: true });
    };
    if (html.classList.contains("mk-intro-on")) { window.addEventListener("mk-intro-lift", start, { once: true }); window.addEventListener("mk-intro-done", start, { once: true }); }
    else start();
    return () => { window.removeEventListener("mk-intro-lift", start); window.removeEventListener("mk-intro-done", start); b.classList.remove("hero-film"); };
  }, []);
  return null;
}
