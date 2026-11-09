"use client";
import { useEffect, useRef } from "react";

/* Below the Floating section (approved 2026-11-04, "B"): the brand reel centred, in the shape of the ring-grid photo tiles (370×900 on
   computers; full width, 3:5.2 on phones), with plus marks in the corners and "MEEKITAZ · FROM THE FEED" vertical on the side.
   Loads and plays only while on screen. */
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
    <section className="fl-reel-wrap" aria-label="From the feed">
      <div className="fl-reel">
        <video ref={v} muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" aria-hidden="true" />
        <i className="fl-plus p1" /><i className="fl-plus p2" /><i className="fl-plus p3" />
        <span>Meekitaz &middot; From the feed</span>
      </div>
    </section>
  );
}
