"use client";
import { useEffect, useRef } from "react";

/* Home, computers (2026-11-06): the page she lifted. The dancer herself is the fixed film HeroLift runs over the page; this section
   is the page colour, and "Well, at least someone's having fun." fills with blue as you scroll once she has left (body.dancer-gone). */
export default function FunSection() {
  const sec = useRef<HTMLElement>(null), p = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const s = sec.current, para = p.current; if (!s || !para) return;
    const words = [...para.querySelectorAll("span")]; let raf = 0;
    const tick = () => {
      const gone = document.body.classList.contains("dancer-gone");
      s.classList.toggle("fun-gone", gone);
      const r = s.getBoundingClientRect(), pr = Math.max(0, Math.min(1, -r.top / (s.offsetHeight - window.innerHeight)));
      const q = gone ? Math.max(0, Math.min(1, (pr - .05) / .7)) : 0, n = Math.round(q * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <section className="fun" id="fun" ref={sec} aria-label="Well, at least someone's having fun.">
      <div className="fun-stick"><div className="fun-line"><p ref={p}>{"Well, at least someone’s having fun.".split(" ").map((w, i) => <span key={i}>{w} </span>)}</p></div></div>
    </section>
  );
}
