"use client";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { useDaily } from "./DailyMode";
import { dailyPlan } from "@/lib/daily";

/* Meekitaz Daily checkout (preview): everything in the bag, the plan, the schedule and the two steps to start. Payment is the next build. */
const usd = (n: number) => "$" + (Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });
const day = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
export default function DailyCheckout() {
  const on = useDaily(); const { cart, rings } = useCart();
  if (!on) return <main className="dh"><div className="wrap" style={{ paddingTop: 160 }}><h1>Not available</h1><Link href="/" className="pill">Back to the shop</Link></div></main>;
  const lines = cart?.lines || [];
  const items = [
    ...rings.map(r => ({ k: r.id, img: r.setting.image, stone: r.stone.image, t: `${r.setting.title.replace(/^(Yellow gold|White gold|Rose gold|Platinum)\s+/i, "")} + ${r.stone.carat.toFixed(2)} ct ${r.stone.shape}`, sub: [r.setting.karat, r.setting.metal, r.size ? `size ${r.size}` : "size: choose in bag"].filter(Boolean).join(" · "), p: r.setting.price + r.stone.price })),
    ...lines.map(l => ({ k: l.id, img: l.image?.url || "", stone: "", t: l.title, sub: [l.variantTitle !== "Default Title" ? l.variantTitle : "", ...l.attributes.map(a => `${a.key}: ${a.value}`)].filter(Boolean).join(" · "), p: l.price * l.quantity })),
  ];
  const total = items.reduce((a, b) => a + b.p, 0);
  if (!items.length) return <main className="dco"><div className="wrap"><h1>Your bag is empty</h1><Link href="/engagement-rings" className="pill dk">Find your ring</Link></div></main>;
  const d = dailyPlan(total); const start = new Date();
  const sched = Array.from({ length: 7 }, (_, i) => { const x = new Date(start); x.setDate(x.getDate() + i); return x; });
  const end = new Date(start); end.setDate(end.getDate() + d.days - 1);
  return (
    <main className="dco"><div className="wrap">
      <Link href="/" className="dco-back">← Keep shopping</Link>
      <small className="eyebrow">Meekitaz Daily</small>
      <h1>Start your plan.</h1>
      <div className="dco-grid">
        <section>
          <div className="dco-card"><h3>Your bag</h3>
            {items.map(x => <div key={x.k} className="dco-i"><span className="im" style={{ backgroundImage: `url(${x.img})` }}>{x.stone && <i className="duo-st" style={{ backgroundImage: `url(${x.stone})` }} />}</span><div><b>{x.t}</b><small>{x.sub}</small></div><em>{usd(x.p)}</em></div>)}
            <div className="dco-tot"><span>Total</span><b>{usd(total)}</b></div>
          </div>
          <div className="dco-card"><h3>Two quick steps</h3>
            <div className="dco-step"><em>1</em><div><b>Verify it&rsquo;s you</b><small>A photo of your ID and a selfie. One minute. No credit check.</small></div><button disabled>Verify</button></div>
            <div className="dco-step"><em>2</em><div><b>Connect your bank</b><small>Secure, in one tap. ${d.perDay} a day comes straight from your account.</small></div><button disabled>Connect</button></div>
            <p className="dco-soon">Preview: identity and bank connection are the next build.</p>
          </div>
        </section>
        <aside className="dco-plan">
          <small>Your plan</small>
          <div className="dly-big"><b className="dly-holo">${d.perDay}</b><span>a day</span></div>
          <p>{d.days} days · {usd(total)} total · no interest · everyone&rsquo;s approved</p>
          <div className="dly-meter"><i style={{ width: `${Math.max(6, Math.round(100 / d.days))}%` }} /></div>
          <div className="dly-mt"><span>Today · ${d.perDay}</span><span>Ships now</span><span>{day(end)} · all yours</span></div>
          <h4>Your first week</h4>
          <ul>{sched.map((x, i) => <li key={i}><span>{i === 0 ? "Today" : day(x)}</span><b>${d.perDay}</b></li>)}</ul>
          <p className="dco-fine">Then ${d.perDay} every day until {day(end)}; the last payment is ${d.last}. Pay ahead or pay it off any time. It&rsquo;s yours from day one: not a rental, not a lease.</p>
          <button className="dco-go" disabled>Start for ${d.perDay} today</button>
        </aside>
      </div>
    </div></main>
  );
}
