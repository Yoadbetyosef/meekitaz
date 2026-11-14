"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadPlan, savePlan, usdR } from "@/lib/plan";

/* The price moment (approved "A", 2026-11-14). The home page's "Find yours at your price" no longer jumps down the page and drops the
   small plan card from the pill: the page stays where it is and a blue circle opens out of the button until the whole screen is the
   price — one giant number, a line to drag, what that amount buys. Close puts you back exactly where you were. "Show me what fits"
   saves the plan, and the blue folds up into the pill (which now shows the amount) while the shop is already underneath.
   Opened with the window event "mk-price-open" ({ x, y } = where the circle starts). The earlier behaviour is in DESIGNS.md. */
const what = (d: number) => d < 10 ? "Studs, pendants." : d < 25 ? "Rings, tennis." : "The big ones.";

export default function PriceMoment() {
  const [ready, setReady] = useState(false), [on, setOn] = useState(false), [day, setDay] = useState(15), [months, setMonths] = useState(4);
  const el = useRef<HTMLDivElement>(null), done = useRef<HTMLButtonElement>(null);
  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    const open = (e: Event) => {
      const d = (e as CustomEvent).detail as { x?: number; y?: number } | undefined;
      const p = loadPlan(); if (p) { setDay(p.day); setMonths(p.months); }
      el.current?.style.setProperty("--cx", (d?.x ?? window.innerWidth / 2) + "px");
      el.current?.style.setProperty("--cy", (d?.y ?? window.innerHeight * .6) + "px");
      requestAnimationFrame(() => setOn(true));
    };
    window.addEventListener("mk-price-open", open);
    return () => window.removeEventListener("mk-price-open", open);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("pm-lock", on);
    if (!on) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOn(false); };
    window.addEventListener("keydown", k);
    const t = window.setTimeout(() => done.current?.focus({ preventScroll: true }), 700);
    return () => { window.removeEventListener("keydown", k); clearTimeout(t); document.documentElement.classList.remove("pm-lock"); };
  }, [on]);
  const finish = () => {
    savePlan({ day, months });
    try { localStorage.setItem("mk_plan_intro", "1"); } catch { /* ignore */ }
    // the shop slides in underneath, unseen, then the blue folds up into the pill
    const shop = document.querySelector<HTMLElement>(".home-page #shop");
    if (shop) window.scrollTo({ top: shop.getBoundingClientRect().top + window.scrollY, behavior: "instant" as ScrollBehavior });
    const chip = document.querySelector<HTMLElement>(".pp-chip")?.getBoundingClientRect();
    el.current?.style.setProperty("--cx", (chip && chip.width ? chip.left + chip.width / 2 : window.innerWidth - 90) + "px");
    el.current?.style.setProperty("--cy", (chip && chip.width ? chip.top + chip.height / 2 : 44) + "px");
    requestAnimationFrame(() => setOn(false));
  };
  if (!ready) return null;
  return createPortal(
    <div className={`pm${on ? " on" : ""}`} ref={el} role="dialog" aria-modal="true" aria-label="Your price a day" aria-hidden={!on}>
      <div className="pm-top"><span>(Your price)</span><button type="button" onClick={() => setOn(false)} tabIndex={on ? 0 : -1}>Close ×</button></div>
      <div className="pm-mid">
        <p className="pm-num" aria-live="polite"><span>{usdR(day)}</span><small>a day</small></p>
        <p className="pm-what">{what(day)}</p>
        <div className="pm-ctl">
          <input type="range" min={1} max={50} value={day} onChange={e => setDay(+e.target.value)} aria-label="Dollars a day" tabIndex={on ? 0 : -1} />
          <div className="pm-ends"><span>$1</span><span>Yours, up to {usdR(day * 30 * months)} · {months} {months === 1 ? "month" : "months"}</span><span>$50</span></div>
        </div>
        <div className="pm-pre">{[5, 15, 30].map(d => <button key={d} type="button" className={d === day ? "on" : ""} onClick={() => setDay(d)} tabIndex={on ? 0 : -1}>${d}</button>)}</div>
      </div>
      <button type="button" className="pm-done" ref={done} onClick={finish} tabIndex={on ? 0 : -1}><span>Show me what fits</span><span aria-hidden="true">&rarr;</span></button>
    </div>, document.body);
}
