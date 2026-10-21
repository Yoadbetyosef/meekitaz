"use client";
import { useEffect, useRef } from "react";
import { brand } from "@/brands";

/** "Follow us on Instagram": a row of short, muted, looping clips from the brand's own feed. Clips only play while on screen
 *  (and not at all for people who ask their device for reduced motion — they see the poster frame). Hidden when the brand has no feed. */
export default function InstagramReel() {
  const ig = brand.instagram;
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current; if (!el) return;
    const vids = Array.from(el.querySelectorAll("video"));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(es => es.forEach(e => { const v = e.target as HTMLVideoElement; if (e.isIntersecting) v.play().catch(() => {}); else v.pause(); }), { root: el, threshold: 0.4 });
    vids.forEach(v => io.observe(v));
    return () => io.disconnect();
  }, []);
  if (!ig) return null;
  const step = (dir: number) => { const el = row.current; if (!el) return; const w = (el.querySelector(".ig-tile") as HTMLElement)?.offsetWidth || 260; el.scrollBy({ left: dir * (w + 16) * 2, behavior: "smooth" }); };
  return (
    <section className="sec ig" id="instagram" aria-label="Instagram">
      <div className="wrap">
        <div className="sec-head sec-head-row">
          <div><small className="eyebrow">Instagram</small><h2 className="h2">Follow us on Instagram</h2></div>
          <div className="ig-actions">
            <a className="pill" href={ig.url} target="_blank" rel="noopener noreferrer">@{ig.handle}</a>
            <div className="rv-nav"><button aria-label="Previous" onClick={() => step(-1)}>←</button><button aria-label="Next" onClick={() => step(1)}>→</button></div>
          </div>
        </div>
      </div>
      <div className="ig-row" ref={row}>
        {ig.items.map((it, i) => (
          <div className="ig-tile" key={it.video}>
            <video src={it.video} poster={it.poster} muted loop playsInline preload="none" aria-label={`@${ig.handle} video ${i + 1}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
