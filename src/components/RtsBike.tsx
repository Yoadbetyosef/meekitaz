"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

/* Ready to ship on the home page (approved 2026-11-09, "V2 · the arch window"): butter ground, the bicycle film (the Meekitaz boxes in her
   basket) in an arched window, a big "Ready to ship.", and a blue band running along the foot. The film plays only while on screen. */
export default function RtsBike() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = "/media/rts/bike-arch.mp4"; vid.muted = true; vid.play().catch(() => {}); }
      else vid.pause();
    }, { threshold: .2 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  const band = "Order today \u00b7 Ships today \u00b7 Free insured delivery \u00b7 30-day returns";
  return (
    <section className="rtsb" aria-label="Ready to ship">
      <div className="rtsb-in">
        <div className="rtsb-copy">
          <p className="rtsb-eye"><i />In stock</p>
          <h2 className="rtsb-h">Ready to ship.</h2>
          <p className="rtsb-it">Packed this morning. Yours by Friday.</p>
          <Link href="/ready-to-ship" className="rtsb-btn">Shop in-stock jewelry &rarr;</Link>
        </div>
        <Link href="/ready-to-ship" className="rtsb-arch" aria-label="Shop ready to ship" tabIndex={-1}>
          <video ref={v} muted loop playsInline preload="none" poster="/media/rts/bike-arch.jpg" aria-hidden="true" />
        </Link>
        <i className="rtsb-dr d1" aria-hidden="true" /><i className="rtsb-dr d2" aria-hidden="true" />
      </div>
      <div className="rtsb-band" aria-hidden="true"><div>{Array.from({ length: 8 }, (_, k) => <span key={k}>{band}</span>)}</div></div>
    </section>
  );
}
