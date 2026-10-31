"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Film() {
  const v = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const card = useRef<HTMLDivElement>(null), wrap = useRef<HTMLDivElement>(null);
  const [write, setWrite] = useState(false);

  // holographic card: tilts toward the pointer (drifts on its own when untouched); the handwritten signature writes itself once in view
  useEffect(() => {
    const w = wrap.current, c = card.current; if (!w || !c) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let hov = false, a = 0, raf = 0, vis = false;
    const tilt = (px: number, py: number) => {
      c.style.transform = `rotateY(${(px - .5) * 22}deg) rotateX(${(.5 - py) * 18}deg)`;
      c.style.setProperty("--hx", px * 100 + "%"); c.style.setProperty("--hy", py * 100 + "%");
    };
    const move = (e: PointerEvent) => { if (e.pointerType !== "mouse") return; hov = true; const r = c.getBoundingClientRect(); tilt((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); };
    const leave = () => { hov = false; };
    const loop = () => { if (vis && !hov && !still) { a += .008; tilt(.5 + Math.cos(a) * .28, .5 + Math.sin(a * 1.4) * .22); } raf = requestAnimationFrame(loop); };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) setWrite(true); }, { threshold: .4 });
    io.observe(w); w.addEventListener("pointermove", move); w.addEventListener("pointerleave", leave);
    if (still) tilt(.5, .5); raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); w.removeEventListener("pointermove", move); w.removeEventListener("pointerleave", leave); };
  }, []);

  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }), { threshold: 0.25, rootMargin: "300px 0px" }); // the video is fetched only when the section is near the screen
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section className="mkfilm" id="film" aria-label="Meekitaz film">
      <div className="mkfilm-in">
        <div className="mkfilm-txt">
          <h2>Made, not mined.<br />Worn loudly.</h2>
          <p>Every Meekitaz stone is IGI or GIA certified, grown above ground and set in our New York atelier. Same fire. Lighter footprint.</p>
          <Link href="/engagement-rings" className="pill">Shop engagement rings</Link>
        </div>
        <div className="mkfilm-vid hc-wrap" ref={wrap}>
          <div className="hc" ref={card}>
            <div className="hc-win">
              <video ref={v} playsInline muted loop preload="none" poster="/media/meekitaz-film-poster.jpg" onClick={() => { const el = v.current!; el.paused ? el.play() : el.pause(); }}>
                <source src="/media/meekitaz-film.mp4" type="video/mp4" />
              </video>
              <div className="mkctl">
                <button className={`mkmute${sound ? " on" : ""}`} type="button" aria-label={sound ? "Sound off" : "Sound on"} onClick={() => { const el = v.current!; el.muted = sound; setSound(!sound); if (sound === false) el.play().catch(() => {}); }}>
                  {sound ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" /></svg>
                         : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M19 9l-4 6M15 9l4 6" /></svg>}
                </button>
                <input className={`mkvol${sound ? " on" : ""}`} type="range" min={0} max={1} step={0.05} defaultValue={0.8} aria-label="Volume" onChange={e => { if (v.current) v.current.volume = +e.target.value; }} />
              </div>
            </div>
            <div className="hc-meta"><span>No. 001 / 2026</span><span>Lab-grown</span></div>
            <div className="hc-stats"><div><small>Origin</small>Grown</div><div><small>Grade</small>IGI · GIA</div><div><small>Fire</small>Same</div></div>
            <div className="hc-sheen" aria-hidden="true" /><div className="hc-glare" aria-hidden="true" />
            <svg className={`hc-sig${write ? " on" : ""}`} viewBox="0 0 640 200" aria-hidden="true"><text x="18" y="150">Meekitaz</text></svg>
          </div>
        </div>
      </div>
    </section>
  );
}
