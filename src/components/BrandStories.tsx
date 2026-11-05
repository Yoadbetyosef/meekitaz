"use client";
import { useEffect, useRef } from "react";

/* Home · Brand stories (2026-11-05): in place of "Shop the look". The brand-stories film (the row of story cards) on the page's own
   background, no frame, centred, 64% of the width on computers, 88% on phones. Loads and plays only while on screen. */
export default function BrandStories() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = "/media/brand-stories.mp4"; vid.muted = true; vid.play().catch(() => {}); }
      else vid.pause();
    }, { threshold: 0.2 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  return (
    <section className="bstories" aria-label="Brand stories">
      <video ref={v} muted loop playsInline preload="none" poster="/media/brand-stories-poster.jpg" />
    </section>
  );
}
