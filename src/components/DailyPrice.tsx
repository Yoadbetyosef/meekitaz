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
  return <span className="dly-card"><span className="dly-cp"><b className="dly-holo">${d.perDay}</b><i>a day</i></span><span className="dly-cp2"><span>{d.days} days</span><span>or {usd(price)}</span></span></span>;
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
        {base.days > 30 && <div className="dly-sl"><input type="range" min={minD} max={maxD} step={5} value={d.days} onChange={e => setDays(Number(e.target.value))} aria-label="How many days" />
          <div><span>Faster · ${dailyPlan(price, minD).perDay}/day</span><span>6 months · ${dailyPlan(price, maxD).perDay}/day</span></div></div>}
        <div className="dly-meter"><i style={{ width: `${Math.max(6, Math.round(100 / d.days))}%` }} /></div>
        <div className="dly-mt"><span>Today · ${d.perDay}</span><span>Now · it ships</span><span>Day {d.days} · all yours</span></div>
        <div className="dly-yours"><b>It&rsquo;s yours from day one.</b> Not a rental, not a lease. It ships right away and you wear it now; ${d.perDay} a day straight from your bank until it&rsquo;s paid off. Pay it off early any time.</div>
        <button type="button" className="dly-go" onClick={() => alert("Preview only: the daily checkout (bank connection + daily plan) is the next step to build.")}>Start for ${d.perDay} today</button>
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
