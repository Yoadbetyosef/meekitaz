"use client";
import { useState } from "react";
import Link from "next/link";
import { useDaily } from "./DailyMode";
import DailyDial from "./DailyDial";
import { dailyPlan, DAILY } from "@/lib/daily";

const RING = "https://cdn.shopify.com/s/files/1/0841/2905/4957/files/NS-2121-5-2-0.jpg?v=1792333617";
const PRICE = 1089;
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const msg = (d: number, days: number, price: number) => d <= 1 ? `Paid $${DAILY.perDay}. It ships today.` : d < 5 ? "On its way to you, insured." : d < days ? `On your hand. ${Math.round((d * DAILY.perDay / price) * 100)}% yours.` : "All yours. Forever.";

/** Home page (Daily only): drag through the days and watch the ring become hers. */
export function DailyScrubber() {
  const on = useDaily(); const p = dailyPlan(PRICE); const [day, setDay] = useState(21);
  if (!on) return null;
  const paid = Math.min(PRICE, day * p.perDay);
  return (
    <section className="dsc"><div className="wrap">
      <small className="eyebrow">Try it</small>
      <h2>Drag through the days.</h2>
      <p className="dsc-lead">This is how your ring becomes yours.</p>
      <div className="dsc-grid">
        <DailyDial pct={(paid / PRICE) * 100} image={RING} />
        <div>
          <div className="dsc-day">Day {day}<span> of {p.days}</span></div>
          <p className="dsc-msg" key={msg(day, p.days, PRICE)}>{msg(day, p.days, PRICE)}</p>
          <input className="dsc-sl" type="range" min={1} max={p.days} value={day} onChange={e => setDay(Number(e.target.value))} aria-label="Day" />
          <div className="dsc-t"><span>Day 1 · it ships</span><span>Day {p.days} · all yours</span></div>
          <div className="dsc-facts"><div><b>{usd(paid)}</b><small>paid</small></div><div><b>${p.perDay}</b><small>a day</small></div><div><b>{usd(PRICE - paid)}</b><small>to go</small></div></div>
          <div className="dsc-ctas"><Link href="/engagement-rings" className="pill dk">Start my plan</Link><Link href="/daily/my-ring" className="pill">See your “My ring” page</Link></div>
        </div>
      </div>
    </div></section>
  );
}
