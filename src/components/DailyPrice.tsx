"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useDaily } from "./DailyMode";
import { dailyPlan, dailyOptions, DAILY } from "@/lib/daily";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const howLong = (d: number) => { const m = d / 30; if (m < 1.5) return `${d} days`; const r = Math.round(m * 2) / 2; return `${Math.floor(r)}${r % 1 ? "½" : ""} months`; };
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
  const on = useDaily(); const [mode, setMode] = useState<"daily" | "full">("daily");
  if (!on || !price) return null;
  const d = dailyPlan(price);
  return (
    <div className="dly">
      <div className="dly-how"><button type="button" className={mode === "daily" ? "on" : ""} onClick={() => setMode("daily")}>Pay daily</button><button type="button" className={mode === "full" ? "on" : ""} onClick={() => { setMode("full"); onFull?.(); }}>Pay in full · {usd(price)}</button></div>
      {mode === "daily" && <>
        <DailyPlanPicker price={price} title="Pay daily" />
        <DailyLess />
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


/** The plan picker, same rules as the cover: a round daily amount ($10–$30), the days follow. Small enough for the build summary,
 *  the product page and the bag. `onChange` lets a parent (the bag) carry the chosen amount to checkout. */
export function DailyPlanPicker({ price, amt, onChange, title = "Your ring" }: { price: number; amt?: number; onChange?: (amt: number) => void; title?: string }) {
  const on = useDaily();
  const [local, setLocal] = useState<number | null>(null);
  if (!on || !price) return null;
  const opts = dailyOptions(price);
  const pick = amt ?? local;
  const cur = opts.find(o => o.ok && o.amt === pick) || opts.find(o => o.ok) || opts[opts.length - 1];
  const choose = (a: number) => { setLocal(a); onChange?.(a); };
  return (
    <div className="dpp">
      <div className="dpp-top"><small>{title}</small><div><b>${cur.amt}</b><span>a day · {howLong(cur.days)}</span></div></div>
      <div className="dpp-seg" role="group" aria-label="Daily amount">
        {opts.map(o => <button key={o.amt} type="button" disabled={!o.ok} aria-pressed={o.amt === cur.amt} onClick={() => choose(o.amt)}>${o.amt}</button>)}
      </div>
      <p className="dpp-sub">{cur.days} days · {usd(price)} total · ships day {cur.ship} · no interest</p>
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
  const on = useDaily(); if (!on || !price) return null;
  return <div className="dly-tot"><DailyPlanPicker price={price} title={label} /><DailyOwn compact /></div>;
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
      <div className="dly-chip">
        <div className="dly-chip-top"><div><b>${cur.amt} a day</b><span>for {howLong(cur.days)}</span></div><span className="dly-chip-l">your piece</span></div>
        <div className="dly-chip-step">
          <button type="button" aria-label="Lower price" onClick={() => { setPrice(p => Math.max(300, p - 150)); setPick(null); }}>−</button>
          <div><b>{usd(price)}</b><span>price</span></div>
          <button type="button" aria-label="Higher price" onClick={() => { setPrice(p => Math.min(4500, p + 150)); setPick(null); }}>+</button>
        </div>
        <div className="dly-chip-seg" role="group" aria-label="Daily amount">
          {opts.map(o => <button key={o.amt} type="button" disabled={!o.ok} aria-pressed={o.amt === cur.amt} onClick={() => setPick(o.amt)}>${o.amt}</button>)}
        </div>
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
