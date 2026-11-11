"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
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
  const p = usePlan(); const { cart, rings } = useCart(); const [fit, setFit] = useState(false);
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
    // (2026-11-10) never leaves the page: the button starts the plan right here, at this piece's own price a day
    if (pp) return <div className="pl-acts">{btn(`Start at ${usdR(d4)} a day →`, () => savePlan({ day: Math.min(50, d4), months: 4 }))}</div>;
    if (!cart) return <div className="pl-acts">{btn(`Start at ${usdR(d4)} a day →`, () => savePlan({ day: Math.min(50, d4), months: 4 }))}</div>;
    return <>
      <div><span>Or wear it daily</span><span>{usdR(d4)} a day · 4 mo</span></div>
      <div className="pl-acts">{btn("Make it my plan", () => savePlan({ day: Math.min(50, d4), months: 4 }))}</div>
    </>;
  }
  const need = perDay(price, p), over = need - p.day, more = p.months < 4 ? perDay(price, { ...p, months: p.months + 1 }) : null;
  const acts = over > 0 && <div className="pl-acts">
    {need <= 50 && btn(`Make my plan ${usdR(need)} a day`, () => savePlan({ ...p, day: need }))}
    {more !== null && btn(`Add a month · ${usdR(more)} a day`, () => savePlan({ ...p, months: p.months + 1 }))}
  </div>;
  if (pp) return <>{acts}</>;
  if (!cart) return <>{acts}</>;
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


/** The four small promises (approved "Q1"), wherever the offer shows. */
export function PlanPromises() {
  return <div className="d-pills"><span>No interest</span><span>No credit check</span><span>Everyone’s approved</span><span>Yours, not rented</span></div>;
}

/** Daily in every category (approved 2026-11-10, "I2"): one tile in the grid, in the place and size of the site's own tile — the pink
 *  coin, "From $1 a day". Only for those who haven't started a plan (with a plan the grid already speaks it). */
export function DailyTile() {
  const p = usePlan(); if (p) return null;
  // (2026-11-10) stays in the category: a tap starts the plan at $15 a day and the grid re-orders itself around it on the spot
  return <div className="pgrid-slot"><button type="button" className="d-tile" onClick={() => { savePlan({ day: 15, months: 4 }); window.scrollTo({ top: Math.max(0, (document.querySelector(".pgrid") as HTMLElement | null)?.getBoundingClientRect().top ?? 0) + window.scrollY - 140, behavior: "smooth" }); }}><span className="d-coin"><b>$1</b><i>a day</i></span><h4>From $1 a day.</h4><p>Wear it now. Pay a little every day.</p><span className="d-go">Start at $15 a day &rarr;</span></button></div>;
}

