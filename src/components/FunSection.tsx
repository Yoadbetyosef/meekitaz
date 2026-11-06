"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Signature from "@/components/Signature";

/* Home, computers (approved 2026-11-06, "O3 + S2"): the page she lifted. The dancer fills the section (a fast ⅓s appearance, tinted
   to the page colour), dances once and leaves; then a small "Well, at least someone's having fun." fills with blue by itself,
   the Meekitaz signature writes, and the Shop engagement rings button rises. Two small plus marks in the corners. It starts when
   the section arrives: by the board reaching the top, or by scrolling. */
export default function FunSection() {
  const sec = useRef<HTMLElement>(null), v = useRef<HTMLVideoElement>(null), p = useRef<HTMLParagraphElement>(null);
  const [sig, setSig] = useState(false);
  useEffect(() => {
    const s = sec.current, vid = v.current, para = p.current; if (!s || !vid || !para) return;
    const words = [...para.querySelectorAll("span")];
    let started = false, goneAt = 0, raf = 0;
    const start = () => { if (started) return; started = true; if (!vid.getAttribute("src")) vid.src = "/media/dancer.mp4"; vid.muted = true; vid.currentTime = 0; vid.play().catch(() => {}); s.classList.add("fun-in"); };
    (s as HTMLElement & { __start?: () => void }).__start = start; // HeroLift calls this the moment the board reaches the top
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); }, { threshold: .55 });
    io.observe(s);
    const tick = () => {
      const gone = started && (vid.ended || (vid.duration > 0 && vid.currentTime >= vid.duration - .25));
      if (gone && !goneAt) goneAt = performance.now();
      s.classList.toggle("fun-gone", gone);
      if (goneAt) { const el = (performance.now() - goneAt) / 1000; const q = Math.max(0, Math.min(1, (el - .5) / 1.6)), n = Math.round(q * words.length); words.forEach((w, i) => w.classList.toggle("on", i < n)); if (el > 2.2) setSig(true); if (el > 3.6) s.classList.add("fun-cta"); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  return (
    <section className="fun" id="fun" ref={sec} aria-label="Well, at least someone's having fun.">
      <div className="fun-stick">
        <video ref={v} className="fun-dance" muted playsInline preload="auto" aria-hidden="true" />
        <i className="fun-tint" aria-hidden="true" />
        <i className="fl-plus p1" aria-hidden="true" /><i className="fl-plus p3" aria-hidden="true" />
        <div className="fun-line">
          <p ref={p}>{"Well, at least someone’s having fun.".split(" ").map((w, i) => <span key={i}>{w} </span>)}</p>
          <Signature on={sig} className="fun-sig" />
          <Link href="/engagement-rings" className="fun-btn">Shop engagement rings</Link>
        </div>
      </div>
    </section>
  );
}
