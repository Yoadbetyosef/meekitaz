"use client";
import { useState } from "react";
import Link from "next/link";
import type { DailyItem } from "./DailyPlan";
import { usePlan } from "./PlanKit";
import { savePlan, planTier, perDay, usdR, planTotal } from "@/lib/plan";

/* Picked for your plan (approved 2026-11-09): every piece shown per day on the customer's own plan — the ones that fit first
   ("Yours at $15 a day", green), then "Just a little more" (up to 30% over, amber "+$N a day"); "Fit my plan" keeps only the green. */
const CATS = ["All", "Engagement rings", "Earrings", "Necklaces", "Bracelets", "Bands"];
const sized = (u: string) => u.startsWith("/") ? u : u + (u.includes("?") ? "&" : "?") + "width=500";

export default function DailyPicks({ items }: { items: DailyItem[] }) {
  const plan = usePlan(); const [cat, setCat] = useState("All"), [fit, setFit] = useState(false);
  const p = plan || { day: 15, months: 4 };
  const list = items.filter(x => cat === "All" || x[4] === cat);
  const ins = list.filter(x => planTier(x[1], p) === "in").sort((a, b) => b[1] - a[1]);
  const near = list.filter(x => planTier(x[1], p) === "near").sort((a, b) => a[1] - b[1]);
  const card = (x: DailyItem) => {
    const tier = planTier(x[1], p), d = perDay(x[1], p);
    return (
      <Link key={x[3] + x[0]} href={x[3] ? `/products/${x[3]}` : "#"} className="pk-card">
        <span className={`pk-tag pk-${tier}`}>{tier === "in" ? "In your plan" : `+${usdR(d - p.day)} a day`}</span>
        <span className="pk-img">{x[2] && /* eslint-disable-next-line @next/next/no-img-element */ <img src={sized(x[2])} alt={x[0]} loading="lazy" />}</span>
        <span className="pk-nm">{x[0]}</span>
        <span className="pk-d"><b>{usdR(d)}</b> <i>a day</i></span>
        <span className="pk-p">{usdR(x[1])} · {p.months} mo</span>
      </Link>
    );
  };
  return (
    <section className="pk">
      <div className="pk-plan">
        <span>Your plan</span><b>{usdR(p.day)}</b><span>a day ·</span>
        <span className="pk-mo">{[1, 2, 3, 4].map(m => <button key={m} type="button" className={m === p.months ? "on" : ""} onClick={() => savePlan({ ...p, months: m })}>{m}</button>)} mo</span>
        <span>· up to</span><b>{usdR(planTotal(p))}</b>
        <input type="range" min={1} max={50} value={p.day} onChange={e => savePlan({ ...p, day: +e.target.value })} aria-label="Dollars a day" />
      </div>
      <span className="pk-kick">Meekitaz Daily</span>
      <h1 className="pk-h">Picked for your plan.</h1>
      <p className="pk-sub">Everything here is yours at {usdR(p.day)} a day — and a few that are just a little more.</p>
      <div className="pk-tabs">
        {CATS.map(c => <button key={c} type="button" className={c === cat ? "on" : ""} onClick={() => setCat(c)}>{c}</button>)}
        <button type="button" className={`pk-fit${fit ? " on" : ""}`} onClick={() => setFit(f => !f)} aria-pressed={fit}><i />Fit my plan</button>
      </div>
      <div className="pk-row"><h2>Yours at {usdR(p.day)} a day</h2><span>{ins.length} pieces</span></div>
      {ins.length ? <div className="pk-grid">{ins.map(card)}</div> : <p className="pk-none">Nothing here at this amount yet — slide your plan up a little.</p>}
      {!fit && near.length > 0 && <>
        <div className="pk-row"><h2>Just a little more</h2><span>a few dollars more a day</span></div>
        <div className="pk-grid">{near.map(card)}</div>
      </>}
    </section>
  );
}
