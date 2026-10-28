"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useDaily } from "./DailyMode";
import { dailyPlan, dailyOptions, DAILY } from "@/lib/daily";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
/** On cards: "$15/day" leads, the full price under it. Renders nothing unless the Daily preview is on. */
export function DailyCardPrice({ price }: { price: number }) {
  const on = useDaily(); if (!on || !price) return null;
  const d = dailyPlan(price);
  return <span className="dly-card"><span className="dly-cp"><b className="dly-holo">${d.perDay}</b><i>a day</i></span><span className="dly-cp2"><span>{d.days} days</span><span>or {usd(price)}</span></span><span className="dly-cp3">Yours today · ships now</span></span>;
}
/** Top bar, once per page: three short messages that turn over. */
const BAR = [<>Own it from <b>${DAILY.perDay} a day</b> · Everyone&rsquo;s approved · No credit check</>, <>Wear it <b>right away</b> · Keep paying ${DAILY.perDay} a day</>, <>It&rsquo;s <b>yours</b>, not a rental · No interest, ever</>];
export function DailyBar() {
  const on = useDaily(); const [k, setK] = useState(0);
  useEffect(() => { if (!on) return; const t = setInterval(() => setK(x => (x + 1) % BAR.length), 4200); return () => clearInterval(t); }, [on]);
  if (!on) return null;
  return <Link href="/daily" className="dly-bar"><span key={k} className="dly-bar-t">{BAR[k]}</span><i>How it works →</i></Link>;
}
/** One line wherever a total is shown: "or $15 a day for 73 days". */
export function DailyLine({ price, className = "" }: { price: number; className?: string }) {
  const on = useDaily(); if (!on || !price) return null; const d = dailyPlan(price);
  return <span className={`dly-line ${className}`}><span className="dly-or">or</span><b className="dly-holo">${d.perDay}</b><span>a day · {d.days} days</span></span>;
}
/** On the home cover and category headers: a glass pill with the shimmering daily number. */
export function DailyHeroBadge() {
  const on = useDaily(); if (!on) return null;
  return <Link href="/daily" className="dly-pill"><b className="dly-holo">${DAILY.perDay}</b><span>a day</span><em>Everyone&rsquo;s approved</em></Link>;
}
/** On the product page: pay daily / in full, the big daily number, a 3–6 month slider, the facts and the promise. */
export function DailyBlock({ price, onFull }: { price: number; onFull?: () => void }) {
  const on = useDaily(); const base = dailyPlan(price);
  const [days, setDays] = useState<number | null>(null); const [mode, setMode] = useState<"daily" | "full">("daily");
  if (!on || !price) return null;
  const d = days ? dailyPlan(price, days) : base;
  const minD = Math.min(90, base.days), maxD = DAILY.maxDays;
  return (
    <div className="dly">
      <div className="dly-how"><button type="button" className={mode === "daily" ? "on" : ""} onClick={() => setMode("daily")}>Pay daily</button><button type="button" className={mode === "full" ? "on" : ""} onClick={() => { setMode("full"); onFull?.(); }}>Pay in full · {usd(price)}</button></div>
      {mode === "daily" && <>
        <div className="dly-big"><b className="dly-holo">${d.perDay}</b><span>a day</span></div>
        <p className="dly-sub">{d.days} days · {usd(price)} total, the same as paying in full · no interest, no credit check, everyone&rsquo;s approved.</p>
        <DailyLess />
        {base.days > 30 && <div className="dly-sl"><input type="range" min={minD} max={maxD} step={5} value={d.days} onChange={e => setDays(Number(e.target.value))} aria-label="How many days" />
          <div><span>Faster · ${dailyPlan(price, minD).perDay}/day</span><span>6 months · ${dailyPlan(price, maxD).perDay}/day</span></div></div>}
        <div className="dly-meter"><i style={{ width: `${Math.max(6, Math.round(100 / d.days))}%` }} /></div>
        <div className="dly-mt"><span>Today · ${d.perDay}</span><span>Now · it ships</span><span>Day {d.days} · all yours</span></div>
        <DailyArrival />
        <DailyOwn />
        <details className="dly-why"><summary>How is this different?</summary><DailyVs /></details>
        <div className="dly-yours"><b>It&rsquo;s yours from day one.</b> Not a rental, not a lease. It ships right away and you wear it now; ${d.perDay} a day straight from your bank until it&rsquo;s paid off. Pay it off early any time.</div>
        <Link href="/daily" className="dly-more">How Meekitaz Daily works →</Link>
        <p className="dly-fine">Example: {usd(price)} over {d.days} days at ${d.perDay} a day; the last payment is ${d.last}. Charged each business day from your bank account. Full terms at checkout.</p>
      </>}
    </div>
  );
}

