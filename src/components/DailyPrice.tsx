"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useDaily } from "./DailyMode";
import { dailyPlan, DAILY } from "@/lib/daily";

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

/** Home cover in the Daily preview: the daily number is the headline. Two small dials — the piece's price (up to $4,500) and the days —
 *  and the number follows: price ÷ days, floor $15, never above $30 a day, never longer than 6 months. */
export function DailyHeroHeadline() {
  const on = useDaily();
  const [price, setPrice] = useState(1800);
  const [days, setDays] = useState<number | null>(null);
  if (!on) return null;
  const minDays = Math.max(60, Math.ceil(price / 30)), maxDays = DAILY.maxDays;
  const d = Math.min(maxDays, Math.max(minDays, days ?? Math.ceil(price / DAILY.perDay)));
  const amt = Math.max(DAILY.perDay, Math.ceil(price / d));
  return (
    <div className="dly-hh">
      <p className="dly-hh-tag">Any piece up to $4,500 — <s>{usd(price)}</s></p>
      <h1 className="dly-hh-big"><b>${amt}</b><span>a day</span></h1>
      <p className="dly-hh-own"><s>Rent it</s><s>Lease it</s><b>Own it. From day one.</b></p>
      <div className="dly-hh-dials">
        <label className="dly-hh-dial"><span>Piece</span><i>{usd(price)}</i><input type="range" min={300} max={4500} step={50} value={price} onChange={e => { setPrice(Number(e.target.value)); setDays(null); }} aria-label="Price of the piece" /></label>
        <label className="dly-hh-dial"><span>For</span><i>{d} days</i><input type="range" min={minDays} max={maxDays} step={1} value={d} onChange={e => setDays(Number(e.target.value))} aria-label="How many days" /></label>
        <span className="dly-hh-note">no credit check · yours from day one</span>
      </div>
    </div>
  );
}
