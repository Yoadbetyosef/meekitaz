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
    const src = window.matchMedia("(max-width:767px)").matches ? "/media/dancer-m.mp4" : "/media/dancer.mp4";
    const reset = () => { started = false; goneAt = 0; s.classList.remove("fun-in", "fun-gone", "fun-cta"); words.forEach(w => w.classList.remove("on")); setSig(false); vid.pause(); };
    const start = () => { if (started) return; started = true; if (!vid.getAttribute("src")) vid.src = src; vid.muted = true; vid.currentTime = 0; vid.play().catch(() => {}); s.classList.add("fun-in"); };
    (s as HTMLElement & { __start?: () => void }).__start = start; // HeroLift calls this the moment the board reaches the top
    // (2026-11-08) this is the first screen now: she is ready before the blue lifts and starts dancing the moment it does
    vid.src = src; vid.preload = "auto"; vid.load();
    let gate = !document.documentElement.classList.contains("mk-intro-on"), seen = false;
    const open = () => { gate = true; if (seen) start(); };
    window.addEventListener("mk-intro-lift", open, { once: true }); window.addEventListener("mk-intro-done", open, { once: true });
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (e.isIntersecting) { if (gate) start(); } else if (started) reset(); }, { threshold: .55 }); // every return to this section plays her again
    io.observe(s);
    const tick = () => {
      const gone = started && (vid.ended || (vid.duration > 0 && vid.currentTime >= vid.duration - .25));
      if (gone && !goneAt) goneAt = performance.now();
      s.classList.toggle("fun-gone", gone);
      // "V3" (2026-11-06): all together — the line fills in .7s, the signature writes meanwhile (at half speed), the button rises with the last word
      if (goneAt) { const el = (performance.now() - goneAt) / 1000; const q = Math.max(0, Math.min(1, (el - .05) / .7)), n = Math.round(q * words.length); words.forEach((w, i) => w.classList.toggle("on", i < n)); if (el > 1.0) setSig(true); if (el > .9) s.classList.add("fun-cta"); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("mk-intro-lift", open); window.removeEventListener("mk-intro-done", open); };
  }, []);
  return (
    <section className="fun" id="fun" ref={sec} aria-label="We take diamonds seriously. Life, a little less.">
      <h1 className="fun-h1">Meekitaz — lab-grown diamond engagement rings and fine jewelry, made in New York</h1>
      <div className="fun-stick">
        <video ref={v} className="fun-dance" muted playsInline preload="auto" aria-hidden="true" />
        <i className="fun-tint" aria-hidden="true" />
        <div className="fun-tys" aria-hidden="true"><span>Take your shot.</span></div>
        <div className="fun-line">
          <i className="fl-plus p1" aria-hidden="true" /><i className="fl-plus p3" aria-hidden="true" />
          <p ref={p}>{"We take diamonds seriously.".split(" ").map((w, i) => <span key={i}>{w} </span>)}<br />{"Life, a little less.".split(" ").map((w, i) => <span key={"b" + i}>{w} </span>)}</p>
          <i className="fun-hf" aria-hidden="true" />{/* the hand reaching for the fries (approved 2026-11-08, H1 · drawn on) */}
          <Signature on={sig} className="fun-sig" />
        </div>
        <Link href="/engagement-rings" className="fun-btn">Shop engagement rings</Link>
      </div>
    </section>
  );
}
