"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePlanRoom } from "./PlanKit";
import { savePlan, saveFit, planTotal, usdR } from "@/lib/plan";

/* The smart pill.
   B2 (2026-11-11): at the top of a page the full Meekitaz; once you scroll, the name folds into the M and the chip comes in.
   U2: with a plan the chip says one thing — your amount a day — and opens the plan card.
   K3 (approved 2026-11-11): before there's a plan, the chip says "Choose your plan", and the first time someone arrives in the shop from
   the home page (the button, or scrolling on) the pill opens itself — once — into "Choose your plan": three quick picks that say what
   each buys ($5 studs & pendants · $15 rings & tennis · $30 the big ones), a slider for an exact amount, "Show me what fits". A tap
   anywhere outside the card, or Esc, closes it. */
const PRESETS: [number, string][] = [[5, "Studs, pendants"], [15, "Rings, tennis"], [30, "The big ones"]];
const SEEN = "mk_plan_intro";

export default function PillPlan(_: { onWish: () => void; onSearch: () => void }) {
  const r = usePlanRoom(); const path = usePathname();
  const [open, setOpen] = useState(false), [pick, setPick] = useState(15);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => { document.body.classList.toggle("pp-has", true); document.body.classList.toggle("pp-open", open); }, [open]);
  const [fold, setFold] = useState(false);
  useEffect(() => { const f = () => setFold(window.scrollY > 40); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, [path]);
  useEffect(() => { document.body.classList.toggle("pp-fold", fold || open); }, [fold, open]);
  // the first arrival from the home page: open "Choose your plan" by itself, once
  useEffect(() => {
    if (path !== "/" || r) return;
    const go = () => { try { if (localStorage.getItem(SEEN)) return; localStorage.setItem(SEEN, "1"); } catch { /* ignore */ } setOpen(true); };
    const onScroll = () => { if (window.scrollY > window.innerHeight * .9) { window.removeEventListener("scroll", onScroll); go(); } };
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("mk-plan-choose", go);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mk-plan-choose", go); };
  }, [path, !!r]); // eslint-disable-line react-hooks/exhaustive-deps
  // close: Esc, or a tap anywhere outside the card
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const out = (e: PointerEvent) => { if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener("keydown", k); document.addEventListener("pointerdown", out, true);
    return () => { window.removeEventListener("keydown", k); document.removeEventListener("pointerdown", out, true); };
  }, [open]);
  const choose = (d: number) => { savePlan({ day: d, months: 4 }); setOpen(false); };
  const chip = r ? <><b>{usdR(r.p.day)}</b><small>a day</small></> : <span className="pp-cta">Choose your plan</span>;
  return (
    <div className="pp-wrap" ref={wrap}>
      <button type="button" className="pp-chip" aria-expanded={open} aria-controls="pp-sheet" onClick={() => setOpen(o => !o)}>{chip}<span className="pp-dot" aria-hidden="true">{open ? "▴" : "▾"}</span></button>
      <div id="pp-sheet" className={`pp-sheet${open ? " on" : ""}`} role="dialog" aria-label={r ? "Your Meekitaz Daily plan" : "Choose your plan"} aria-hidden={!open}>
        <button type="button" className="pp-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
        {r ? (() => {
          const { p, bag, left, leftDay, fit } = r, total = planTotal(p), used = Math.min(100, total ? bag / total * 100 : 0);
          return <>
            <div className="pp-row"><span>Your plan · a day</span><b>{usdR(p.day)}</b></div>
            <input type="range" min={1} max={50} value={p.day} onChange={e => savePlan({ ...p, day: +e.target.value })} aria-label="Dollars a day" />
            <div className="pp-mo">{[1, 2, 3, 4].map(m => <button key={m} type="button" className={m === p.months ? "on" : ""} onClick={() => savePlan({ ...p, months: m })}>{m} mo</button>)}</div>
            <div className="pp-meter" aria-hidden="true"><i className="u" style={{ width: used + "%" }} /><i className="l" style={{ width: (100 - used) + "%" }} /></div>
            <div className="pp-leg"><span>{bag > 0 ? `In your bag: ${usdR(bag)}` : `Yours, up to ${usdR(total)}`}</span><span>{bag > 0 ? (left >= 0 ? `${usdR(Math.max(0, leftDay))} a day left` : `${usdR(-leftDay)} a day over`) : `${p.months} months`}</span></div>
            <label className="pp-sw"><span>Show only what fits</span><input type="checkbox" checked={fit} onChange={() => saveFit(!fit)} /><i aria-hidden="true" /></label>
          </>;
        })() : <>
          <h4 className="pp-h">Choose your plan</h4>
          <p className="pp-q">What would you like to pay a day? We’ll show you everything that fits.</p>
          <div className="pp-pre">{PRESETS.map(([d, what]) => <button key={d} type="button" className={pick === d ? "on" : ""} onClick={() => setPick(d)}><b>${d}</b><i>a day</i><small>{what}</small></button>)}</div>
          <div className="pp-row" style={{ marginTop: 12 }}><span>Or exactly</span><b>{usdR(pick)}</b></div>
          <input type="range" min={1} max={50} value={pick} onChange={e => setPick(+e.target.value)} aria-label="Dollars a day" />
          <button type="button" className="pp-go" onClick={() => choose(pick)}>Show me what fits <span aria-hidden="true">&rarr;</span></button>
        </>}
      </div>
    </div>
  );
}
