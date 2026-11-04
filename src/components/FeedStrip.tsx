"use client";
import { useEffect, useRef } from "react";

/* Floating section: the brand reel as a tall strip flush to the right edge, the full height of the section (2026-11-04: 340px on
   computers "W4", 140px on phones "W3"). Loads and plays only while on screen; unloads when it leaves. */
export default function FeedStrip() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = "/media/feed-strip.mp4"; vid.muted = true; vid.play().catch(() => {}); }
      else { vid.pause(); }
    }, { threshold: 0.15 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  return (
    <div className="fl-strip" aria-hidden="true">
      <video ref={v} muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" />
      <span>Meekitaz &middot; From the feed</span>
    </div>
  );
}