/** On diamond cards: the stone becomes a ring you pay for by the day. */
export function DailyStoneNote() {
  const on = useDaily(); if (!on) return null;
  return <span className="dly-line stone"><i />As your ring, from <b>${DAILY.perDay} a day</b></span>;
}

/** "Your ring" total on the build page: the daily number leads, the full price underneath. */
export function DailyTotal({ price, label = "Your ring" }: { price: number; label?: string }) {
  const on = useDaily(); if (!on || !price) return null; const d = dailyPlan(price);
  return <div className="dly-tot"><small>{label}</small><div className="dly-big"><b className="dly-holo">${d.perDay}</b><span>a day</span></div><p>{d.days} days · {usd(price)} total · no interest</p><DailyLess /><DailyOwn compact /></div>;
}

/* ---------- "it's cheap, it's yours, you get it now" — repeated along the whole path ---------- */
const LESS = ["a latte and a croissant", "one lunch out", "a rideshare across town", "a cocktail in Manhattan", "a movie ticket"];
/** Rotating: "That's less than a latte and a croissant." */
export function DailyLess({ className = "" }: { className?: string }) {
  const on = useDaily(); const [k, setK] = useState(0);
  useEffect(() => { if (!on) return; const t = setInterval(() => setK(x => (x + 1) % LESS.length), 2800); return () => clearInterval(t); }, [on]);
  if (!on) return null;
  return <p className={`dly-less ${className}`}>That&rsquo;s less than <span key={k}>{LESS[k]}</span>.</p>;
}
/** Three promises: yours today, not a rental, not layaway (+ ships now). */
export function DailyOwn({ compact = false }: { compact?: boolean }) {
  const on = useDaily(); if (!on) return null;
  const T = compact ? ["Yours today", "Not a rental", "Not layaway"] : ["Yours from day one", "Not a rental", "Not layaway", "Ships right away"];
  return <ul className={`dly-own${compact ? " c" : ""}`}>{T.map(t => <li key={t}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>{t}</li>)}</ul>;
}
/** "In your hands by Fri, Oct 30" (5 business days; 3 with express). */
export function DailyArrival({ express = false }: { express?: boolean }) {
  const on = useDaily(); if (!on) return null;
  const d = new Date(); let n = express ? 3 : 5; while (n > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n--; }
  return <p className="dly-arr"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><circle cx="7" cy="17.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="17.5" cy="17.5" r="1.6" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>In your hands by <b>{d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</b></p>;
}
/** Daily vs. the old ways. */
export function DailyVs() {
  const on = useDaily(); if (!on) return null;
  const R: [string, string, string, string, string][] = [["", "Meekitaz Daily", "Layaway", "Rental", "Store card"], ["You wear it now", "✓", "✕", "✓", "✓"], ["It’s yours to keep", "✓", "✓", "✕", "✓"], ["No credit check", "✓", "✓", "✓", "✕"], ["No interest, ever", "✓", "✓", "—", "✕"], ["Everyone’s approved", "✓", "✓", "✕", "✕"]];
  return <div className="dly-vs" role="table">{R.map((r, i) => <div key={i} role="row" className={i === 0 ? "h" : ""}>{r.map((c, j) => <span key={j} role="cell" className={j === 1 ? "us" : c === "✕" ? "no" : ""}>{c}</span>)}</div>)}</div>;
}
/** The moving band on the home page. */
export function DailyMarquee() {
  const on = useDaily(); if (!on) return null;
  const t = [`$${DAILY.perDay} a day`, "Yours today", "Not a rental", "Not layaway", "Ships right away", "Everyone’s approved", "No credit check", "No interest"];
  return <div className="dly-mq" aria-label="Meekitaz Daily"><div>{[...t, ...t].map((x, i) => <span key={i}>{x}<i>✦</i></span>)}</div></div>;
}

