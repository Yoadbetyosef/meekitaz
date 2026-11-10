"use client";
import { useEffect, useState } from "react";
import { loadPlan, savePlan, perDay, usdR, type Plan } from "@/lib/plan";
import { loadSetting } from "@/lib/setting";

/* Meekitaz Daily — the customer's plan inside the site's own design (approved 2026-11-09): no new bars or badges, only the site's
   filter chip, its tag row and one more price line on the cards. */
export function usePlan(): Plan | null {
  const [p, setP] = useState<Plan | null>(null);
  useEffect(() => { const r = () => setP(loadPlan()); r(); window.addEventListener("mk-plan", r); window.addEventListener("storage", r); return () => { window.removeEventListener("mk-plan", r); window.removeEventListener("storage", r); }; }, []);
  return p;
}

/** One line under the card's price, in the price's own type: "$13 a day", or "$16 a day +$1" when it's over the plan. With `ring`,
 *  a stone is shown as the whole ring — the saved setting plus this stone. */
export function PlanDay({ price, ring = false }: { price: number; ring?: boolean }) {
  const p = usePlan(); const [setP, setSetP] = useState(0);
  useEffect(() => { if (ring) setSetP(loadSetting()?.price || 0); }, [ring]);
  if (!p || !price) return null;
  const all = price + (ring ? setP : 0), d = perDay(all, p), over = d > p.day;
  return <span className={`price pl-day${over ? " over" : ""}`}>{ring && setP ? "the ring " : ""}{usdR(d)} a day{over ? <em>+{usdR(d - p.day)}</em> : null}</span>;
}

/** Under the total in Your ring and in the bag (approved 2026-11-09), made of the summary's own rows and the page's swap buttons:
 *  the ring per day on the customer's plan, "In your plan" or "$N a day over your plan", and the two ways up — raise the daily amount
 *  in one tap, or add a month. With no plan yet: "Or wear it daily" and "Make it my plan". */
export function PlanSummary({ price, cart = false, pp = false }: { price: number; cart?: boolean; pp?: boolean }) {
  const p = usePlan(); if (!price) return null;
  const btn = (txt: string, fn: () => void) => <button type="button" className="df-swap" onClick={fn}>{txt}</button>;
  if (!p) {
    const d4 = Math.ceil(price / 120);
    if (pp) return <><div className="pp-price pl-pp"><b>{usdR(d4)} a day</b><i>for 4 months · no interest</i></div><div className="pl-acts">{btn("Make it my plan", () => savePlan({ day: Math.min(50, d4), months: 4 }))}</div></>;
    return <>
      {cart ? <div><span>Or wear it daily</span><span>{usdR(d4)} a day · 4 mo</span></div>
        : <div className="df-ln pl-row"><span>Or wear it daily<em>{usdR(d4)} a day for 4 months — no interest</em></span><b>{usdR(d4)} a day</b></div>}
      <div className="pl-acts">{btn("Make it my plan", () => savePlan({ day: Math.min(50, d4), months: 4 }))}</div>
    </>;
  }
  const need = perDay(price, p), over = need - p.day, more = p.months < 4 ? perDay(price, { ...p, months: p.months + 1 }) : null;
  const acts = over > 0 && <div className="pl-acts">
    {need <= 50 && btn(`Make my plan ${usdR(need)} a day`, () => savePlan({ ...p, day: need }))}
    {more !== null && btn(`Add a month · ${usdR(more)} a day`, () => savePlan({ ...p, months: p.months + 1 }))}
  </div>;
  if (pp) return <><div className="pp-price pl-pp"><b>{usdR(need)} a day</b><i>{over <= 0 ? `✓ In your plan · ${usdR(p.day)} a day, ${p.months} mo` : `${usdR(over)} a day over your plan`}</i></div>{acts}</>;
  return <>
    {cart ? <div><span>Your plan · {usdR(p.day)} a day · {p.months} mo</span><span>{usdR(need)} a day</span></div>
      : <div className="df-ln pl-row"><span>Your plan<em>{usdR(p.day)} a day · {p.months} mo · up to {usdR(p.day * 30 * p.months)}</em></span><b>{usdR(need)} a day</b></div>}
    {over <= 0 ? <p className="pl-st ok">In your plan{over < 0 ? ` — ${usdR(-over)} a day to spare` : ""}.</p>
      : <>
        <p className="pl-st">{usdR(over)} a day over your plan.</p>
        <div className="pl-acts">
          {need <= 50 && btn(`Make my plan ${usdR(need)} a day`, () => savePlan({ ...p, day: need }))}
          {more !== null && btn(`Add a month · ${usdR(more)} a day`, () => savePlan({ ...p, months: p.months + 1 }))}
        </div>
      </>}
  </>;
}
