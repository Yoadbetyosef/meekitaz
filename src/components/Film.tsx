"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/** The film: a rounded frame grows to full screen as you scroll, the headline splits to both sides, then the copy and the button rise in. */
export default function Film() {
  const sec = useRef<HTMLElement>(null), frame = useRef<HTMLDivElement>(null), l = useRef<HTMLSpanElement>(null), r = useRef<HTMLSpanElement>(null), v = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }), { threshold: 0.1, rootMargin: "300px 0px" }); // fetched only near the screen
    io.observe(el); return () => io.disconnect();
  }, []);
  useEffect(() => {
    const s = sec.current, f = frame.current; if (!s || !f) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { s.classList.add("still"); setDone(true); return; }
    let raf = 0;
    const draw = () => {
      raf = 0;
      const b = s.getBoundingClientRect(), span = b.height - window.innerHeight;
      const t = Math.max(0, Math.min(1, -b.top / (span || 1)));
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease in-out
      const phone = window.innerWidth < 768;
      f.style.width = `${(phone ? 78 : 40) + e * (phone ? 22 : 60)}%`;
      f.style.height = `calc(${phone ? 50 : 54}vh + ${e * (phone ? 50 : 46)}vh)`;
      f.style.borderRadius = `${(phone ? 22 : 30) * (1 - e)}px`;
      if (l.current) l.current.style.transform = `translateX(${-e * 70}vw)`;
      if (r.current) r.current.style.transform = `translateX(${e * 70}vw)`;
      setDone(e > 0.85);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw();
    window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="mkfilm" id="film" aria-label="Meekitaz film" ref={sec}>
      <div className="mkfilm-pin">
        <h2 className="mkfilm-h" aria-label="Made, not mined."><span ref={l}>Made,</span><span ref={r}>not mined.</span></h2>
        <div className="mkfilm-frame" ref={frame}>
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
        <div className={`mkfilm-after${done ? " on" : ""}`}>
          <p>IGI and GIA certified, grown above ground,<br />set in our Fifth Avenue atelier.</p>
          <Link href="/engagement-rings" className="pill" tabIndex={done ? 0 : -1}>Shop engagement rings</Link>
        </div>
      </div>
    </section>
  );
}
