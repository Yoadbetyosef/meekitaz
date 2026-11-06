"use client";
import { useEffect, useRef } from "react";

/* Home · Brand stories (2026-11-05): in place of "Shop the look". The brand-stories film (the row of story cards) on the page's own
   background, no frame, centred, 64% of the width on computers; on phones the tall (9:16) version, full width. Loads and plays only
   while on screen. */
export default function BrandStories() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (!vid.getAttribute("src")) { const phone = window.matchMedia("(max-width:767px)").matches; vid.poster = phone ? "/media/brand-stories-m2-poster.jpg" : "/media/brand-stories-lilac-poster.jpg"; vid.src = phone ? "/media/brand-stories-m2.mp4" : "/media/brand-stories-lilac.mp4"; }
        vid.muted = true; vid.play().catch(() => {});
      }
      else vid.pause();
    }, { threshold: 0.2 });
    io.observe(vid);
    // it is a film, not a carousel — but on phones a swipe or a tap on a side jumps it one card forward/back (6 cards over 18.9s)
    const STEP = 3.15; let x0 = 0, t0 = 0; // about one card
    const jump = (dir: number) => { const d = vid.duration || 56.7; vid.currentTime = ((Math.round(vid.currentTime / STEP) + dir) * STEP + d) % d; vid.play().catch(() => {}); };
    const ts = (e: TouchEvent) => { x0 = e.touches[0].clientX; t0 = Date.now(); };
    const te = (e: TouchEvent) => { const dx = e.changedTouches[0].clientX - x0; if (Date.now() - t0 > 600) return;
      if (Math.abs(dx) > 40) jump(dx < 0 ? 1 : -1); else { const r = vid.getBoundingClientRect(), x = e.changedTouches[0].clientX - r.left; if (x < r.width * .3) jump(-1); else if (x > r.width * .7) jump(1); } };
    vid.addEventListener("touchstart", ts, { passive: true }); vid.addEventListener("touchend", te, { passive: true });
    return () => { io.disconnect(); vid.removeEventListener("touchstart", ts); vid.removeEventListener("touchend", te); };
  }, []);
  return (
    <section className="bstories" aria-label="Brand stories">
      <video ref={v} muted loop playsInline preload="none" poster="/media/brand-stories-lilac-poster.jpg" />
    </section>
  );
}
