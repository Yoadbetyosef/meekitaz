"use client";
import { useEffect, useRef } from "react";

/* Under Shop by category (approved 2026-11-09): the feed reel at its own shape — upright 9:16, whole, never cropped. Centred at the
   height of the screen on computers, the full width on phones. Plays only while it's on screen. */
export default function FeedReel() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = "/media/feed-strip.mp4"; vid.muted = true; vid.play().catch(() => {}); }
      else vid.pause();
    }, { threshold: .2 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  return <div className="feed-nat"><video ref={v} muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" aria-hidden="true" /></div>;
}
