"use client";
import { useEffect, useRef, useState } from "react";

/* Pieces of the "system" trial that sit inside pages. All of them are display:none unless body.sys2 is on (see SystemLayer). */
const FACTS = ["From $1 a day", "No loans", "No interest", "No credit checks", "It’s yours, not a rental", "IGI certified", "Everyone’s approved", "Up to 4 months"];
// the six diamond cuts as plain line signs
const G = [
  '<circle cx="12" cy="12" r="9"/><path d="M12 3l4.5 4.5L21 12l-4.5 4.5L12 21l-4.5-4.5L3 12l4.5-4.5z"/>',
  '<ellipse cx="12" cy="12" rx="6.5" ry="9.5"/><path d="M12 2.5l4 5.5v8l-4 5.5-4-5.5v-8z"/>',
  '<path d="M7.5 2.5h9l3 3v13l-3 3h-9l-3-3v-13z"/><path d="M9 6.5h6l1.5 1.5v8L15 17.5H9L7.5 16V8z"/>',
  '<path d="M12 2.5c3 4.5 6.5 7.6 6.5 12a6.5 6.5 0 0 1-13 0c0-4.4 3.5-7.5 6.5-12z"/><path d="M12 7.5l3 6-3 5-3-5z"/>',
  '<path d="M12 2c4 3.5 5.5 6.8 5.5 10S16 18.5 12 22c-4-3.5-5.500-6.800-5.500-10S8 5.500 12 2z"/><path d="M12 6.500l2.500 5.500L12 17.500 9.500 12z"/>',
  '<rect x="3.5" y="3.5" width="17" height="17" rx="4.5"/><path d="M12 6.5l5.5 5.5-5.5 5.5L6.5 12z"/>',
];
const GN = ["Round", "Oval", "Emerald", "Pear", "Marquise", "Cushion"];
const live = () => typeof document !== "undefined" && document.body.classList.contains("sys2");

/** a small box where the cut and its name keep changing */
export function SysShape() {
  const [k, setK] = useState(0);
  useEffect(() => { const id = window.setInterval(() => { if (live()) setK(x => (x + 1) % 6); }, 700); return () => clearInterval(id); }, []);
  return <span className="sy-shape" aria-hidden="true"><svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: G[k] }} /><b>{GN[k]}</b></span>;
}

/** the promises, running */
export function SysTicker() {
  const one = FACTS.map((f, i) => <span key={i}>{f}<i>✦</i></span>);
  return <div className="sy-tk" aria-hidden="true"><p>{one}{one}{one}{one}</p></div>;
}

/** the name, enormous, sliding with the page: one row follows the scroll, a ghost row runs against it */
export function SysLogoBand() {
  const a = useRef<HTMLDivElement>(null), b = useRef<HTMLDivElement>(null), box = useRef<HTMLElement>(null);
  useEffect(() => {
    let raf = 0, t = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = now - last; last = now;
      if (live() && box.current) {
        const r = box.current.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          t += dt * .03; const w = (a.current?.scrollWidth || 2000) / 2, s = window.scrollY * .55 + t;
          if (a.current) a.current.style.transform = `translateX(${-(s % w)}px)`;
          if (b.current) b.current.style.transform = `translateX(${-w + (s * .6 % w)}px)`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  /* eslint-disable @next/next/no-img-element */
  const row = [0, 1, 2, 3].map(i => <img key={i} src="/brand/meekitaz-logo-white.png" alt="" loading="lazy" />);
  return (
    <section className="sy-logo" ref={box} aria-hidden="true">
      <div className="sy-lg-top"><span className="sy-cap">(Meekitaz)</span><span className="sy-cap">Serious diamonds, worn lightly</span></div>
      <div className="sy-lg-row" ref={a}>{row}</div>
      <div className="sy-lg-row ghost" ref={b}>{row}</div>
      <div className="sy-lg-bot"><span className="sy-cap">Lab-grown · IGI certified</span><span className="sy-cap">From $1 a day</span></div>
    </section>
  );
}
