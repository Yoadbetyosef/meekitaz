"use client";
import { useEffect, useRef, useState } from "react";
import { loadPlan, savePlan } from "@/lib/plan";

/* Phones' home opening (approved 2026-11-10, "M2 + B"): three photos, a second and a half each, like stories — a thin ink line draws
   from the price toward the piece and stops short of it, then the price a day in big ink ("The Marquise · $15 a day"). Then a clean
   page in the photos' cream where the announcement writes itself, and the button. Computers keep their opening. */
const IW = 941, IH = 1672; // the photos' own size — the pieces' places are fractions of it
const SL = [
  { src: "/media/home/story-1.jpg", name: "The Marquise", price: 15, fx: .542, fy: .4725, tx: .64, ty: .166, gap: 42 },
  { src: "/media/home/story-2.jpg", name: "The Tennis", price: 24, fx: .442, fy: .725, tx: .58, ty: .557, gap: 30 },
  { src: "/media/home/story-3.jpg", name: "The Studs", price: 8, fx: .459, fy: .237, tx: .605, ty: .344, gap: 26 },
];
const HEAD = "We just changed how diamonds are bought.";
const SUB = "A real diamond, worn from day one, for a few dollars a day. No one else does this.";
const BEAT = 1500;

export default function PhoneStory() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 844 });
  const [at, setAt] = useState(-1); // -1 waiting · 0..2 the photos · 3 the announcement
  const [words, setWords] = useState(0);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    SL.forEach(s => { const im = new Image(); im.src = s.src; });
    const ts: number[] = [];
    const go = () => {
      SL.forEach((_, i) => ts.push(window.setTimeout(() => setAt(i), i * BEAT)));
      ts.push(window.setTimeout(() => setAt(3), SL.length * BEAT));
      const n = HEAD.split(" ").length;
      for (let k = 1; k <= n + 2; k++) ts.push(window.setTimeout(() => setWords(k), SL.length * BEAT + 400 + k * 170));
    };
    if (document.documentElement.classList.contains("mk-intro-on")) { window.addEventListener("mk-intro-lift", go, { once: true }); }
    else go();
    return () => { ts.forEach(clearTimeout); window.removeEventListener("mk-intro-lift", go); };
  }, []);
  const { w, h } = size, k = Math.max(w / IW, h / IH), ox = (w - IW * k) / 2, oy = (h - IH * k) / 2;
  const start = () => {
    savePlan({ day: loadPlan()?.day ?? 15, months: loadPlan()?.months ?? 4 }); window.dispatchEvent(new Event("mk-plan-touch"));
    const cats = document.querySelector<HTMLElement>(".home-page #shop"); if (cats) cats.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const hw = HEAD.split(" ");
  return (
    <div className="pst" ref={box} aria-label="Meekitaz">
      {SL.map((s, i) => {
        const px = ox + s.fx * IW * k, py = oy + s.fy * IH * k, sx = s.tx * w, sy = s.ty * h + 40;
        const dx = sx - px, dy = sy - py, L = Math.hypot(dx, dy) || 1, ex = px + dx / L * s.gap, ey = py + dy / L * s.gap;
        return (
          <div key={i} className={`pst-sl${at === i ? " on" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={`${s.name} — ${s.price} dollars a day`} />
            <svg className="pst-ln" viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><path d={`M${sx},${sy} Q${(sx + ex) / 2 + 30},${(sy + ey) / 2} ${ex},${ey}`} /><circle cx={ex} cy={ey} r="4" /></svg>
            <div className="pst-tag" style={{ left: sx, top: s.ty * h }}><small>{s.name}</small><b>${s.price}</b><i>a day</i></div>
          </div>
        );
      })}
      <div className="pst-bars" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i}><b className={at > i ? "full" : at === i ? "run" : ""} style={{ ["--d" as string]: `${i === 3 ? 3200 : BEAT}ms` }} /></i>)}</div>
      <div className={`pst-ann${at === 3 ? " on" : ""}`}>
        <small>Meekitaz</small>
        <p>{hw.map((x, i) => <span key={i} className={i < words ? "w" : ""}>{x} </span>)}</p>
        <em className={words > hw.length ? "w" : ""}>{SUB}</em>
        <button type="button" className={`pst-go${words > hw.length + 1 ? " w" : ""}`} onClick={start}>Start from $1 a day &rarr;</button>
      </div>
    </div>
  );
}