/** Home cover in the Daily preview — "the equation": $amount × days = the piece. Pick the piece's price, then a pace
 *  ($10–$30 a day, each showing how long it takes). Paces that break the rules (≤180 days, cost covered by ship day 21) are off. */
/** The rotating word after "No": one word at a time, each slides up into place (no overlap, nothing clipped). */
const NO_WORDS = ["credit check.", "interest.", "waiting.", "renting.", "catch.", "guilt."];
function NoWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI(n => (n + 1) % NO_WORDS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return <span className="dly-no-w" aria-live="polite"><span key={i}>{NO_WORDS[i]}</span></span>;
}
const NAMES = ["Easiest", "Easy", "Steady", "Faster", "Fastest"];
const howLong = (d: number) => { const m = d / 30; if (m < 1.5) return `${d} days`; const r = Math.round(m * 2) / 2; return `${Math.floor(r)}${r % 1 ? "½" : ""} months`; };
export function DailyHeroHeadline() {
  const on = useDaily();
  const [price, setPrice] = useState(1800);
  const [pick, setPick] = useState<number | null>(null);
  if (!on) return null;
  const opts = dailyOptions(price);
  const cur = opts.find(o => o.ok && o.amt === pick) || opts.find(o => o.ok) || opts[opts.length - 1];
  const okOpts = opts.filter(o => o.ok);
  return (
    <div className="dly-hh dly-eqv">
      <p className="dly-no-kick">Meekitaz Daily · from $10 a day</p>
      <h1 className="dly-no">No <NoWord /></h1>
      <p className="dly-no-dream">It’s on your hand from day one. <em>You’ll barely feel it.</em></p>
      <div className="dly-chip" aria-hidden="true">
        <div><b>${cur.amt} a day</b><span>for {howLong(cur.days)} · {usd(price)} piece</span></div>
        <button type="button" onClick={() => document.querySelector(".dly-sheet")?.scrollIntoView({ behavior: "smooth", block: "start" })}>Change ▾</button>
      </div>
      <div className="dly-sheet">
      <p className="dly-pc-line" aria-live="polite">Your {usd(price)} piece: <em>${cur.amt} a day, for {howLong(cur.days)}.</em></p>
      <label className="dly-eq-price"><span>Your piece</span><output>{usd(price)}</output><input type="range" min={300} max={4500} step={50} value={price} onChange={e => setPrice(Number(e.target.value))} aria-label="Price of the piece" /></label>
      <div className="dly-pc-cards" role="group" aria-label="Your plan" style={{ gridTemplateColumns: `repeat(${okOpts.length}, 1fr)` }}>
        {okOpts.map((o, i) => <button key={o.amt} type="button" className="dly-pc" aria-pressed={o.amt === cur.amt} onClick={() => setPick(o.amt)}>
          <small>{okOpts.length === 1 ? "Your plan" : NAMES[NAMES.length - okOpts.length + i]}</small><b>${o.amt}<sub> /day</sub></b><span>{howLong(o.days)} · {o.days} days</span>
        </button>)}
      </div>
      </div>
    </div>
  );
}
