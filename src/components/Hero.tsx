"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { DailyHeroBadge, DailyHeroHeadline } from "./DailyPrice";
import { useDaily } from "./DailyMode";
import DailyProof, { DailyQuote } from "./DailyProof";
import { slides as allSlides } from "@/lib/data";

/* TRIAL (2026-10-30): one still photo instead of the changing slides.
   To go back to the original changing slides: set ONE_PHOTO = false (or delete this block and the "slides" line below). */
const ONE_PHOTO = true;
const ONE = { small: "", big: "Take your shot.", cta: "Shop engagement rings", href: "/engagement-rings", // 2026-11-04: after the yellow's "Quite the catch." — headline and button only
  desktop: "/media/hero/lav-d.webp", mobile: "/media/hero/lav-m.webp", pos: "50% 0%", posM: "50% 0%" }; // the lavender scarf portrait (approved 2026-10-31): framed by CSS (.cover.one img) from the mocks
const slides = ONE_PHOTO ? [ONE] : allSlides;
import Logo from "./Logo";
import HeroLift from "./HeroLift";

// The mobile photo goes through the same image optimiser as the desktop one (a plain <source> would download the original multi-megabyte file on a phone).
const optimised = (src: string) => getImageProps({ src, alt: "", fill: true, sizes: "100vw", quality: 78 }).props;

/** How long each photo stays, like a story. */
const STEP = 2000;

/** The cover: a full-screen photograph under the wordmark, changing every two seconds like a story (a bar for each photo,
 *  a tap on the left or right goes back or forward, holding a finger on it pauses it). */
const M_PATH = "M61 132 L63 163 L69 183 L82 209 L98 231 L119 253 L149 280 L192 314 L222 335 L120 202 L95 158 L88 138 L87 124 L90 114 L101 104 L112 101 L133 102 L162 108 L185 116 L216 131 L235 143 L262 165 L302 209 L319 232 L346 275 L393 368 L407 384 L414 389 L427 394 L436 394 L448 390 L458 383 L468 372 L476 360 L519 274 L552 223 L576 193 L605 163 L640 136 L667 121 L691 111 L715 104 L740 100 L757 101 L768 105 L776 113 L779 122 L779 133 L772 155 L752 192 L719 238 L642 336 L704 290 L740 259 L762 237 L788 202 L797 184 L802 169 L805 152 L805 126 L799 101 L787 76 L772 55 L748 32 L716 13 L689 4 L660 0 L626 2 L609 6 L588 14 L563 29 L535 55 L514 84 L460 195 L447 218 L434 236 L415 208 L356 87 L340 62 L315 35 L302 25 L283 14 L259 5 L232 0 L203 0 L169 7 L135 22 L114 37 L96 55 L85 69 L68 101 Z M89 241 L89 277 L86 291 L77 315 L59 345 L18 403 L5 432 L1 450 L0 467 L2 482 L9 501 L29 529 L54 552 L87 574 L130 595 L181 612 L227 622 L269 626 L285 620 L301 603 L313 582 L318 569 L324 539 L324 507 L318 475 L308 449 L284 413 L246 373 L222 352 L167 313 L131 284 Z M776 241 L734 284 L718 298 L644 353 L607 385 L581 413 L564 437 L555 454 L548 472 L542 502 L542 537 L545 555 L553 579 L565 600 L578 615 L591 623 L598 625 L615 625 L653 619 L711 602 L748 587 L788 566 L821 543 L846 518 L859 496 L865 472 L865 456 L862 439 L853 415 L845 400 L801 337 L786 310 L779 290 L776 275 Z";

