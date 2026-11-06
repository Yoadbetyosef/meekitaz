"use client";
import { useEffect, useRef } from "react";

/* Home, computers (approved 2026-11-06): the page she lifted. The dancer fills the whole section (her studio blends into the page
   colour — no frame), dances once and leaves; then "Well, at least someone's having fun." fills with blue as you scroll. */
export default function FunSection() {
  const sec = useRef<HTMLElement>(null), v = useRef<HTMLVideoElement>(null), p = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const s = sec.current, vid = v.current, para = p.current; if (!s || !vid || !para) return;
    const words = [...para.querySelectorAll("span")];
    let started = false, raf = 0;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting && !started) { started = true; if (!vid.getAttribute("src")) vid.src = "/media/dancer.mp4"; vid.muted = true; vid.play().catch(() => {}); } }, { threshold: .4 });
    io.observe(s);
    const tick = () => {
      const gone = started && (vid.ended || (vid.duration > 0 && vid.currentTime >= vid.duration - .25));
      s.classList.toggle("fun-gone", gone);
      const r = s.getBoundingClientRect(), pr = Math.max(0, Math.min(1, -r.top / (s.offsetHeight - window.innerHeight)));
      const q = gone ? Math.max(0, Math.min(1, (pr - .05) / .7)) : 0, n = Math.round(q * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  // the dancer can be handed in from the hero (HeroLift) mid-dance: it reads this element by id
  return (
    <section className="fun" id="fun" ref={sec} aria-label="Well, at least someone's having fun.">
      <div className="fun-stick">
        <video ref={v} className="fun-dance" id="fun-dance" muted playsInline preload="none" aria-hidden="true" />
        <div className="fun-line"><p ref={p}>{"Well, at least someone’s having fun.".split(" ").map((w, i) => <span key={i}>{w} </span>)}</p></div>
      </div>
    </section>
  );
}
