"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export type Reveal = { tag: string; l1: string; l2: string; cta: string; href: string };

/** A silent, looping mood video that lives inside the product grid as a full-row tile. No sound, no controls; it plays only while on screen and is
 *  fetched only when it comes near, so it costs nothing on pages where nobody scrolls to it.
 *  With `reveal`, the tile also opens as you scroll it to the middle of the screen (a small frame grows to full width) and closes as you leave,
 *  with a small caption on it. */
export default function GridMood({ src: srcM, poster: posterM, srcD, posterD, reveal }: { src: string; poster: string; srcD?: string; posterD?: string; reveal?: Reveal }) {
  // computers get their own (landscape) film when one is given; phones keep the original
  const [wide, setWide] = useState(false);
  useEffect(() => { const m = window.matchMedia("(min-width: 768px)"); const on = () => setWide(m.matches); on(); m.addEventListener("change", on); return () => m.removeEventListener("change", on); }, []);
  const src = wide && srcD ? srcD : srcM, poster = wide && posterD ? posterD : posterM;
  const v = useRef<HTMLVideoElement>(null), box = useRef<HTMLDivElement>(null), win = useRef<HTMLDivElement>(null), txt = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { if (el.getAttribute("src") !== src) el.setAttribute("src", src); el.play().catch(() => {}); } else el.pause(); }), { threshold: 0.2, rootMargin: "300px 0px" });
    io.observe(el); return () => io.disconnect();
  }, [src]);
  useEffect(() => {
    const b = box.current, w = win.current, x = txt.current, vid = v.current;
    if (!reveal || !b || !w || !x || !vid || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return; // reduced motion: the tile simply stays open
    let raf = 0, live = false;
    const draw = () => {
      raf = 0;
      const r = b.getBoundingClientRect(), t = (r.top + r.height / 2) / window.innerHeight, d = Math.abs(t - 0.5);
      const c = Math.max(0, Math.min(1, (0.4 - d) / 0.3)), k = c * c * (3 - 2 * c), q = 1 - k; // 1 = open (tile in the middle of the screen), 0 = closed
      w.style.clipPath = `inset(${(q * 16).toFixed(2)}% ${(q * 32).toFixed(2)}% round ${(26 + q * 18).toFixed(1)}px)`;
      vid.style.transform = `scale(${(1 + 0.12 * q).toFixed(3)})`;
      const o = Math.max(0, Math.min(1, (k - 0.45) / 0.4));
      x.style.opacity = o.toFixed(3); x.style.transform = `translateY(${(q * 24).toFixed(1)}px)`; x.style.pointerEvents = o > 0.5 ? "auto" : "none";
    };
    const tick = () => { if (!raf) raf = requestAnimationFrame(draw); };
    const on = () => { if (live) return; live = true; window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick); };
    const off = () => { if (!live) return; live = false; window.removeEventListener("scroll", tick); window.removeEventListener("resize", tick); };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { on(); tick(); } else off(); }), { rootMargin: "100% 0px" });
    io.observe(b); draw();
    return () => { io.disconnect(); off(); if (raf) cancelAnimationFrame(raf); };
  }, [reveal]);
  if (!reveal) {
    return (
      <div className="gmood" aria-hidden="true">
        <video ref={v} muted loop playsInline preload="none" poster={poster} disablePictureInPicture />
      </div>
    );
  }
  return (
    <div className="gmood gmood-rv" ref={box}>
      <div className="gm-win" ref={win}>
        <video ref={v} muted loop playsInline preload="none" poster={poster} disablePictureInPicture aria-hidden="true" />
        <div className="gm-shade" aria-hidden="true" />
        <div className="gm-txt" ref={txt}>
          <span className="gm-tag">New in &middot; {reveal.tag}</span>
          <div className="gm-big"><span>{reveal.l1}</span><span>{reveal.l2}</span></div>
          <Link href={reveal.href} className="pill gm-go">{reveal.cta}</Link>
        </div>
      </div>
    </div>
  );
}
