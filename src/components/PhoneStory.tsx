"use client";
import { useEffect, useRef, useState } from "react";
import Signature from "./Signature";

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
const FACES = ["maya", "david", "jess", "linda"];
const BEAT = 1500;

export default function PhoneStory() {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 390, h: 844 });
  const [at, setAt] = useState(-1); // -1 waiting · 0..2 the photos · 3 the announcement
  const [words, setWords] = useState(0);
  const [sigOn, setSigOn] = useState(false);
  const [subN, setSubN] = useState(0); // (2026-11-11) the small line types too — quickly, ~1.1s
  useEffect(() => { if (words <= HEAD.length) { setSubN(0); return; } let n = 0; const id = window.setInterval(() => { n += 1; setSubN(n); if (n >= SUB.length) clearInterval(id); }, 13); return () => clearInterval(id); }, [words]);
  useEffect(() => { if (words > HEAD.length) { const t = window.setTimeout(() => setSigOn(true), 4800); return () => clearTimeout(t); } }, [words]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight })); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    SL.forEach(s => { const im = new Image(); im.src = s.src; });
    const ts: number[] = [];
    const go = () => {
      SL.forEach((_, i) => ts.push(window.setTimeout(() => setAt(i), i * BEAT)));
      ts.push(window.setTimeout(() => setAt(3), SL.length * BEAT));
      const n = HEAD.length;
      for (let k = 1; k <= n; k++) ts.push(window.setTimeout(() => setWords(k), SL.length * BEAT + 500 + k * 45));
      ts.push(window.setTimeout(() => setWords(n + 1), SL.length * BEAT + 500 + n * 45 + 250));
    };
    if (document.documentElement.classList.contains("mk-intro-on")) { window.addEventListener("mk-intro-lift", go, { once: true }); }
    else go();
    return () => { ts.forEach(clearTimeout); window.removeEventListener("mk-intro-lift", go); };
  }, []);
  const { w, h } = size, desk = w >= 768;
  // phones: the photo fills the screen · computers ("L2"): a full-height column on the left at the photos' own ratio, the price beside it
  const colW = desk ? Math.round(h * IW / IH) : w;
  const k = desk ? h / IH : Math.max(w / IW, h / IH), ox = desk ? 0 : (w - IW * k) / 2, oy = desk ? 0 : (h - IH * k) / 2;
  const DT = [.305, .549, .293];
  const start = () => {
    // (2026-11-11, K3) the button doesn't pick an amount for them: it glides to the shop and opens "Choose your plan"
    const cats = document.querySelector<HTMLElement>(".home-page #shop"); if (cats) cats.scrollIntoView({ behavior: "smooth", block: "start" });
    try { localStorage.removeItem("mk_plan_intro"); } catch { /* ignore */ }
    window.setTimeout(() => window.dispatchEvent(new Event("mk-plan-choose")), 700);
  };
  const hw = HEAD.split(" ");
  return (
    <div className="pst" ref={box} aria-label="Meekitaz">
      {SL.map((s, i) => {
        const px = ox + s.fx * IW * k, py = oy + s.fy * IH * k;
        const tx = desk ? colW + 100 : s.tx * w, ty = desk ? DT[i] * h : s.ty * h;
        const sx = desk ? tx - 10 : tx, sy = ty + (desk ? 72 : 40);
        const dx = sx - px, dy = sy - py, L = Math.hypot(dx, dy) || 1, ex = px + dx / L * s.gap, ey = py + dy / L * s.gap;
        return (
          <div key={i} className={`pst-sl${at === i ? " on" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={`${s.name} — ${s.price} dollars a day`} style={desk ? { width: colW, right: "auto" } : undefined} />
            <svg className="pst-ln" viewBox={`0 0 ${w} ${h}`} aria-hidden="true"><path d={`M${sx},${sy} Q${(sx + ex) / 2 + 30},${(sy + ey) / 2} ${ex},${ey}`} /><circle cx={ex} cy={ey} r="4" /></svg>
            <div className="pst-tag" style={{ left: tx, top: ty }}><small>{s.name}</small><b>${s.price}</b><i>a day</i></div>
          </div>
        );
      })}
      {/* the announcement (approved 2026-11-10, "T1"): typed letter by letter; the small line; what we don't do struck through in ink one
          by one and what we do underlined; one button; five stars with faces; the Meekitaz signature, "We promise."; the hand with the fries */}
      <div className={`pst-ann${at === 3 ? " on" : ""}${words > HEAD.length ? " done" : ""}`}>
        <i className="pst-pl l" aria-hidden="true" /><i className="pst-pl r" aria-hidden="true" />
        <p className="pst-h" aria-label={HEAD}>{(() => { let c = 0; return HEAD.split(" ").map((w, i) => { const word = <span key={i} className="pst-wd" aria-hidden="true">{[...w].map((ch, j) => { const k = c++; return <span key={j} className={k < words ? "w" : ""}>{ch}</span>; })}</span>; c++; return [word, " "]; }); })()}</p>
        <em className="pst-sub" aria-label={SUB}>{(() => { let c = 0; return SUB.split(" ").map((w, i) => { const word = <span key={i} className="pst-wd" aria-hidden="true">{[...w].map((ch, j) => { const k = c++; return <span key={j} className={k < subN ? "w" : ""}>{ch}</span>; })}</span>; c++; return [word, " "]; }); })()}</em>
        <div className="pst-prom"><span><s>Loans</s> &amp; <s>interest</s></span><span><s>Credit checks</s></span><span><s>Rentals</s> — it’s yours</span><span><u>Everyone’s approved</u></span></div>
        <div className="pst-cta"><button type="button" className="pst-go" onClick={start}>Find yours at your price <span aria-hidden="true">&rarr;</span></button><small>From $1 a day · up to 4 months</small></div>
        <div className="pst-trust">
          <div className="pst-rev"><span className="pst-faces">{FACES.map(k => <img key={k} src={`/media/daily/faces/${k}.jpg`} alt="" />)}</span><div><b>5.0</b> <i aria-label="five stars">★★★★★</i><small>Loved by our clients</small></div></div>
          <div className="pst-signed"><Signature on={sigOn} className="pst-sig" /><small>We promise.</small></div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pst-hf" src="/media/home/hand-fries-ink.webp" alt="" aria-hidden="true" />
        <span className="pst-hfl">Less than your fries. Shinier, too.</span>
      </div>
    </div>
  );
}
