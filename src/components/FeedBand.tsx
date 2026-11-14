"use client";
import { useEffect, useRef } from "react";

/* Home · "The feed" (approved 2026-11-14, "B · Worn lightly"): one dark moment near the end of the page, after the reviews —
   our upright feed reel at the size of a phone, with the slogan split around it: "Worn" · the reel · "lightly."
   Plays only while it is on screen. One button: Follow @meekitaz (Instagram). */
export default function FeedBand() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = "/media/feed-strip.mp4"; vid.muted = true; vid.play().catch(() => { /* the poster stays */ }); }
      else vid.pause();
    }, { threshold: 0.2 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  return (
    <section className="fb" aria-label="The feed">
      <div className="fb-hd"><span>The feed</span><span>@meekitaz</span></div>
      <div className="fb-body">
        <h2 className="fb-l">Worn</h2>
        <div className="fb-vid"><video ref={v} muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" aria-hidden="true" /><span>The feed</span></div>
        <h2 className="fb-r"><em>lightly.</em></h2>
      </div>
      <div className="fb-ft"><p>Real days, real diamonds. No velvet boxes.</p><a className="fb-btn" href="https://www.instagram.com/meekitaz" target="_blank" rel="noopener">Follow @meekitaz <i aria-hidden="true">&rarr;</i></a></div>
    </section>
  );
}
