"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { newFancy, newPink } from "@/lib/data";

/** "NEW" statement block between the categories and House codes. The card pins in the viewport while the page scrolls past it,
 *  and the yellow (fancy colours) content gives way to the pink (pink stones) content as a scroll-driven crossfade. */
export default function NewFancy() {
  const pin = useRef<HTMLDivElement>(null), y = useRef<HTMLDivElement>(null), p = useRef<HTMLDivElement>(null), d1 = useRef<HTMLElement>(null), d2 = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = pin.current; if (!el) return;
    const tick = () => {
      const r = el.getBoundingClientRect(), total = Math.max(1, el.offsetHeight - window.innerHeight);
      const prog = Math.min(1, Math.max(0, -r.top / total));
      const t = Math.min(1, Math.max(0, (prog - 0.3) / 0.4)), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // the swap happens in the middle of the pinned scroll
      if (y.current) { y.current.style.opacity = String(1 - e); y.current.style.transform = `translateY(${-24 * e}px)`; }
      if (p.current) { p.current.style.opacity = String(e); p.current.style.transform = `translateY(${24 * (1 - e)}px)`; }
      d1.current?.classList.toggle("on", e < 0.5); d2.current?.classList.toggle("on", e >= 0.5);
    };
    tick(); window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick);
    return () => { window.removeEventListener("scroll", tick); window.removeEventListener("resize", tick); };
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
          <div className="nf-dots" aria-hidden="true"><i className="on" ref={d1} /><i ref={d2} /></div>
        </div>
      </div></div></div>
    </section>
  );
}
