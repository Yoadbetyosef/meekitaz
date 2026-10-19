"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { shopLook } from "@/lib/data";

/** "Shop the look": one editorial photo; the chips under it spotlight a piece of jewelry and offer its category. */
export default function ShopLook() {
  const stage = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState({ vw: 1, off: 0 }); // how much of the 16:9 photo is visible when the box is narrower (phones)
  useEffect(() => {
    const el = stage.current; if (!el) return;
    const calc = () => {
      const a = el.clientWidth / el.clientHeight, vw = Math.min(1, a / shopLook.aspect);
      setView({ vw, off: (1 - vw) * shopLook.focusX });
    };
    calc(); const ro = new ResizeObserver(calc); ro.observe(el); return () => ro.disconnect();
  }, []);
  const at = (p: [number, number]) => ({ x: ((p[0] / 100 - view.off) / view.vw) * 100, y: p[1] });
  const cur = shopLook.items.find(i => i.k === open);
  const pos = cur ? at(cur.p) : { x: 50, y: 50 };
  return (
    <section className="sec sl" aria-label="Shop the look">
      <div className="wrap">
        <div className="sl-head">
          <div><small className="eyebrow">Shop the look</small><h2 className="h2">Everything she&rsquo;s wearing</h2></div>
          <p className="sl-sub">Tap a piece. Every one of them lives in a category.</p>
        </div>
        <div className="sl-stage" ref={stage}>
          <Image src={shopLook.img} alt="Laughing woman in an open convertible wearing yellow cushion diamond studs, a tennis necklace, an oval diamond ring and stacked tennis bracelets" fill sizes="(max-width:767px) 100vw, 1200px" quality={80} style={{ objectFit: "cover", objectPosition: `${shopLook.focusX * 100}% 50%` }} />
          <div className={`sl-dim${cur ? " on" : ""}`} style={{ ["--x" as string]: `${pos.x}%`, ["--y" as string]: `${pos.y}%` }} aria-hidden="true" />
          {cur && <Link href={cur.href} className="sl-go" style={{ left: `${Math.min(88, Math.max(12, pos.x))}%`, top: `${pos.y}%` }}>Shop {cur.label.toLowerCase()} &rarr;</Link>}
          <div className="sl-chips" role="group" aria-label="Pieces in this photo">
            {shopLook.items.map(i => <button key={i.k} type="button" className={open === i.k ? "on" : ""} aria-pressed={open === i.k} onClick={() => setOpen(open === i.k ? null : i.k)}>{i.label}</button>)}
          </div>
        </div>
      </div>
    </section>
  );
}
