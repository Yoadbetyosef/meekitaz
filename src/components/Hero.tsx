"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { slides } from "@/lib/data";
import Logo from "./Logo";

// The mobile photo goes through the same image optimiser as the desktop one (a plain <source> would download the original multi-megabyte file on a phone).
const optimised = (src: string) => getImageProps({ src, alt: "", fill: true, sizes: "100vw", quality: 78 }).props;

/** How long each photo stays, like a story. */
const STEP = 2000;

/** The cover: a full-screen photograph under the wordmark, changing every two seconds like a story (a bar for each photo,
 *  a tap on the left or right goes back or forward, holding a finger on it pauses it). */
export default function Hero() {
  const [i, setI] = useState(0);
  // Only the first slide is loaded with the page; the others follow, one every moment after it has painted.
  const [seen, setSeen] = useState(0);
  const iRef = useRef(0), elapsed = useRef(0), paused = useRef(false), onScreen = useRef(true), downAt = useRef(0);
  const segs = useRef<(HTMLElement | null)[]>([]);
  const reduce = useRef(false);
  const wordRef = useRef<HTMLSpanElement>(null);
  const secRef = useRef<HTMLElement>(null), blockRef = useRef<HTMLDivElement>(null);

  const go = useCallback((n: number) => {
    const k = (n + slides.length) % slides.length;
    iRef.current = k; elapsed.current = 0; setI(k);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>; let n = 0;
    const next = () => { n += 1; setSeen(x => Math.max(x, n)); if (n < slides.length - 1) timer = setTimeout(next, 900); };
    const start = () => { timer = setTimeout(next, 700); };
    if (document.readyState === "complete") start(); else window.addEventListener("load", start, { once: true });
    return () => { clearTimeout(timer); window.removeEventListener("load", start); };
  }, []);

  // The clock: one frame at a time, paused while a finger is held on the photo, while the hero is off screen or the tab is hidden.
  useEffect(() => {
    reduce.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([e]) => { onScreen.current = e.isIntersecting; }, { threshold: 0.35 });
    if (secRef.current) io.observe(secRef.current);
    let raf = 0, last = performance.now();
    const tick = (t: number) => {
      const dt = Math.min(100, t - last); last = t;
      if (!reduce.current && !paused.current && onScreen.current && !document.hidden) {
        elapsed.current += dt;
        if (elapsed.current >= STEP) { elapsed.current = 0; const k = (iRef.current + 1) % slides.length; iRef.current = k; setI(k); }
      }
      const p = elapsed.current / STEP;
      segs.current.forEach((s, k) => { if (s) s.style.setProperty("--p", String(reduce.current ? (k <= iRef.current ? 1 : 0) : k < iRef.current ? 1 : k === iRef.current ? p : 0)); });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  // On phones the seal sits above the text block, so the block's height is measured into a CSS variable.
  useEffect(() => {
    const sec = secRef.current, el = blockRef.current; if (!sec || !el) return;
    const set = () => sec.style.setProperty("--hc", `${el.offsetHeight}px`);
    set(); const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect();
  }, []);

  // mobile: shrink long headlines to one line
  useEffect(() => {
    const el = wordRef.current; if (!el) return;
    const fit = () => {
      if (window.innerWidth >= 768) { el.style.fontSize = ""; return; }
      const box = (el.parentElement?.getBoundingClientRect().width || window.innerWidth) * 0.97;
      el.style.width = "max-content"; let fs = 8.4;
      for (; fs > 4.5; fs -= 0.1) { el.style.fontSize = fs.toFixed(1) + "vw"; if (el.getBoundingClientRect().width <= box) break; }
      el.style.width = "";
    };
    fit(); const r = () => fit(); window.addEventListener("resize", r);
    (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(fit);
    return () => window.removeEventListener("resize", r);
  }, [i]);

  const tap = (d: number) => { if (Date.now() - downAt.current < 320) go(iRef.current + d); };
  const s = slides[i];
  return (
    <section className="hero cover" id="hero" aria-label="Hero" ref={secRef}
      onPointerDown={() => { paused.current = true; downAt.current = Date.now(); }}
      onPointerUp={() => { paused.current = false; }} onPointerCancel={() => { paused.current = false; }} onPointerLeave={() => { paused.current = false; }}>
      {/* the first photo is fetched first and only the one for this screen size */}
      <link rel="preload" as="image" href={optimised(slides[0].mobile).src} imageSrcSet={optimised(slides[0].mobile).srcSet} imageSizes="100vw" media="(max-width:767px)" fetchPriority="high" />
      <link rel="preload" as="image" href={optimised(slides[0].desktop).src} imageSrcSet={optimised(slides[0].desktop).srcSet} imageSizes="100vw" media="(min-width:768px)" fetchPriority="high" />
      {slides.map((sl, k) => (
        <div key={k} className={`hs${k === i ? " on" : ""}`} style={{ "--pos-m": (sl as { posM?: string }).posM || sl.pos, "--zoom-m": (sl as { zoomM?: number }).zoomM || 1 } as React.CSSProperties}>
          {k <= seen && (
            <picture>
              <source media="(max-width:767px)" srcSet={optimised(sl.mobile).srcSet} sizes="100vw" />
              <Image src={sl.desktop} alt="" fill loading={k === 0 ? "eager" : "lazy"} fetchPriority={k === 0 ? "high" : "auto"} sizes="100vw" quality={78} style={{ objectFit: "cover", objectPosition: sl.pos }} />
            </picture>
          )}
        </div>
      ))}
      <div className="cv-taps">
        <button type="button" className="prev" aria-label="Previous photo" onClick={() => tap(-1)} />
        <button type="button" className="next" aria-label="Next photo" onClick={() => tap(1)} />
      </div>
      <div className="cv-bars" role="group" aria-label="Photos">
        {slides.map((sl, k) => (
          <button key={k} type="button" aria-label={`${sl.big.replace(".", "")}`} aria-current={k === i} onClick={() => go(k)}><i ref={el => { segs.current[k] = el; }} /></button>
        ))}
      </div>
      <div className="cv-mast" aria-hidden="true">
        <Logo />
        <div className="cv-issue"><span>Fifth Avenue, New York</span><span>Serious diamonds, worn lightly.</span></div>
      </div>
      <div className="cv-seal" role="img" aria-label="Rated 4.9 from more than 5,000 reviews"><div><b>4.9</b><span>5,000+<br />reviews</span></div></div>
      <div className="cv-bot" ref={blockRef}>
        <Link href={s.href} className="cv-line"><h1><small>{s.small}</small><span className="word" ref={wordRef}>{s.big}</span></h1></Link>
        <div className="cv-row">
          <Link href="/engagement-rings" className="pill cv-pill">Shop Engagement Rings</Link>
          <ul className="cv-claims"><li>30-day free returns</li><li>Lifetime warranty</li><li>IGI / GIA certified</li></ul>
        </div>
      </div>
    </section>
  );
}
