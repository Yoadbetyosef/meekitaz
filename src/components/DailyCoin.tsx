"use client";
import { useEffect, useRef, useState } from "react";
import type { DailyItem } from "./DailyPlan";
import { loadPlan, savePlan } from "@/lib/plan";

/* The home opening (approved 2026-11-10, "A2 · a passing row under the coin"): the Daily statement, a small pink coin that stays still —
   "Start at $15 a day" with ink + and − — and under it a slow row of real pieces passing like a boutique belt, each at its price a day:
   what the amount reaches says "✓ Yours at $15", the rest "A little more", softened. One ink button. Tied to the plan both ways. */
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const sized = (u: string) => u.startsWith("/") ? u : u + (u.includes("?") ? "&" : "?") + "width=300";

export default function DailyCoin({ items }: { items: DailyItem[] }) {
  const [day, setDay] = useState(15);
  const st = useRef<HTMLParagraphElement>(null);
  useEffect(() => { const sync = () => { const p = loadPlan(); if (p) setDay(p.day); }; sync(); window.addEventListener("mk-plan", sync); return () => window.removeEventListener("mk-plan", sync); }, []);
  const move = (d: number) => { window.dispatchEvent(new Event("mk-plan-touch")); const n = Math.max(1, Math.min(50, d)); setDay(n); const p = loadPlan(); if (p) savePlan({ ...p, day: n }); };
  // the statement writes itself once the blue lifts, as before
  useEffect(() => {
    const el = st.current; if (!el) return; const w = [...el.querySelectorAll<HTMLElement>("span")]; let raf = 0, t0 = 0;
    const tick = (now: number) => { if (!t0) t0 = now; const k = Math.min(1, (now - t0) / 1600); w.forEach((x, i) => x.classList.toggle("on", i < Math.round(k * w.length))); if (k < 1) raf = requestAnimationFrame(tick); else el.classList.add("done"); };
    const go = () => { raf = requestAnimationFrame(tick); };
    if (document.documentElement.classList.contains("mk-intro-on")) { window.addEventListener("mk-intro-lift", go, { once: true }); window.addEventListener("mk-intro-done", go, { once: true }); } else go();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("mk-intro-lift", go); window.removeEventListener("mk-intro-done", go); };
  }, []);
  const start = () => {
    window.dispatchEvent(new Event("mk-plan-touch"));
    savePlan({ day, months: loadPlan()?.months ?? 4 });
    const cats = document.querySelector<HTMLElement>(".home-page #shop, .home-page .catd");
    if (cats && cats.offsetHeight > 0) cats.scrollIntoView({ behavior: "smooth", block: "start" }); else window.dispatchEvent(new Event("mk-menu-open"));
  };
  const row = items.length ? [...items, ...items] : [];
  const words = (s: string) => s.split(" ").map((x, i) => <span key={i}>{x} </span>);
  return (
    <section className="dco" aria-label="Meekitaz Daily">
      <p className="dco-st" ref={st}>{words("Pay a little every day. Wear it from the first one.")}<mark>{words("It’s yours.")}</mark></p>
      <div className="dco-coin">
        <button type="button" className="dco-pm m" onClick={() => move(day - 1)} aria-label="A dollar less a day">−</button>
        <small>Start at</small><b>{usd(day)}</b><i>a day</i>
        <button type="button" className="dco-pm p" onClick={() => move(day + 1)} aria-label="A dollar more a day">+</button>
      </div>
      {row.length > 0 && <div className="dco-row" aria-label="What it reaches"><div className="dco-tr">
        {row.map((x, k) => { const d = Math.ceil(x[1] / 120), ok = d <= day; return (
          <a key={k} href={x[3] ? `/products/${x[3]}` : "#"} className={`dco-pc${ok ? "" : " no"}`} aria-hidden={k >= items.length}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sized(x[2])} alt={x[0]} loading="lazy" />
            <b>{usd(d)} <i>a day</i></b><span>{ok ? `✓ Yours at ${usd(day)}` : "A little more"}</span>
          </a>); })}
      </div></div>}
      <button type="button" className="dco-cta" onClick={start}>Start from $1 a day &rarr;</button>
      <div className="dco-marks"><span>No interest</span><span>No credit check</span><span>Everyone’s approved</span><span>Yours, not rented</span></div>
    </section>
  );
}
