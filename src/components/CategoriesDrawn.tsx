"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

/* Shop by category on computers (approved 2026-11-08, "C1 · scattered, bare"): our long reel flush to the left edge of the screen, square,
   the full height of the section; on the right only "Find your thing." and his eight cobalt drawings scattered at playful sizes, each one
   breathing, its category under it — hover lifts and turns it, the name turns blue with a line and an arrow. Phones (approved 2026-11-08, "M4", symmetric): the reel on the left half, the eight drawings in an even 2 × 4 beside it. */
const CATS: [string, string, string, number, number, number, number, number][] = [
  // [href, name, drawing, x%, y%, height px, rotate, aspect]
  ["/engagement-rings", "Engagement rings", "rings", 14, 38, 190, -6, .626],
  ["/necklaces", "Necklaces", "necklaces", 40, 30, 170, 4, 1.03],
  ["/earrings", "Earrings", "earrings", 66, 36, 180, -3, .913],
  ["/one-of-one", "One of one", "one", 86, 34, 170, 6, 1.005],
  ["/diamonds", "Diamonds", "diamonds", 22, 74, 120, 5, 2.049],
  ["/bands", "Bands", "bands", 46, 72, 170, -5, .972],
  ["/bracelets", "Bracelets", "bracelets", 68, 74, 180, 3, .995],
  ["/fancy-colors", "Fancy colors", "fancy", 88, 74, 160, -4, 1.025],
];

// phones (approved 2026-11-08, "S1 · the zigzag", icons a touch bigger): [x% of the right half, y% of the screen, height px, rotate]
const PHONE: [number, number, number, number][] = [[30, 26, 66, -6], [70, 35.5, 64, 6], [30, 45, 62, -5], [70, 54.5, 66, 5], [30, 64, 46, -6], [70, 73.5, 64, 6], [30, 83, 64, -5], [70, 92, 62, 5]];

export default function CategoriesDrawn() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = "/media/feed-strip.mp4"; vid.muted = true; vid.play().catch(() => {}); }
      else vid.pause();
    }, { threshold: .15 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  return (
    <section className="catd" aria-label="Shop by category">
      <div className="catd-reel">
        <video ref={v} muted loop playsInline preload="none" poster="/media/feed-strip-poster.jpg" aria-hidden="true" />
        <i className="fl-plus p1" /><i className="fl-plus p3" />
        <span>Meekitaz &middot; From the feed</span>
      </div>
      <h2 className="catd-h">Find your thing.</h2>
      <div className="catd-field">
        {CATS.map(([href, name, img, x, y, h, r, a], k) => (
          <Link key={href} href={href} className="catd-c" style={{ left: x + "%", top: y + "%", ["--r" as string]: r + "deg", ["--mx" as string]: PHONE[k][0] + "%", ["--my" as string]: PHONE[k][1] + "%", ["--mr" as string]: PHONE[k][3] + "deg", ["--mh" as string]: PHONE[k][2] + "px", ["--a" as string]: String(a) }}>
            <i className="catd-ic" aria-hidden="true" style={{ backgroundImage: `url(/media/cats/drawn/${img}.webp)`, height: `min(${h}px, ${(h / 860 * 100).toFixed(1)}vh)`, aspectRatio: String(a), ["--t" as string]: (4 + (k % 3)) + "s", ["--dl" as string]: -(k * .6) + "s" }} />
            <b>{name}</b>
          </Link>
        ))}
      </div>
      <i className="catd-x x2" aria-hidden="true" /><i className="catd-x x4" aria-hidden="true" />
    </section>
  );
}
