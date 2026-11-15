"use client";
import { useEffect, useRef } from "react";

/* Home · "The feed" (approved 2026-11-15, "A · five in a row"): a lime band after the reviews. "Worn lightly." on top, then our
   upright feed reel five times side by side, edge to edge, each at a different moment (three on phones). The lime is a field of
   squares that shimmer, and a few break loose over the top and bottom edge of the reels. Everything runs only while on screen.
   The dark "Worn · reel · lightly." band it replaces is in DESIGNS.md. */
const L = "#E1FF4F", L2 = "#D2F03C", L3 = "#EDFF8A";
const noise = (x: number, y: number, t: number) => { const s = Math.sin(x * 12.9898 + y * 78.233 + t * 37.719) * 43758.5453; return s - Math.floor(s); };

export default function FeedBand() {
  const box = useRef<HTMLElement>(null), row = useRef<HTMLDivElement>(null), cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = box.current, r = row.current, c = cv.current; if (!el || !r || !c) return;
    const vids = Array.from(r.querySelectorAll("video")), still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, on = false, last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw); if (now - last < 80) return; last = now; // the squares only change a few times a second
      const b = c.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1), W = b.width, H = b.height;
      if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) { c.width = Math.round(W * d); c.height = Math.round(H * d); }
      const x = c.getContext("2d"); if (!x) return; x.setTransform(d, 0, 0, d, 0, 0); x.clearRect(0, 0, W, H);
      const S = W < 700 ? 26 : 38, t = Math.floor(now / 260), t2 = Math.floor(now / 420), rr = r.getBoundingClientRect(), top = rr.top - b.top, bot = top + rr.height;
      for (let gy = 0; gy * S < H; gy++) for (let gx = 0; gx * S < W; gx++) {
        const y = gy * S, X = gx * S;
        if (!(y + S > top && y < bot)) { const n = noise(gx, gy, t); if (n > .9) { x.fillStyle = L3; x.fillRect(X, y, S, S); } else if (n < .1) { x.fillStyle = L2; x.fillRect(X, y, S, S); } }
        else { const edge = Math.min(y + S - top, bot - y) / S; if (edge < 2.2 && noise(gx, gy, t2) > .45 + edge * .2) { x.fillStyle = L; x.fillRect(X, y, S + 1, S + 1); } }
      }
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      vids.forEach((v, i) => {
        if (v.offsetParent === null) return; // hidden on phones
        if (on) {
          if (!v.getAttribute("src")) { v.addEventListener("loadedmetadata", () => { try { v.currentTime = (i * 1.8) % (v.duration || 9); } catch { /* starts from the top */ } }, { once: true }); v.src = "/media/feed-strip.mp4"; }
          v.muted = true; v.play().catch(() => { /* the poster stays */ });
        } else v.pause();
      });
      cancelAnimationFrame(raf); if (on && !still) raf = requestAnimationFrame(draw);
    }, { threshold: 0.12 });
    io.observe(el); return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="fd" ref={box} aria-label="The feed">
      <canvas className="fd-cv" ref={cv} aria-hidden="true" />
      <div className="fd-hd"><span>The feed</span><span>@meekitaz</span></div>
      <h2 className="fd-h">Worn <em>lightly.</em></h2>
      <div className="fd-row" ref={row} aria-hidden="true">{[0, 1, 2, 3, 4].map(i => <div key={i}><video muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" /></div>)}</div>
      <div className="fd-ft"><p>Real days, real diamonds. No velvet boxes.</p><a className="fd-btn" href="https://www.instagram.com/meekitaz" target="_blank" rel="noopener">Follow @meekitaz <i aria-hidden="true">&rarr;</i></a></div>
    </section>
  );
}
