"use client";
import { useState } from "react";
import Link from "next/link";
import { useDaily } from "./DailyMode";
import DailyDial from "./DailyDial";
import { dailyPlan } from "@/lib/daily";

/* Demo of the page a customer gets after starting a plan: drag through the days to see it fill. */
const RING = "https://cdn.shopify.com/s/files/1/0841/2905/4957/files/NS-2121-5-2-0.jpg?v=1792333617";
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export default function DailyMyRing() {
  const on = useDaily(); const price = 1089, d = dailyPlan(price); const [day, setDay] = useState(27);
  if (!on) return <main className="dh"><div className="wrap" style={{ paddingTop: 160 }}><h1>Not available</h1><Link href="/" className="pill">Back to the shop</Link></div></main>;
  const paid = Math.min(price, day * d.perDay), left = price - paid;
  const st = (n: number) => (day >= n ? "done" : "");
  return (
    <main className="dmr"><div className="wrap">
      <div className="dmr-banner"><span>This is a demo of your &ldquo;My ring&rdquo; page</span><Link href="/engagement-rings">Start my plan</Link></div>
      <div className="dmr-grid">
        <DailyDial pct={(paid / price) * 100} image={RING} />
        <div>
          <small className="eyebrow">My ring · Day {day} of {d.days}</small>
          <h1>{day >= d.days ? "It’s all yours, Sofia." : "Your ring is on its way, Sofia."}</h1>
          <p className="dh-lead">{usd(paid)} paid · {usd(left)} to go · ${d.perDay} a day</p>
          <input className="dsc-sl" type="range" min={1} max={d.days} value={day} onChange={e => setDay(Number(e.target.value))} aria-label="Day" />
          <div className="dsc-t"><span>Drag through the days</span><span>Day {d.days}</span></div>
          <div className="dmr-steps">
            <div className="done"><em>✓</em><div>Paid ${d.perDay}, it shipped<small>Day 1 · insured, signature</small></div></div>
            <div className={st(4) || "now"}><em>{day >= 4 ? "✓" : "2"}</em><div>On your hand<small>Day 4</small></div></div>
            <div className={st(d.days) || (day >= 4 ? "now" : "")}><em>{day >= d.days ? "✓" : "3"}</em><div>All yours<small>Day {d.days}, or earlier, any time</small></div></div>
          </div>
          <div className="dmr-pay"><button className="pill dk">Pay ahead</button><button className="pill">Pay it off · {usd(left)}</button></div>
          <div className="dmr-feed"><h5>Payments</h5>{[0, 1, 2, 3].filter(i => day - i >= 1).map(i => <div key={i}><span>{i === 0 ? "Today" : i === 1 ? "Yesterday" : `${i} days ago`}</span><span>${d.perDay} <b>✓</b></span></div>)}</div>
        </div>
      </div>
    </div></main>
  );
}
