"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { slides, faces } from "@/lib/data";
import Stars from "./Stars";

export default function Hero() {
  const [i, setI] = useState(0);
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
      {slides.map((sl, k) => (
        <div key={k} className={`hs${k === i ? " on" : ""}`}>
          <picture>
            <source media="(max-width:767px)" srcSet={sl.mobile} />
            <Image src={sl.desktop} alt="" fill priority={k === 0} sizes="100vw" quality={78} style={{ objectFit: "cover", objectPosition: sl.pos }} />
          </picture>
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
