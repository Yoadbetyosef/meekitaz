"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Signature from "@/components/Signature";

/* Home · "Made, not mined." — the film sits small under the title and opens to a big window (not full screen) as you
   scroll; when it's open, the handwritten Meekitaz signature writes itself on it in glowing white, then a line and the button. */
export default function Film() {
  const sec = useRef<HTMLElement>(null), box = useRef<HTMLDivElement>(null), head = useRef<HTMLDivElement>(null), v = useRef<HTMLVideoElement>(null);
  const mL = useRef<HTMLDivElement>(null), mR = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const s = sec.current!, b = box.current!, h = head.current!, vid = v.current!, l = mL.current!, rr = mR.current!;
    let raf = 0, vis = false, wasOpen = false;
    const ease = (p: number) => p * p * (3 - 2 * p), cl = (x: number) => Math.min(1, Math.max(0, x));
    /* "D" (approved 2026-11-03): our M sits whole in the middle; scrolling splits it into two halves that slide apart, and the film
       opens between them like a curtain up to its full window — then the signature, line, button and sound work as before */
    const frame = () => {
      raf = 0; if (!vis) return;
      const r = s.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight, phone = W < 768;
      const p = cl(-r.top / (s.offsetHeight - H));
      const g = ease(cl((p - .12) / .7));
      const tw = phone ? W * .9 : Math.min(W * .64, 1240), th = phone ? Math.min(H * .7, tw * 1.25) : Math.min(H * .76, tw / 1.65);
      b.style.width = tw * g + "px"; b.style.height = th * (.5 + .5 * g) + "px";
      b.style.visibility = g < .01 ? "hidden" : "visible";
      b.style.top = 56 - 6 * g + "%"; b.style.borderRadius = "22px";
      const dx = (tw / 2 + 200) * ease(cl(p / .7)), mo = String(1 - cl((p - .45) / .3));
      l.style.transform = `translate(calc(-50% - ${dx}px),-50%)`; rr.style.transform = `translate(calc(-50% + ${dx}px),-50%)`;
      l.style.top = rr.style.top = 56 - 6 * g + "%"; l.style.opacity = rr.style.opacity = mo;
      h.style.opacity = String(1 - Math.min(1, ease(cl(p / .5)) * 1.6));
      const isOpen = g > .98;
      if (isOpen !== wasOpen) { if (isOpen) setOpen(true); else if (p < .2) setOpen(false); wasOpen = isOpen; }
    };
    const tick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      if (vis) { vid.play().catch(() => {}); tick(); } else vid.pause();
    }, { rootMargin: "100px" });
    io.observe(s); window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick);
    return () => { io.disconnect(); window.removeEventListener("scroll", tick); window.removeEventListener("resize", tick); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="mkopen" id="film" ref={sec} aria-label="Made, not mined">
      <div className="mko-stick">
        <div className="mko-head" ref={head}><small>Made, not mined</small><h2>Worn loudly.</h2></div>
        <div className="mko-m mko-ml" ref={mL} aria-hidden="true"><img src="/brand/meekitaz-m-white.png" alt="" /></div>
        <div className="mko-m mko-mr" ref={mR} aria-hidden="true"><img src="/brand/meekitaz-m-white.png" alt="" /></div>
        <div className={`mko-box${open ? " open" : ""}`} ref={box}>
          <video ref={v} playsInline muted loop preload="metadata" poster="/media/meekitaz-film-poster.jpg">
            <source src="/media/meekitaz-film.mp4" type="video/mp4" />
          </video>
          <div className="mko-shade" aria-hidden="true" />
          <div className="mko-over">
            <Signature on={open} />
            <div className="mko-cta">
              <p>Every stone IGI or GIA certified, grown above ground, set in New York.</p>
              <Link href="/engagement-rings" className="pill">Shop engagement rings</Link>
            </div>
          </div>
          <button className={`mko-snd${sound ? " on" : ""}`} type="button" aria-label={sound ? "Sound off" : "Sound on"}
            onClick={() => { const el = v.current!; el.muted = sound; setSound(!sound); if (!sound) el.play().catch(() => {}); }}>
            {sound ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" /></svg>
                   : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M19 9l-4 6M15 9l4 6" /></svg>}
          </button>
        </div>
      </div>
    </section>
  );
}
