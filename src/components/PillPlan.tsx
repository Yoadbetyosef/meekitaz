"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { usePlanRoom } from "./PlanKit";
import { useCart } from "./CartProvider";
import { wishList } from "@/lib/wish";
import PillAide, { type ProdCtx } from "./PillAide";
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

/* (2026-11-16) TRIAL, behind the private "Pill" switch (meekitaz.com/?look=1): the pill winks. For about two seconds it opens wide
   with one of our drawings and a short line, then goes back to what it was: after adding to the bag, after saving to the Dream list,
   on a product page (this piece's price a day on your plan, or how much more a day it needs), once when you come back with a full
   bag, and at the foot of the page the swallow lands on it. Direct answers (bag, saved) always show; the quiet ones show at most once
   a page and three times a visit, and never while the plan card is open. The private switch also has a "colours" setting. */
type Wink = { kind: "bag" | "saved" | "fits" | "over" | "back" | "bird"; text: string; ic?: string };
const pillOn = () => { try { const c = document.documentElement.classList; return c.contains("pw1") || c.contains("pw2"); } catch { return false; } };
// (2026-11-17) the switch now turns on the assistant pill (html.pa1, see PillAide.tsx); the winks (pw1/pw2) stay in the code, switched off
const KEY_PW = "mk-pa", SHOW_PW = "mk-look-show", NAMES_PW = ["Pill · off", "Pill · assistant"];
const aideOn = () => { try { return document.documentElement.classList.contains("pa1"); } catch { return false; } };
export function PillSwitch() {
  const [show, setShow] = useState(false), [v, setV] = useState(0);
  const apply = (n: number) => { const c = document.documentElement.classList; c.remove("pw1", "pw2", "pa1"); if (n) c.add("pa1"); };
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get("look");
      if (q === "0") localStorage.removeItem(KEY_PW);
      const s = q === "1" || (q !== "0" && localStorage.getItem(SHOW_PW) === "1"), n = s ? Math.max(0, Math.min(1, Number(localStorage.getItem(KEY_PW)) || 0)) : 0;
      setShow(s); setV(n); apply(n);
    } catch { /* private mode: no switch */ }
  }, []);
  if (!show) return null;
  return <button type="button" className={`md-sw pw-sw${v ? " on" : ""}`} onClick={() => { const n = (v + 1) % 2; setV(n); apply(n); try { localStorage.setItem(KEY_PW, String(n)); } catch { /* ignore */ } }}>{NAMES_PW[v]}</button>;
}

