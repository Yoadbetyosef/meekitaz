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
// (2026-11-17, later) the assistant was cancelled; the switch now turns on the pill's moods (html.pmo1): it winks, looks at you, falls asleep
const KEY_PW = "mk-pmo", SHOW_PW = "mk-look-show", NAMES_PW = ["Pill · off", "Pill · moods"];
const moodsOn = () => { try { return document.documentElement.classList.contains("pmo1") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };
type Mood = "wink" | "look" | "sleep" | null;
/* (2026-11-17) the drawings on the pill: for a second or two the price steps aside and one of our drawings runs across the whole pill
   (or rises in the middle and wobbles), then the price is back. No words. Small trimmed copies live in /media/pill/. */
type Toon = { k: string; kind: "run" | "pop"; dir?: 1 | -1; tint?: string };
const TOONS: Record<string, Toon> = {
  shrimp: { k: "shrimp", kind: "run", dir: -1 }, crab: { k: "crab", kind: "run" }, marcel: { k: "marcel", kind: "pop" }, car: { k: "car", kind: "run", dir: -1 },
  greyhound: { k: "greyhound", kind: "pop" }, shades: { k: "shades", kind: "pop" }, cherries: { k: "cherries", kind: "pop" }, phone: { k: "phone", kind: "pop" },
  lips: { k: "lips", kind: "pop" }, peace: { k: "peace", kind: "pop" }, martini: { k: "martini", kind: "pop" },
  // only in their own moments (bag, order, gemstones page, time of day), not in the random pool
  ringbox: { k: "ringbox", kind: "pop" }, swallow: { k: "swallow", kind: "run" }, die: { k: "die", kind: "run" }, croissant: { k: "croissant", kind: "run" }, coffee: { k: "coffee", kind: "pop" },
};
const POOL = ["shrimp", "crab", "marcel", "car", "greyhound", "shades", "cherries", "phone", "lips", "peace", "martini"]; // the eleven he chose
const pageToon = (path: string) => /necklace/.test(path) ? "shrimp" : /earring|stud/.test(path) ? "greyhound" : /gemstone/.test(path) ? "die" : /engagement-rings|bands|one-of-one/.test(path) ? "peace" : "";
type Show = { list: Toon[]; parade?: boolean } | null;
const aideOn = () => { try { return document.documentElement.classList.contains("pa1"); } catch { return false; } };
export function PillSwitch() {
  const [show, setShow] = useState(false), [v, setV] = useState(0);
  const apply = (n: number) => { const c = document.documentElement.classList; c.remove("pw1", "pw2", "pa1", "pmo1"); if (n) c.add("pmo1"); };
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
  /* ── the pill's moods (trial, private "Pill" switch): for a couple of seconds the pill becomes a little face.
     wink: now and then, and when something goes into the bag · look: when the pointer comes near, its eyes follow it ·
     sleep: after half a minute with nothing happening, until you move again. Never while the card is open. ── */
  const [mood, setMood] = useState<Mood>(null);
  const moodRef = useRef<Mood>(null); moodRef.current = mood;
  const chipRef = useRef<HTMLButtonElement>(null), mt = useRef(0);
  const feel = (m: Mood, ms = 0) => { window.clearTimeout(mt.current); setMood(m); if (m && ms) mt.current = window.setTimeout(() => setMood(null), ms); };
  const feelRef = useRef(feel); feelRef.current = feel;
  const [show, setShow] = useState<Show>(null);
  const showRef = useRef<Show>(null); showRef.current = show;
  const st = useRef(0);
  const play = (name: string, tint?: string) => {
    const t = TOONS[name]; if (!t || !moodsOn() || openRef.current || showRef.current) return false;
    feelRef.current(null); window.clearTimeout(st.current); setShow({ list: [{ ...t, tint }] }); st.current = window.setTimeout(() => setShow(null), t.kind === "run" ? 1750 : 2100); return true;
  };
  const parade = () => {
    if (!moodsOn()) return; feelRef.current(null); window.clearTimeout(st.current);
    setShow({ list: POOL.map(n => TOONS[n]), parade: true }); st.current = window.setTimeout(() => setShow(null), 2600 + POOL.length * 700);
  };
  const playRef = useRef(play); playRef.current = play;
  useEffect(() => () => window.clearTimeout(st.current), []);
  useEffect(() => { if (open) { window.clearTimeout(st.current); setShow(null); } }, [open]);
  // a new page: its own character passes once (necklaces: the shrimp · earrings: the greyhound · rings: the peace hand · gemstones: the die); the order page: the swallow
  useEffect(() => {
    const n = path.startsWith("/order-confirmed") ? "swallow" : path.startsWith("/products/") ? "" : pageToon(path); if (!n) return;
    const t = window.setTimeout(() => playRef.current(n, n === "swallow" ? "#DCEBF4" : undefined), 2600); return () => window.clearTimeout(t);
  }, [path]);
  // five quick taps on the pill: everyone walks by in a row
  const taps = useRef<number[]>([]);
  const tap = () => { const n = Date.now(); taps.current = taps.current.filter(x => n - x < 1600); taps.current.push(n); if (taps.current.length >= 5 && moodsOn()) { taps.current = []; return true; } return false; };
  useEffect(() => { if (open) feelRef.current(null); }, [open]);
  useEffect(() => {
    let idle = 0, next = 0, lookAt = 0, alive = true;
    const quiet = () => !moodsOn() || openRef.current || document.hidden;
    const hr = new Date().getHours(), night = hr >= 23 || hr < 5;
    const armIdle = () => { window.clearTimeout(idle); idle = window.setTimeout(() => { if (alive && !quiet() && !moodRef.current && !showRef.current) feelRef.current("sleep"); }, night ? 12000 : 30000); }; // at night it nods off sooner
    // this visit's guest: a different drawing every visit, so whoever comes back meets someone new
    let guest = POOL[0], first = true, turn = 0;
    try {
      let i = Number(localStorage.getItem("mk-pmo-i")) || 0;
      if (!sessionStorage.getItem("mk-pmo-v")) { sessionStorage.setItem("mk-pmo-v", "1"); i += 1; localStorage.setItem("mk-pmo-i", String(i)); }
      guest = POOL[i % POOL.length];
    } catch { /* private mode: the first of the pool */ }
    // the time of day, once a visit: a croissant in the morning, a coffee in the afternoon, the martini on a Friday evening
    const hourToon = () => { const d = new Date(), h = d.getHours(); return d.getDay() === 5 && h >= 17 && h < 23 ? ["martini", "#F7D3DA"] : h >= 5 && h < 12 ? ["croissant", "#F7E9A8"] : h >= 12 && h < 17 ? ["coffee", "#F7E9A8"] : null; };
    const armWink = (ms: number) => { window.clearTimeout(next); next = window.setTimeout(() => {
      if (!alive) return;
      if (!quiet() && !moodRef.current && !showRef.current) {
        turn += 1;
        if (turn % 2) feelRef.current("wink", 2600);
        else {
          let seen = true; try { seen = !!sessionStorage.getItem("mk-pmo-h"); sessionStorage.setItem("mk-pmo-h", "1"); } catch { /* ignore */ }
          const ht = seen ? null : hourToon();
          if (ht) playRef.current(ht[0], ht[1]);
          else { playRef.current(first ? guest : POOL[Math.floor(Math.random() * POOL.length)]); first = false; }
        }
      }
      armWink(18000 + Math.random() * 16000);
    }, ms); };
    const awake = () => { if (moodRef.current === "sleep") feelRef.current("wink", 2600); armIdle(); };
    const move = (e: PointerEvent) => {
      awake();
      const el = chipRef.current; if (!el || quiet() || e.pointerType === "touch") return;
      const r = el.getBoundingClientRect(); if (!r.width) return;
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), near = Math.hypot(dx, dy) < 190, over = Math.abs(dx) < r.width / 2 + 4 && Math.abs(dy) < r.height / 2 + 4;
      if (showRef.current) return;
      if (moodRef.current === "look") {
        el.style.setProperty("--pmo-x", `${Math.max(-1, Math.min(1, dx / 160)) * 4}px`); el.style.setProperty("--pmo-y", `${Math.max(-1, Math.min(1, dy / 160)) * 3}px`);
        if (!near || over) feelRef.current(null);
      } else if (!moodRef.current && near && !over && Date.now() - lookAt > 20000) { lookAt = Date.now(); feelRef.current("look", 4500); }
    };
    armIdle(); armWink(5000);
    window.addEventListener("pointermove", move, { passive: true }); window.addEventListener("scroll", awake, { passive: true }); window.addEventListener("keydown", awake); window.addEventListener("pointerdown", awake, { passive: true });
    return () => { alive = false; window.clearTimeout(idle); window.clearTimeout(next); window.clearTimeout(mt.current); window.removeEventListener("pointermove", move); window.removeEventListener("scroll", awake); window.removeEventListener("keydown", awake); window.removeEventListener("pointerdown", awake); };
  }, []);
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
    if (count > was) { sayRef.current({ kind: "bag", text: "In the bag.", ic: "ringbox" }); playRef.current("ringbox", "#E1FF4F"); }
  }, [count]);
  // the Dream list: one more saved
  useEffect(() => {
    let n = wishList().length;
    const on = () => { const m = wishList().length; if (m > n) { sayRef.current({ kind: "saved", text: "Saved for later.", ic: "cherries" }); playRef.current("cherries", "#F7D3DA"); } n = m; };
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
      <button type="button" ref={chipRef} className={`pp-chip${wink ? ` pw-go pw-${wink.kind}` : ""}${show ? " pmo-toon" : ""}`} style={show?.list[0]?.tint && !show.parade ? { background: show.list[0].tint } : undefined} aria-expanded={open} aria-controls="pp-sheet" onClick={() => { setWink(null); if (tap()) { setOpen(false); parade(); return; } setAide(aideOn()); setOpen(o => !o); }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img className="pai-av" src="/media/marcel.png" alt="" />{wink ? <>{wink.kind === "bird" && <i className="pw-swl" aria-hidden="true" />}<span className="pw-b" key={wink.kind + wink.text}>{wink.kind === "bird" ? null : wink.ic ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/media/icons/${wink.ic}.png`} alt="" /> : null}<em>{wink.text}</em></span></> : <>{chip}<span className="pp-dot" aria-hidden="true">{open ? "▴" : "▾"}</span></>}{mood && <span className={`pmo pmo-${mood}`} aria-hidden="true"><i /><u /><i />{mood === "sleep" && <><b>z</b><b>z</b></>}</span>}{show && <span className={`pmo-act${show.parade ? " par" : ""}`} aria-hidden="true">{show.list.map((t, i) => /* eslint-disable-next-line @next/next/no-img-element */ <img key={t.k + i} src={`/media/pill/${t.k}.webp`} alt="" className={`${show.parade ? "run" : t.kind}${t.dir === -1 && !show.parade ? " rtl" : ""}`} style={show.parade ? { animationDelay: `${i * 0.7}s, 0s` } : undefined} />)}</span>}</button>
      <div id="pp-sheet" className={`pp-sheet${open ? " on" : ""}${aide ? " pai-on" : ""}`} role="dialog" aria-label={r ? "Your Meekitaz Daily plan" : "Choose your plan"} aria-hidden={!open}>
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
