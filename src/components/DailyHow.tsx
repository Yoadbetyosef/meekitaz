"use client";
import { useState } from "react";
import Link from "next/link";
import { useDaily } from "./DailyMode";
import { dailyPlan, DAILY } from "@/lib/daily";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const STEPS = [
  { n: "01", t: "Pick anything", d: "Any ring, any diamond, any piece. Everyone’s approved, no credit check: just your name, an ID and your bank." },
  { n: "02", t: `Pay $${DAILY.perDay} a day`, d: "Straight from your bank, a little every day. No interest, no fees, the total is the price." },
  { n: "03", t: "Wear it in 3 weeks", d: "We make it for you in New York and ship it insured while you keep paying." },
  { n: "04", t: "It’s yours", d: "From day one it’s yours: not a rental, not a lease. Pay it off early any time." },
];
const FAQ = [
  ["Is there interest or a fee?", "No. You pay exactly the price of the piece, split into days. No interest, no late-fee traps."],
  ["Do you check my credit?", "No. Everyone’s approved. We only verify it’s really you (ID) and connect your bank account."],
  ["When do I get it?", "We start making it on day one and ship it in about three weeks, insured, with signature."],
  ["Can I pay it off early?", "Any time, in one tap from your “My ring” page."],
  ["Is it a rental?", "Never. It’s yours. You’re simply paying for it a day at a time."],
];
export default function DailyHow() {
  const on = useDaily(); const [price, setPrice] = useState(1089);
  if (!on) return <main className="dh"><div className="wrap"><h1>Not available</h1><p className="dh-lead">This page isn&rsquo;t public yet.</p><Link href="/" className="pill">Back to the shop</Link></div></main>;
  const d = dailyPlan(price);
  return (
    <main className="dh">
      <section className="dh-hero"><div className="wrap">
        <small className="eyebrow">Meekitaz Daily</small>
        <h1><span>${DAILY.perDay}</span> a day.<br />Yours to keep.</h1>
        <p className="dh-lead">The easiest way to own fine jewelry. Everyone&rsquo;s approved, no credit check, no interest, and it&rsquo;s yours, not a rental.</p>
        <div className="dh-ctas"><Link href="/engagement-rings" className="pill dk">Find your ring</Link><Link href="/daily/my-ring" className="pill">See a “My ring” page</Link></div>
      </div></section>
      <section className="wrap dh-steps">{STEPS.map(s => <div key={s.n} className="dh-step"><em>{s.n}</em><b>{s.t}</b><p>{s.d}</p></div>)}</section>
      <section className="wrap dh-calc">
        <div><small className="eyebrow">Try it</small><h2>What would yours be?</h2><p className="dh-lead">Slide to the price of the piece you love.</p>
          <input type="range" min={300} max={6000} step={50} value={price} onChange={e => setPrice(Number(e.target.value))} aria-label="Price" />
          <div className="dh-range"><span>$300</span><b>{usd(price)}</b><span>$6,000</span></div></div>
        <div className="dh-res"><div className="dh-big"><b>${d.perDay}</b><span>a day</span></div>
          <div className="dh-facts"><div><b>{d.days}</b><small>days</small></div><div><b>Day {DAILY.shipDay}</b><small>it ships</small></div><div><b>{usd(price)}</b><small>total, no interest</small></div></div>
          <p className="dh-note">That&rsquo;s less than a coffee and a croissant, for something you&rsquo;ll wear forever.</p></div>
      </section>
      <section className="wrap dh-promise"><h2>It&rsquo;s yours from day one.</h2><p>Not a rental. Not a lease. Not a loan with surprises. You choose it, you wear it in three weeks, and you finish paying ${DAILY.perDay} a day.</p></section>
      <section className="wrap dh-faq"><h2>Questions</h2>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
    </main>
  );
}
