"use client";
import { useEffect, useRef, useState } from "react";

export default function Film() {
  const v = useRef<HTMLVideoElement>(null);
  const [sound, setSound] = useState(false);
  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }), { threshold: .25 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section className="mkfilm" id="film" aria-label="Meekitaz film">
      <div className="mkfilm-in">
        <video ref={v} playsInline muted loop autoPlay preload="none" poster="/media/meekitaz-film-poster.jpg" onClick={() => { const el = v.current!; el.paused ? el.play() : el.pause(); }}>
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
    </section>
  );
}
