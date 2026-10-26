"use client";
import Link from "next/link";
import { useDaily } from "./DailyMode";
import { dailyPlan } from "@/lib/daily";

/* What a customer sees after starting a daily plan (demo data for the preview). */
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
export default function DailyMyRing() {
  const on = useDaily();
  if (!on) return <main className="dh"><div className="wrap"><h1>Not available</h1><Link href="/" className="pill">Back to the shop</Link></div></main>;
  const price = 1089, d = dailyPlan(price), day = 27, paid = Math.min(price, d.perDay * day), pct = Math.round((paid / price) * 100);
  const r = 120, c = 2 * Math.PI * r;
  return (
    <main className="dmr"><div className="wrap">
      <div className="dmr-grid">
        <div className="dmr-ring">
          <svg viewBox="0 0 280 280"><defs><linearGradient id="dmrg"><stop offset="0" stopColor="#F7D3DA" /><stop offset=".5" stopColor="#E9DDF3" /><stop offset="1" stopColor="#E8738A" /></linearGradient></defs>
            <circle cx="140" cy="140" r={r} fill="none" stroke="#EFE7DD" strokeWidth="16" />
            <circle cx="140" cy="140" r={r} fill="none" stroke="url(#dmrg)" strokeWidth="16" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="dmr-arc" /></svg>
          <span className="ph" /><span className="pct">{pct}% yours</span>
        </div>
        <div>
          <small className="eyebrow">My ring · Day {day} of {d.days}</small>
          <h1>Your ring is on its way, Sofia.</h1>
          <p className="dh-lead">{usd(paid)} paid · {usd(price - paid)} to go · ${d.perDay} a day</p>
          <div className="dmr-steps">
            <div className="done"><em>✓</em><div>Made for you<small>Cast and set in New York</small></div></div>
            <div className="done"><em>✓</em><div>Shipped, insured<small>FedEx · arrived on day 24</small></div></div>
            <div className="now"><em>3</em><div>All yours<small>Paid off on day {d.days}, or earlier, any time</small></div></div>
          </div>
          <div className="dmr-pay"><button className="pill dk">Pay ahead</button><button className="pill">Pay it off · {usd(price - paid)}</button><button className="pill">Bank & schedule</button></div>
          <p className="dmr-demo">Preview page with example data.</p>
        </div>
      </div>
    </div></main>
  );
}