export default function PillPlan(_: { onWish: () => void; onSearch: () => void }) {
  const r = usePlanRoom(); const path = usePathname();
  const [open, setOpen] = useState(false), [pick, setPick] = useState(15);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => { setOpen(false); }, [path]);
  // ── the winks (trial) ──
  const { cart, rings } = useCart();
  const [aide, setAide] = useState(false), [prod, setProd] = useState<ProdCtx>(null);
  useEffect(() => { setProd(null); }, [path]);
  useEffect(() => {
    const on = (e: Event) => { const d = (e as CustomEvent).detail as { kind?: string; perDay?: number; fits?: boolean } | undefined; if (d?.kind === "prod" && d.perDay) setProd({ perDay: d.perDay, fits: !!d.fits }); };
    window.addEventListener("mk-plan-ctx", on); return () => window.removeEventListener("mk-plan-ctx", on);
  }, []);
  const [wink, setWink] = useState<Wink | null>(null);
  const wt = useRef(0), quiet = useRef(""), openRef = useRef(false); openRef.current = open;
  const say = (w: Wink, passive = false) => {
    if (!pillOn() || openRef.current) return;
    if (passive) {
      if (quiet.current === path) return;
      let n = 0; try { n = Number(sessionStorage.getItem("mk-pw-n")) || 0; } catch { /* ignore */ }
      if (n >= 3) return;
      quiet.current = path; try { sessionStorage.setItem("mk-pw-n", String(n + 1)); } catch { /* ignore */ }
    }
    window.clearTimeout(wt.current); setWink(w); wt.current = window.setTimeout(() => setWink(null), 2300);
  };
  const sayRef = useRef(say); sayRef.current = say;
  useEffect(() => () => window.clearTimeout(wt.current), []);
  useEffect(() => { document.body.classList.toggle("pw-on", !!wink); }, [wink]);
  // the bag: one more piece than a moment ago; and once a visit, a full bag waiting
  const count = cart ? cart.totalQuantity + rings.length : -1, prevCount = useRef(-1);
  useEffect(() => {
    if (count < 0) return;
    const was = prevCount.current; prevCount.current = count;
    if (was < 0) {
      if (count > 0) { let seen = true; try { seen = !!sessionStorage.getItem("mk-pw-back"); sessionStorage.setItem("mk-pw-back", "1"); } catch { /* ignore */ }
        if (!seen) window.setTimeout(() => sayRef.current({ kind: "back", text: "Still in your bag.", ic: "martini" }, true), 2600); }
      return;
    }
    if (count > was) sayRef.current({ kind: "bag", text: "In the bag.", ic: "ringbox" });
  }, [count]);
  // the Dream list: one more saved
  useEffect(() => {
    let n = wishList().length;
    const on = () => { const m = wishList().length; if (m > n) sayRef.current({ kind: "saved", text: "Saved for later.", ic: "cherries" }); n = m; };
    window.addEventListener("mk-wish", on); return () => window.removeEventListener("mk-wish", on);
  }, []);
  // a product page: after a few seconds on it, this piece on your plan
  const leftDay = r ? Math.max(0, r.leftDay) : 0, leftRef = useRef(0); leftRef.current = leftDay;
  useEffect(() => {
    let t = 0;
    const on = (e: Event) => {
      const d = (e as CustomEvent).detail as { kind?: string; perDay?: number; fits?: boolean } | undefined;
      if (!d || d.kind !== "prod" || !d.perDay) return;
      window.clearTimeout(t);
      t = window.setTimeout(() => {
        const per = Math.ceil(d.perDay as number), more = Math.max(1, Math.ceil((d.perDay as number) - leftRef.current));
        sayRef.current(d.fits ? { kind: "fits", text: `This one · ${usdR(per)} a day`, ic: "olive" } : { kind: "over", text: `+${usdR(more)} a day and it fits`, ic: "keyhand" }, true);
      }, 3500);
    };
    window.addEventListener("mk-plan-ctx", on); return () => { window.clearTimeout(t); window.removeEventListener("mk-plan-ctx", on); };
  }, [path]);
  // the foot of the page: the swallow lands on the pill (the footer sits behind the page, so "in view" is measured by the scroll)
  useEffect(() => {
    let done = false;
    const on = () => {
      if (done || window.scrollY < 600) return;
      const d = document.documentElement;
      if (window.scrollY + window.innerHeight >= d.scrollHeight - 60) { done = true; sayRef.current({ kind: "bird", text: "Shhh." }, true); }
    };
    window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on);
  }, [path]);
  useEffect(() => { document.body.classList.toggle("pp-has", true); document.body.classList.toggle("pp-open", open); }, [open]);
  const [fold, setFold] = useState(false);
  useEffect(() => { const f = () => setFold(window.scrollY > 40); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, [path]);
  useEffect(() => { document.body.classList.toggle("pp-fold", fold || open || !!wink); }, [fold, open, wink]);
  // the home page's button always opens it (with or without a plan); scrolling on into the shop opens it by itself once, for someone
  // who hasn't chosen a plan yet
  useEffect(() => {
    const open1 = () => setOpen(true);
    window.addEventListener("mk-plan-choose", open1);
    return () => window.removeEventListener("mk-plan-choose", open1);
  }, []);
  useEffect(() => {
    if (path !== "/" || r) return;
    let seen = false; try { seen = !!localStorage.getItem(SEEN); } catch { /* ignore */ }
    if (seen) return;
    const onScroll = () => {
      const shop = document.querySelector<HTMLElement>(".home-page #shop");
      const past = shop ? shop.getBoundingClientRect().top < window.innerHeight * .6 : window.scrollY > window.innerHeight * .9;
      if (!past) return;
      window.removeEventListener("scroll", onScroll);
      try { localStorage.setItem(SEEN, "1"); } catch { /* ignore */ }
      setOpen(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [path, !!r]); // eslint-disable-line react-hooks/exhaustive-deps
  // close: Esc, or a tap anywhere outside the card
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    let sx = 0, sy = 0, outside = false;
    const down = (e: PointerEvent) => { outside = !!wrap.current && !wrap.current.contains(e.target as Node); sx = e.clientX; sy = e.clientY; };
    const up = (e: PointerEvent) => { if (outside && Math.hypot(e.clientX - sx, e.clientY - sy) < 10) setOpen(false); outside = false; };
    window.addEventListener("keydown", k); document.addEventListener("pointerdown", down, true); document.addEventListener("pointerup", up, true);
    return () => { window.removeEventListener("keydown", k); document.removeEventListener("pointerdown", down, true); document.removeEventListener("pointerup", up, true); };
  }, [open]);
  const choose = (d: number) => { savePlan({ day: d, months: 4 }); setOpen(false); };
  const chip = r ? <><b>{usdR(r.p.day)}</b><small>a day</small></> : <span className="pp-cta">Choose your plan</span>;
  return (
    <div className="pp-wrap" ref={wrap}>
      <button type="button" className={`pp-chip${wink ? ` pw-go pw-${wink.kind}` : ""}`} aria-expanded={open} aria-controls="pp-sheet" onClick={() => { setWink(null); setAide(aideOn()); setOpen(o => !o); }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="pa-av" src="/media/marcel.png" alt="" />{wink ? <>{wink.kind === "bird" && <i className="pw-swl" aria-hidden="true" />}<span className="pw-b" key={wink.kind + wink.text}>{wink.kind === "bird" ? null : wink.ic ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/icons/${wink.ic}.png`} alt="" /> : null}<em>{wink.text}</em></span></> : <>{chip}<span className="pp-dot" aria-hidden="true">{open ? "▴" : "▾"}</span></>}</button>
      <div id="pp-sheet" className={`pp-sheet${open ? " on" : ""}${aide ? " pa-on" : ""}`} role="dialog" aria-label={r ? "Your Meekitaz Daily plan" : "Choose your plan"} aria-hidden={!open}>
        <button type="button" className="pp-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
        {aide ? (open ? <PillAide path={path} day={r ? r.p.day : null} leftDay={leftDay} prod={prod} onPlan={() => setAide(false)} close={() => setOpen(false)} /> : null) : r ? (() => {
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
