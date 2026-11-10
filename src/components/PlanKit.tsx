"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { loadPlan, savePlan, loadFit, saveFit, perDay, planTotal, usdR, type Plan } from "@/lib/plan";
import { useCart } from "./CartProvider";
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
  const r = usePlanRoom(); const [setP, setSetP] = useState(0);
  useEffect(() => { if (ring) setSetP(loadSetting()?.price || 0); }, [ring]);
  if (!r || !price) return null;
  const all = price + (ring ? setP : 0), d = perDay(all, r.p), room = Math.max(0, r.leftDay), over = d > room;
  return <span className={`price pl-day${over ? " over" : ""}`}>{ring && setP ? "the ring " : ""}{usdR(d)} a day{over ? <em>+{usdR(d - room)}</em> : null}</span>;
}

/** The plan with the bag counted: what's in the bag, what's left of the plan (total and per day). */
export function usePlanRoom() {
  const p = usePlan(); const { cart, rings } = useCart(); const [fit, setFit] = useState(true);
  useEffect(() => { const r = () => setFit(loadFit()); r(); window.addEventListener("mk-plan", r); return () => window.removeEventListener("mk-plan", r); }, []);
  if (!p) return null;
  const bag = Number(cart?.subtotal ?? 0) + rings.reduce((t, x) => t + x.setting.price + x.stone.price, 0);
  return { p, bag, left: planTotal(p) - bag, leftDay: p.day - (bag > 0 ? perDay(bag, p) : 0), fit };
}

/** The plan circle (approved 2026-11-09): bottom-left, in the site's floating-circle language (the bag, Marcel) — pink glass, an ink
 *  number. The daily budget; with something in the bag, what's left a day; over it, ink with "+$N". + and − move the budget a dollar
 *  a day; a tap opens the plan panel (the filter panel's own pieces). Only once a plan has been started. */
export function PlanOrb() {
  const r = usePlanRoom(); const [open, setOpen] = useState(false);
  // (2026-11-10) on the home page it waits: the opening already shows the coin, so the circle only comes in once they scroll on or
  // press something in the opening (+ / − / Start); everywhere else it shows straight away
  const path = usePathname(); const [woke, setWoke] = useState(false);
  useEffect(() => {
    if (path !== "/") { setWoke(true); return; }
    setWoke(false);
    const s = () => { if (window.scrollY > window.innerHeight * .6) setWoke(true); };
    const t = () => setWoke(true);
    s(); window.addEventListener("scroll", s, { passive: true }); window.addEventListener("mk-plan-touch", t);
    return () => { window.removeEventListener("scroll", s); window.removeEventListener("mk-plan-touch", t); };
  }, [path]);
  if (!r || !woke) return null;
  const { p, bag, left, leftDay, fit } = r, over = leftDay < 0;
  return (
    <>
      <div className="pl-orb-w">
        <button type="button" className={`pl-orb${over ? " over" : ""}`} onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label="Your plan">
          <b>{over ? "+" + usdR(-leftDay) : usdR(bag > 0 ? leftDay : p.day)}</b><small>{over ? "over a day" : bag > 0 ? "a day left" : "a day"}</small>
        </button>
        <div className="pl-pm">
          <button type="button" aria-label="A dollar more a day" onClick={() => savePlan({ ...p, day: Math.min(50, p.day + 1) })}>+</button>
          <button type="button" aria-label="A dollar less a day" onClick={() => savePlan({ ...p, day: Math.max(1, p.day - 1) })}>−</button>
        </div>
      </div>
      {open && <div className="pl-panel"><div className="rf-pop">
        <span className="rf-lbl">Your plan</span>
        <div className="pl-pan-h"><span>A day</span><b>{usdR(p.day)}</b></div>
        <div className="rf-pills">{[1, 2, 3, 4].map(m => <button key={m} type="button" className={`rf-pill${m === p.months ? " on" : ""}`} onClick={() => savePlan({ ...p, months: m })}>{m} mo</button>)}</div>
        <p className="pl-pan-n">Yours, up to {usdR(planTotal(p))}.{bag > 0 ? ` In your bag: ${usdR(bag)} — ${left >= 0 ? usdR(left) + " left" : usdR(-left) + " over"}.` : ""}</p>
        <label className="rf-chk"><input type="checkbox" checked={fit} onChange={() => saveFit(!fit)} />Show what fits first</label>
      </div></div>}
    </>
  );
}

/** The site's own grid tile, between what fits and what's a little more. */
export function PlanTile() {
  return <div className="pgrid-slot"><div className="op-tile">{/* eslint-disable-next-line @next/next/no-img-element */}<img src="/media/rings-style-tile.webp" alt="" loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /><span className="op-cap"><small>Your plan</small><b>Just a little more &rarr;</b></span></div></div>;
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
