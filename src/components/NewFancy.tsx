"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { newFancy, newPink, newGreen } from "@/lib/data";

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** "NEW" statement block between the categories and House codes. The card pins in the viewport while the page scrolls past it.
 *  The next colour floods in from the NEW badge in the corner in step with the scroll (no hard cut): the headline rises into place line by line,
 *  the text follows and the photo settles. Yellow (fancy colours) → pink (pink stones) → green (gemstones), each with a pause before the next. */
export default function NewFancy() {
  const pin = useRef<HTMLDivElement>(null), y = useRef<HTMLDivElement>(null), p = useRef<HTMLDivElement>(null), g = useRef<HTMLDivElement>(null), d1 = useRef<HTMLElement>(null), d2 = useRef<HTMLElement>(null), d3 = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = pin.current; if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const r = el.getBoundingClientRect(), total = Math.max(1, el.offsetHeight - window.innerHeight);
      const prog = clamp(-r.top / total);
      // each flood takes a third of the pinned scroll, with a pause on every colour: pink floods at 12–45%, green at 55–88%
      const qs = [1, clamp((prog - 0.12) / 0.33), clamp((prog - 0.55) / 0.33)];
      const idx = qs[2] >= 0.5 ? 2 : qs[1] >= 0.5 ? 1 : 0;
      [y.current, p.current, g.current].forEach((layer, k) => {
        if (!layer) return;
        const on = k === idx;
        if (reduce) { // no motion: the layer for this scroll position is shown in full, the others are hidden
          layer.style.opacity = on ? "1" : "0"; layer.style.visibility = on ? "visible" : "hidden"; layer.style.clipPath = "";
        } else {
          const e = ease(qs[k]);
          layer.style.zIndex = String(k + 1);
          layer.style.opacity = "1";
          layer.style.visibility = qs[k] > 0 ? "visible" : "hidden";
          layer.style.clipPath = k === 0 ? "" : `circle(${e * 150}% at 100% 0%)`; // grows out of the NEW badge
          const txt = layer.querySelector<HTMLElement>(".nf-txt");
          if (txt) { txt.style.transform = `translateY(${(1 - e) * 36}px)`; txt.style.opacity = k === 0 ? "1" : String(clamp((e - 0.15) / 0.4)); }
          layer.querySelectorAll<HTMLElement>(".nf-line > span").forEach((sp, j) => { sp.style.transform = `translateY(${(1 - clamp((e - 0.2 - j * 0.12) / 0.45)) * 105}%)`; });
          layer.style.setProperty("--nf-s", String(1 + (1 - e) * 0.12));
        }
        // only the layer you are looking at can be clicked, tabbed to or read out
        layer.style.pointerEvents = on ? "auto" : "none";
        (layer as HTMLElement & { inert: boolean }).inert = !on;
      });
      d1.current?.classList.toggle("on", idx === 0); d2.current?.classList.toggle("on", idx === 1); d3.current?.classList.toggle("on", idx === 2);
    };
    let raf = 0; const onFrame = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); }); }; // at most one update per frame while scrolling
    tick(); window.addEventListener("scroll", onFrame, { passive: true }); window.addEventListener("resize", onFrame);
    return () => { window.removeEventListener("scroll", onFrame); window.removeEventListener("resize", onFrame); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const lines = (a: string, b: string) => <h2 className="nf-h"><span className="nf-line"><span>{a}</span></span><span className="nf-line"><span>{b}</span></span></h2>;
  return (
    <section className="sec nf" id="new" aria-label="New: Fancy colors">
      <div className="wrap"><div className="nf-pin" ref={pin}><div className="nf-hold">
        <span className="nf-bug" aria-hidden="true">NEW</span>
        <div className="nf-card">
          <div className="nf-layer nf-y" ref={y}>
            <div className="nf-txt">
              {lines("Fancy", "colors.")}
              <p className="nf-sub">One yellow stone. Zero apologies. Pink, blue, yellow and green lab-grown diamonds, IGI certified.</p>
              <Link href="/fancy-colors" className="pill nf-cta">Shop fancy colors</Link>
            </div>
            <div className="nf-img"><Image src={newFancy.img} alt="Fancy yellow cushion diamond ring" fill sizes="(max-width:767px) 92vw, 50vw" quality={82} /></div>
          </div>
          <div className="nf-layer nf-p" ref={p}>
            <div className="nf-txt">
              {lines("Pink,", "obviously.")}
              <p className="nf-sub">Fancy pink lab-grown diamonds, for people who were never going to wear white. IGI certified, naturally.</p>
              <Link href="/fancy-colors?color=Pink" className="pill nf-cta">Shop pink</Link>
            </div>
            <div className="nf-img"><Image src={newPink.img} alt="Pink diamond stud earring" fill sizes="(max-width:767px) 92vw, 50vw" quality={82} /></div>
          </div>
          <div className="nf-layer nf-g" ref={g}>
            <div className="nf-txt">
              {lines("Green", "with envy.")}
              <p className="nf-sub">Emeralds, sapphires and the colours in between. Worn lightly, meant seriously.</p>
              <Link href="/gemstones" className="pill nf-cta">Shop gemstones</Link>
            </div>
            <div className="nf-img"><Image src={newGreen.img} alt="Emerald stud earring and ring" fill sizes="(max-width:767px) 92vw, 50vw" quality={82} /></div>
          </div>
          <div className="nf-dots" aria-hidden="true"><i className="on" ref={d1} /><i ref={d2} /><i ref={d3} /></div>
        </div>
      </div></div></div>
    </section>
  );
}
