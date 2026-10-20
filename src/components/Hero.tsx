"use client";
import { useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { slides, faces, heroPlaces, frameStyle } from "@/lib/data";
import Stars from "./Stars";

// The mobile photo goes through the same image optimiser as the desktop one (a plain <source> would download the original multi-megabyte file on a phone).
const optimised = (src: string) => getImageProps({ src, alt: "", fill: true, sizes: "100vw", quality: 78 }).props;

export default function Hero() {
  const [i, setI] = useState(0);
  // Only the first slide is loaded with the page; the next one follows a moment after it has painted, then each slide one step ahead of the carousel.
  const [seen, setSeen] = useState(0);
  useEffect(() => {
    const go = () => setTimeout(() => setSeen(x => Math.max(x, 1)), 700);
    if (document.readyState === "complete") { const t = go(); return () => clearTimeout(t); }
    let t: ReturnType<typeof setTimeout>; const on = () => { t = go(); }; window.addEventListener("load", on);
    return () => { window.removeEventListener("load", on); clearTimeout(t); };
  }, []);
  useEffect(() => { if (i > 0) setSeen(x => Math.max(x, Math.min(slides.length - 1, i + 1))); }, [i]);
  const wordRef = useRef<HTMLSpanElement>(null);
  const secRef = useRef<HTMLElement>(null), blockRef = useRef<HTMLDivElement>(null);
  // On phones the photo fills whatever is left above the text block, so the block's height is measured into a CSS variable.
  useEffect(() => {
    const sec = secRef.current, el = blockRef.current; if (!sec || !el) return;
    const set = () => sec.style.setProperty("--hc", `${el.offsetHeight}px`);
    set(); const ro = new ResizeObserver(set); ro.observe(el); return () => ro.disconnect();
  }, []);
  useEffect(() => { const t = setInterval(() => setI(x => (x + 1) % slides.length), 5000); return () => clearInterval(t); }, []);
  // mobile: shrink long headlines to one line
  useEffect(() => {
    const el = wordRef.current; if (!el) return;
    const fit = () => {
      if (window.innerWidth >= 768) { el.style.fontSize = ""; return; }
      const box = (el.parentElement?.getBoundingClientRect().width || window.innerWidth) * 0.95;
      el.style.width = "max-content"; let fs = 8.4;
      for (; fs > 4.5; fs -= 0.1) { el.style.fontSize = fs.toFixed(1) + "vw"; if (el.getBoundingClientRect().width <= box) break; }
      el.style.width = "";
    };
    fit(); const r = () => fit(); window.addEventListener("resize", r);
    (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready.then(fit);
    return () => window.removeEventListener("resize", r);
  }, [i]);
  const s = slides[i];
  return (
    <section className="hero" id="hero" aria-label="Hero" ref={secRef}>
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
          {frameStyle !== "off" && <span className="hf" aria-hidden="true"><i className="hf-k tl" /><i className="hf-k tr" /><i className="hf-k bl" /><i className="hf-k br" /><i className="hf-rl" /><b className="hf-n">{String(k + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</b><b className="hf-p">{heroPlaces[k] || ""}</b></span>}
        </div>
      ))}
      <div className="heroc">
        <div ref={blockRef}>
          <Link href={s.href}><h1><small>{s.small}</small><span className="word" ref={wordRef}>{s.big}</span></h1></Link>
          <div className="brcard">
            <div className="proof">
              <span className="faces">{faces.map((f, k) => <Image key={k} src={f} alt="" width={44} height={44} />)}</span>
              <div><b>4.9 <Stars /></b><small>5,000+ reviews</small></div>
            </div>
            <Link href="/engagement-rings" className="pill">Shop Engagement Rings</Link>
          </div>
          <div className="claims"><div>30-day free returns</div><div>Lifetime warranty</div><div>IGI / GIA certified</div></div>
        </div>
      </div>
      <div className="hdots" aria-hidden="true">{slides.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
    </section>
  );
}
