"use client";
import { useEffect, useRef } from "react";

/* Floating section: the brand reel as a tall tile under "Light, all the way through." — the same size and shape as the photo tiles in
   the ring grid (one column, two rows; full width 4:5 on phones). Loads and plays only while on screen. */
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
    <div className="fl-reel" aria-hidden="true">
      <video ref={v} muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" />
      <span>Meekitaz &middot; From the feed</span>
    </div>
  );
}