export default function Hero() {
  const [i, setI] = useState(0);
  // Only the first slide is loaded with the page; the others follow, one every moment after it has painted.
  const [seen, setSeen] = useState(0);
  const iRef = useRef(0), elapsed = useRef(0), paused = useRef(false), onScreen = useRef(true), downAt = useRef(0);
  const segs = useRef<(HTMLElement | null)[]>([]);
  const reduce = useRef(false);
  const wordRef = useRef<HTMLSpanElement>(null);
  const daily = useDaily();
  const secRef = useRef<HTMLElement>(null), blockRef = useRef<HTMLDivElement>(null);

  const go = useCallback((n: number) => {
    const k = (n + slides.length) % slides.length;
    iRef.current = k; elapsed.current = 0; setI(k);
  }, []);

  useEffect(() => {
    if (daily) return; // Daily cover is one still: no photos to preload
    let timer: ReturnType<typeof setTimeout>; let n = 0;
    const next = () => { n += 1; setSeen(x => Math.max(x, n)); if (n < slides.length - 1) timer = setTimeout(next, 900); };
    const start = () => { timer = setTimeout(next, 700); };
    // start preloading after the page load — or after 2.5 s at the latest: on a phone the load event can come very late (videos, long page)
    const fallback = setTimeout(start, 2500);
    const onLoad = () => { clearTimeout(fallback); start(); };
    if (document.readyState === "complete") onLoad(); else window.addEventListener("load", onLoad, { once: true });
    return () => { clearTimeout(timer); clearTimeout(fallback); window.removeEventListener("load", onLoad); };
  }, [daily]);

  // The clock: one frame at a time, paused while a finger is held on the photo, while the hero is off screen or the tab is hidden.
  useEffect(() => {
    if (daily) return; // Daily cover is one still: no slide clock, no re-renders
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
  }, [daily]);

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
    <section className={`hero cover${slides.length < 2 ? " one" : ""}`} id="hero" aria-label="Hero" ref={secRef}
      onPointerDown={() => { paused.current = true; downAt.current = Date.now(); }}
      onPointerUp={() => { paused.current = false; }} onPointerCancel={() => { paused.current = false; }} onPointerLeave={() => { paused.current = false; }}>
      {/* the first photo is fetched first and only the one for this screen size */}
      <link rel="preload" as="image" href={optimised(slides[0].mobile).src} imageSrcSet={optimised(slides[0].mobile).srcSet} imageSizes="100vw" media="(max-width:767px)" fetchPriority="high" />
      <link rel="preload" as="image" href={optimised(slides[0].desktop).src} imageSrcSet={optimised(slides[0].desktop).srcSet} imageSizes="100vw" media="(min-width:768px)" fetchPriority="high" />
      {daily && <><img className="dly-m" src="/brand/meekitaz-m-white.png" alt="" aria-hidden="true" /><div className="dly-still" aria-hidden="true"><img src="/media/daily/hero-blue-cut3.webp" alt="" fetchPriority="high" /></div></>}
      {!daily && slides.map((sl, k) => (
        <div key={k} className={`hs${k === i ? " on" : ""}`} style={{ "--pos-m": (sl as { posM?: string }).posM || sl.pos, "--zoom-m": (sl as { zoomM?: number }).zoomM || 1 } as React.CSSProperties}>
          {(k <= seen || k <= i + 1 || (i === slides.length - 1 && k === 0)) && ( /* the photo on screen and the next one always load, whether or not the page has finished loading */
            <picture>
              <source media="(max-width:767px)" srcSet={optimised(sl.mobile).srcSet} sizes={ONE_PHOTO ? "174vw" : "100vw"} />
              <Image src={sl.desktop} alt="" fill loading={k === 0 ? "eager" : "lazy"} fetchPriority={k === 0 ? "high" : "auto"} sizes={ONE_PHOTO ? "138vw" : "100vw"} quality={82} style={{ objectFit: "cover", objectPosition: sl.pos }} />
            </picture>
          )}
        </div>
      ))}
      <div className="cv-taps" hidden={slides.length < 2}>
        <button type="button" className="prev" aria-label="Previous photo" onClick={() => tap(-1)} />
        <button type="button" className="next" aria-label="Next photo" onClick={() => tap(1)} />
      </div>
      <div className="cv-bars" role="group" aria-label="Photos" hidden={slides.length < 2}>
        {slides.map((sl, k) => (
          <button key={k} type="button" aria-label={`${sl.big.replace(".", "")}`} aria-current={k === i} onClick={() => go(k)}><i ref={el => { segs.current[k] = el; }} /></button>
        ))}
      </div>
      {slides.length < 2 && <HeroLift mPath={M_PATH} />}{slides.length < 2 && <div className="cv-film" aria-hidden="true"><video muted loop playsInline preload="none" data-src="/media/hero/lav-film-v5.mp4" data-src-m="/media/hero/lav-film-v4-m.mp4" data-poster-m="/media/hero/lav-film-v4-m-poster.jpg" poster="/media/hero/lav-film-v5-poster.jpg" /></div>}{/* computers: once the yellow has lifted, the still dissolves into this film (V1, 2026-11-03) */}{slides.length < 2 && <div className="cv-edge" aria-hidden="true"><Logo /></div>}{slides.length < 2 && <span className="cv-glow" aria-hidden="true" />}{/* a soft light over the watermark, aimed by Yoad */}{/* desktop, one-photo trial: a big translucent white wordmark running up the right edge, cut off top and bottom */}
      <div className="cv-mast" aria-hidden="true">
        <Logo />
        <div className="cv-issue"><span>New York</span><span>Serious diamonds, worn lightly.</span></div>
      </div>
      <div className="cv-seal" role="img" aria-label="Rated 4.9 stars. Trusted brand, 2026"><svg className="rg" viewBox="0 0 100 100" aria-hidden="true"><defs><path id="cvring" d="M50,50 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" /></defs><text><textPath href="#cvring" textLength="252" lengthAdjust="spacing">TRUSTED BRAND · 2026 · TRUSTED BRAND · 2026 ·</textPath></text></svg><div className="fc fa"><div><div className="five">4.9</div><div className="st"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7z" /></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7z" /></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7z" /></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7z" /></svg><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.3 5.8 21l1.6-7L2 9.3l7.1-.7z" /></svg></div></div></div><div className="fc fb"><div><div className="yr">2026</div><div className="tr">Trusted brand</div></div></div></div>
      <div className="cv-bot" ref={blockRef}>
        {daily ? <DailyHeroHeadline /> : <Link href={s.href} className="cv-line"><h1>{s.small && <small>{s.small}</small>}<span className="word" ref={wordRef}>{s.big}</span>{(s as { sub?: string }).sub && <span className="cv-sub">{(s as { sub?: string }).sub}</span>}</h1></Link>}
        <div className="cv-row">
          {daily ? <><DailyProof /><Link href="/engagement-rings" className="pill cv-pill dly-go">Shop engagement rings<span className="dly-go-ar" aria-hidden="true">→</span></Link><DailyQuote /></> : <>
          <Link href="/engagement-rings" className="pill cv-pill">{(s as { cta?: string }).cta || "Shop Engagement Rings"}</Link>
          <DailyHeroBadge />
          <ul className="cv-claims"><li>30-day free returns</li><li>Lifetime warranty</li><li>IGI / GIA certified</li></ul></>}
        </div>
      </div>
    </section>
  );
}