/** On a product page: tell the smart pill this piece's price a day and whether it fits what's left. */
export function PlanCtxProduct({ price }: { price: number }) {
  const r = usePlanRoom(); const d = r ? perDay(price, r.p) : 0, fits = r ? price <= Math.max(0, r.left) : false;
  useEffect(() => { if (r && price) window.dispatchEvent(new CustomEvent("mk-plan-ctx", { detail: { kind: "prod", perDay: d, fits } })); }, [d, fits, !!r, price]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

/** The card's price on a plan (approved 2026-11-11, "C1"): the price a day leads, big; under it the regular line — From $1,239, the
 *  struck compare-at and the % off; then "In your plan" (green dot) or "$5 more a day". Without a plan it shows nothing and the card's
 *  own price line stays as it was. */
export function PlanCardPrice({ price, compareAt, from, fmt }: { price: number; compareAt?: number | null; from?: boolean; fmt: (n: number) => string }) {
  const r = usePlanRoom();
  if (!r || !price) return null;
  const d = perDay(price, r.p), room = Math.max(0, r.leftDay), over = d > room;
  const off = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
  return (
    <span className="plc">
      <span className="plc-day"><b>{usdR(d)}</b><i>a day</i></span>
      <span className="plc-full">{from && <>From </>}{fmt(price)}{compareAt && compareAt > price ? <s>{fmt(compareAt)}</s> : null}{off > 0 && <em>{off}% off</em>}</span>
      {over ? <span className="plc-more">{usdR(d - room)} more a day</span> : <span className="plc-fit">In your plan</span>}
    </span>
  );
}

/** The price system (approved 2026-11-11, "A · day first"), the same everywhere on the site:
 *  1 · the price a day — always the biggest number;  2 · one quiet line — From $X · the struck price · % off;
 *  3 · where you stand — ● In your plan, or "$N more a day" (only once a plan is started). Only the size changes with the place:
 *  L product page · M ring builder / totals · S cards · XS lists. With `ring`, a stone shows the whole ring a day (the saved setting + it). */
export function PriceA({ price, compareAt, from = false, size = "S", ring = false, status = true, note, fmt }: { price: number; compareAt?: number | null; from?: boolean; size?: "L" | "M" | "S" | "XS"; ring?: boolean; status?: boolean; note?: string; fmt?: (n: number) => string }) {
  const r = usePlanRoom(); const [setP, setSetP] = useState(0);
  useEffect(() => { if (ring) setSetP(loadSetting()?.price || 0); }, [ring]);
  if (!price) return null;
  const f = fmt || usdR, months = r?.p.months ?? 4, all = price + (ring ? setP : 0), d = Math.ceil(all / (30 * months));
  const room = r ? Math.max(0, r.leftDay) : 0, over = !!r && d > room;
  const off = compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : 0;
  return (
    <span className={`plc plc-${size}`}>
      <span className="plc-day"><b>{usdR(d)}</b><i>a day{ring && setP ? " · the ring" : ""}</i></span>
      <span className="plc-full">{from && <>From </>}{f(price)}{off > 0 && <><s>{f(compareAt!)}</s><em>{off}% off</em></>}{note && <span className="plc-note">{note}</span>}</span>
      {status && r && (over ? <span className="plc-more">{usdR(d - room)} more a day</span> : <span className="plc-fit">In your plan</span>)}
    </span>
  );
}

/** The plan, said simply (approved 2026-11-11, "U2", no count): one sentence above the grid and one switch — Only these / Show all.
 *  No number: the grid loads in pages, so any count would be a guess. */
export function PlanBanner({ noun }: { fit?: number; noun: string }) {
  const r = usePlanRoom(); if (!r) return null;
  const roomDay = Math.max(0, r.leftDay), bag = r.bag > 0;
  return (
    <div className="plb">
      <span className="plb-t">{r.fit
        ? <>Every {noun.replace(/s$/, "")} here is yours for <b>{usdR(roomDay)} a day</b> or less{bag ? " — after what’s in your bag" : ""}.</>
        : <>Showing all {noun}. <span className="plb-dot" aria-hidden="true" /> marks what’s within <b>{usdR(roomDay)} a day</b>.</>}</span>
      <span className="plb-tg" role="group" aria-label="Show"><button type="button" className={r.fit ? "on" : ""} aria-pressed={r.fit} onClick={() => saveFit(true)}>Only these</button><button type="button" className={r.fit ? "" : "on"} aria-pressed={!r.fit} onClick={() => saveFit(false)}>Show all</button></span>
    </div>
  );
}


/** When nothing loaded fits the plan (approved 2026-11-11, "E1"): never an empty page. "Rings start at $11 a day." — the category's
 *  cheapest pieces (asked from the store, lowest price first), each with how much more a day it is, one button that raises the plan
 *  to the first of them, and "Show all". */
export function PlanEmpty({ handle, noun }: { handle: string; noun: string }) {
  const r = usePlanRoom();
  const [near, setNear] = useState<{ handle: string; title: string; price: number; img?: string }[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/products?handle=${encodeURIComponent(handle)}&sort=price_asc`).then(x => x.json()).then((j: { products?: { handle: string; title: string; price: string; image?: { url: string } }[] }) => {
      if (live) setNear((j.products || []).filter(x => +x.price > 0).slice(0, 3).map(x => ({ handle: x.handle, title: x.title, price: +x.price, img: x.image?.url })));
    }).catch(() => live && setNear([]));
    return () => { live = false; };
  }, [handle]);
  if (!r) return null;
  const roomDay = Math.max(0, r.leftDay), first = near && near[0] ? perDay(near[0].price, r.p) : 0;
  const need = first ? Math.min(50, first + (r.p.day - roomDay)) : 0; // what the plan must be so the cheapest fits after the bag
  return (
    <div className="pe">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pe-ic" src="/media/passage/k1.png" alt="" aria-hidden="true" />
      <h3>{first ? <>{noun.charAt(0).toUpperCase() + noun.slice(1)} start at {usdR(first)} a day.</> : <>Nothing here at {usdR(roomDay)} a day yet.</>}</h3>
      <p>{first ? <>Nothing here at {usdR(roomDay)} a day yet — these are the closest.</> : <>Show all {noun}, or try a little more a day.</>}</p>
      {near && near.length > 0 && <div className="pe-near">{near.map(x => { const d = perDay(x.price, r.p); return (
        <Link key={x.handle} href={`/products/${x.handle}`} className="pe-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {x.img && <img src={x.img + (x.img.includes("?") ? "&" : "?") + "width=400"} alt={x.title} loading="lazy" />}
          <span className="pe-nm">{x.title}</span>
          <span className="pe-day"><b>{usdR(d)}</b><i>a day</i></span>
          <span className="pe-more">+{usdR(Math.max(0, d - roomDay))} a day</span>
        </Link>); })}</div>}
      <div className="pe-acts">
        {need > 0 && <button type="button" className="pe-btn" onClick={() => savePlan({ ...r.p, day: need })}>Make it {usdR(need)} a day <span aria-hidden="true">&rarr;</span></button>}
        <button type="button" className="pe-lnk" onClick={() => saveFit(false)}>Show all {noun}</button>
      </div>
    </div>
  );
}