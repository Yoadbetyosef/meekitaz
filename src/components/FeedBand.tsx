"use client";
import { useEffect, useRef } from "react";

/* Home · "The feed" (approved 2026-11-15, "C · the film is the whole band"): after the reviews our feed reel fills the entire band,
   and a wave of lime squares sweeps across it and scatters, again and again. The words sit on lime tags: "Worn" / "lightly.",
   the line, and one button — Follow @meekitaz. Runs only while on screen.
   Before it: the lime band with five reels in a row (commit 41bdb53), and the dark "Worn · reel · lightly." band (commit f7533ae). */
const L = "#E1FF4F";
const noise = (x: number, y: number, t: number) => { const s = Math.sin(x * 12.9898 + y * 78.233 + t * 37.719) * 43758.5453; return s - Math.floor(s); };

export default function FeedBand() {
  const box = useRef<HTMLElement>(null), vid = useRef<HTMLVideoElement>(null), cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = box.current, v = vid.current, c = cv.current; if (!el || !v || !c) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw); if (now - last < 50) return; last = now;
      const b = c.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), W = b.width, H = b.height;
      if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) { c.width = Math.round(W * d); c.height = Math.round(H * d); }
      const x = c.getContext("2d"); if (!x) return; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H); x.fillStyle = L;
      const S = W < 700 ? 30 : 46, front = ((now / 5200) % 1) * (W / S + 16) - 8, t = Math.floor(now / 700);
      for (let gy = 0; gy * S < H; gy++) for (let gx = 0; gx * S < W; gx++) {
        const dd = gx - front + Math.sin(gy * .7) * 1.5;
        if ((dd > -7 && dd < 0 && noise(gx, gy, 0) > -dd / 7) || noise(gx, gy, t) > .972) x.fillRect(gx * S, gy * S, S + 1, S + 1);
      }
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!v.getAttribute("src")) v.src = "/media/feed-strip.mp4"; v.muted = true; v.play().catch(() => { /* the poster stays */ }); }
      else v.pause();
      cancelAnimationFrame(raf); if (e.isIntersecting && !still) raf = requestAnimationFrame(draw);
    }, { threshold: 0.12 });
    io.observe(el); return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="fd" ref={box} aria-label="The feed">
      <video className="fd-v" ref={vid} muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" aria-hidden="true" />
      <canvas className="fd-cv" ref={cv} aria-hidden="true" />
      <div className="fd-in">
        <div className="fd-hd"><span>The feed</span><span>@meekitaz</span></div>
        <h2 className="fd-h"><span>Worn</span><br /><span><em>lightly.</em></span></h2>
        <div className="fd-ft"><p>Real days, real diamonds. No velvet boxes.</p><a className="fd-btn" href="https://www.instagram.com/meekitaz" target="_blank" rel="noopener">Follow @meekitaz <i aria-hidden="true">&rarr;</i></a></div>
      </div>
    </section>
  );
}
