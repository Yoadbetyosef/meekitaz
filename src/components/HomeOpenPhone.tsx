"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Signature from "@/components/Signature";

/* The home page's first screen — phones and (approved 2026-11-09, "C2 · full height") computers: straight after the blue — no dancer. The brand film, small and square,
   slides in from the left and sits flush in the bottom-left corner just above Safari's bar; the line slides in from the side and writes
   itself letter by letter; the signature; the button in the middle; the hand comes in from beyond the right edge with the fries — the
   hand and the button never touch the film. Sizes of the hand and the words as before. */
const L1 = "We take diamonds seriously.", L2 = "Life, a little less.";

export default function HomeOpenPhone() {
  const sec = useRef<HTMLElement>(null), v = useRef<HTMLVideoElement>(null), p = useRef<HTMLParagraphElement>(null);
  const [sig, setSig] = useState(false);
  useEffect(() => {
    const s = sec.current, vid = v.current, para = p.current; if (!s || !vid || !para) return;
    let raf = 0, t0 = 0;
    const chars = [...para.querySelectorAll<HTMLElement>("span")];
    const tick = (now: number) => {
      if (!t0) t0 = now; const el = (now - t0) / 1000 - .9;
      const n = Math.round(Math.max(0, Math.min(1, el / 2)) * chars.length); chars.forEach((c, i) => c.classList.toggle("on", i < n));
      if (el > 2.1) setSig(true);
      if (el < 3.2) raf = requestAnimationFrame(tick);
    };
    // (2026-11-09) no jump: the film is chosen and loaded right away (paused, its poster = its own first frame), and the entrance runs
    // exactly once — before, the lift and the done events each restarted it, reloading the film mid-slide
    const phone = window.matchMedia("(max-width:767px)").matches;
    vid.poster = phone ? "/media/home/open-film-m0.jpg" : "/media/home/open-film-d0.jpg";
    vid.preload = "auto"; vid.muted = true; vid.src = phone ? "/media/home/open-film-m.mp4?v=2" : "/media/home/open-film-d.mp4";
    let started = false;
    const go = () => { if (started) return; started = true; s.classList.add("on"); vid.play().catch(() => {}); raf = requestAnimationFrame(tick); };
    const html = document.documentElement;
    if (html.classList.contains("mk-intro-on")) { window.addEventListener("mk-intro-lift", go, { once: true }); window.addEventListener("mk-intro-done", go, { once: true }); }
    else go();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mk-intro-lift", go); window.removeEventListener("mk-intro-done", go); };
  }, []);
  const ch = (s: string, k: string) => [...s].map((c, i) => c === " " ? " " : <span key={k + i}>{c}</span>);
  return (
    <section className="hop" ref={sec} aria-label="We take diamonds seriously. Life, a little less.">
      <div className="hop-film"><video ref={v} muted loop playsInline preload="none" aria-hidden="true" /><i className="hop-pl d" aria-hidden="true" /></div>
      <p className="hop-line" ref={p}>{ch(L1, "a")}<br />{ch(L2, "b")}</p>
      <Signature on={sig} className="hop-sig" />
      <Link href="/engagement-rings" className="hop-cta">Shop engagement rings</Link>
      <i className="hop-hand" aria-hidden="true" />
      <i className="hop-pl a" aria-hidden="true" /><i className="hop-pl b" aria-hidden="true" /><i className="hop-pl c" aria-hidden="true" />
    </section>
  );
}
