"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { loadPlan, savePlan, clearPlan, planTotal, perDay, planTier, usdR, type Plan } from "@/lib/plan";
import { loadSetting } from "@/lib/setting";

/** The customer's plan, live: updates on every change anywhere on the site. */
export function usePlan(): Plan | null {
  const [p, setP] = useState<Plan | null>(null);
  useEffect(() => { const r = () => setP(loadPlan()); r(); window.addEventListener("mk-plan", r); window.addEventListener("storage", r); return () => { window.removeEventListener("mk-plan", r); window.removeEventListener("storage", r); }; }, []);
  return p;
}

/** On any card: the piece per day on the plan, and whether it fits ("In your plan") or how much more a day it is. With `ring`, a
 *  stone is shown as the whole ring — the saved setting plus this stone. */
export function PlanTag({ price, ring = false }: { price: number; ring?: boolean }) {
  const p = usePlan(); const [setP, setSetP] = useState(0);
  useEffect(() => { if (ring) { const s = loadSetting(); setSetP(s?.price || 0); } }, [ring]);
  if (!p || !price) return null;
  const all = price + (ring ? setP : 0), tier = planTier(all, p), d = perDay(all, p);
  return (
    <span className={`pl-tag pl-${tier}`}>
      <b>{usdR(d)}<i> a day{ring && setP ? " · the ring" : ""}</i></b>
      <em>{tier === "in" ? "✓ In your plan" : `+${usdR(d - p.day)} a day`}</em>
    </span>
  );
}

/** The plan bar: once a plan is started it follows the customer on every page — change the amount or the months any time. */
export function PlanBar() {
  const p = usePlan(), path = usePathname(); const [open, setOpen] = useState(false);
  if (!p || path?.startsWith("/admin") || path === "/") return null;
  return (
    <div className={`pl-bar${open ? " open" : ""}`} role="region" aria-label="Your Meekitaz Daily plan">
      <button type="button" className="pl-sum" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>Your plan</span><b>{usdR(p.day)}</b><span>a day · {p.months} mo · up to</span><b>{usdR(planTotal(p))}</b>
      </button>
      {open && <div className="pl-edit">
        <input type="range" min={1} max={50} value={p.day} onChange={e => savePlan({ ...p, day: +e.target.value })} aria-label="Dollars a day" />
        <div className="pl-mo">{[1, 2, 3, 4].map(m => <button key={m} type="button" className={m === p.months ? "on" : ""} onClick={() => savePlan({ ...p, months: m })}>{m}</button>)}<span>mo</span></div>
      </div>}
      <Link href="/daily/picks" className="pl-go">Picked for you →</Link>
      <button type="button" className="pl-x" onClick={clearPlan} aria-label="Remove my plan">×</button>
    </div>
  );
}

/** Above the diamonds when a setting has been chosen: how much of the plan is left for the stone, and a "Fit my plan" button. */
export function PlanMeter({ onFit }: { onFit: (max: number) => void }) {
  const p = usePlan(); const [s, setS] = useState<{ title: string; price: number } | null>(null);
  useEffect(() => { const v = loadSetting(); if (v) setS({ title: v.title, price: v.price }); }, []);
  if (!p || !s) return null;
  const t = planTotal(p), left = t - s.price;
  return (
    <div className="pl-meter">
      <div className="pl-ln"><span>Setting <b>{usdR(s.price)}</b></span><span>Your plan <b>{usdR(t)}</b></span></div>
      <div className="pl-track"><i className="s" style={{ width: Math.min(100, s.price / Math.max(t, s.price) * 100) + "%" }} /><i className="st" style={{ width: Math.max(0, left) / Math.max(t, s.price) * 100 + "%" }} /></div>
      <p>{left > 0 ? <>You have <b>{usdR(left)}</b> left for the stone — about <b>{usdR(Math.floor(left / (30 * p.months)))} a day</b>. Every stone below shows the whole ring, per day.</> : <>This setting alone is over your plan — every stone shows how much more a day.</>}</p>
      {left > 0 && <button type="button" className="pl-fit" onClick={() => onFit(Math.floor(left))}>Fit my plan</button>}
    </div>
  );
}
