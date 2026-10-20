"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { newFancy, newPink, newGreen } from "@/lib/data";

/** "NEW" statement block between the categories and House codes. The card pins in the viewport while the page scrolls past it,
 *  and the yellow (fancy colours) content gives way to the pink (pink stones) content as a scroll-driven crossfade. */
export default function NewFancy() {
  const pin = useRef<HTMLDivElement>(null), y = useRef<HTMLDivElement>(null), p = useRef<HTMLDivElement>(null), g = useRef<HTMLDivElement>(null), d1 = useRef<HTMLElement>(null), d2 = useRef<HTMLElement>(null), d3 = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = pin.current; if (!el) return;
    const tick = () => {
      const r = el.getBoundingClientRect(), total = Math.max(1, el.offsetHeight - window.innerHeight);
      const prog = Math.min(1, Math.max(0, -r.top / total));
      // three layers; each swap happens over a short window of the pinned scroll: yellow → pink at ~35%, pink → green at ~70%
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      const e1 = ease(Math.min(1, Math.max(0, (prog - 0.22) / 0.26))), e2 = ease(Math.min(1, Math.max(0, (prog - 0.57) / 0.26)));
      // A hard switch, no crossfade: the layer for this scroll position is shown in full, the others are hidden.
      const idx = e2 >= 0.5 ? 2 : e1 >= 0.5 ? 1 : 0;
      [y.current, p.current, g.current].forEach((el, k) => {
        if (!el) return;
        const on = k === idx;
        el.style.opacity = on ? "1" : "0";
        el.style.transform = "";
        el.style.visibility = on ? "visible" : "hidden";
        // only the layer you are looking at can be clicked, tabbed to or read out
        el.style.pointerEvents = on ? "auto" : "none";
        (el as HTMLElement & { inert: boolean }).inert = !on;
      });
      d1.current?.classList.toggle("on", idx === 0); d2.current?.classList.toggle("on", idx === 1); d3.current?.classList.toggle("on", idx === 2);
    };
    let raf = 0; const onFrame = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; tick(); }); }; // at most one update per frame while scrolling
    tick(); window.addEventListener("scroll", onFrame, { passive: true }); window.addEventListener("resize", onFrame);
    return () => { window.removeEventListener("scroll", onFrame); window.removeEventListener("resize", onFrame); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="sec nf" id="new" aria-label="New: Fancy colors">
      <div className="wrap"><div className="nf-pin" ref={pin}><div className="nf-hold">
        <span className="nf-bug" aria-hidden="true">NEW</span>
        <div className="nf-card">
          <div className="nf-layer nf-y" ref={y}>
            <div className="nf-txt">
              <h2 className="nf-h">Fancy<br />colors.</h2>
              <p className="nf-sub">One yellow stone. Zero apologies. Pink, blue, yellow and green lab-grown diamonds, IGI certified.</p>
              <Link href="/fancy-colors" className="pill nf-cta">Shop fancy colors</Link>
            </div>
            <div className="nf-img"><Image src={newFancy.img} alt="Fancy yellow cushion diamond ring" fill sizes="(max-width:767px) 92vw, 50vw" quality={82} /></div>
          </div>
          <div className="nf-layer nf-p" ref={p}>
            <div className="nf-txt">
              <h2 className="nf-h">Pink,<br />obviously.</h2>
              <p className="nf-sub">Fancy pink lab-grown diamonds, for people who were never going to wear white. IGI certified, naturally.</p>
              <Link href="/fancy-colors?color=Pink" className="pill nf-cta">Shop pink</Link>
            </div>
            <div className="nf-img"><Image src={newPink.img} alt="Pink diamond stud earring" fill sizes="(max-width:767px) 92vw, 50vw" quality={82} /></div>
          </div>
          <div className="nf-layer nf-g" ref={g}>
            <div className="nf-txt">
              <h2 className="nf-h">Green<br />with envy.</h2>
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
