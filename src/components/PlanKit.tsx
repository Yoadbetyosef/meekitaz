"use client";
import { useEffect, useState } from "react";
import { loadPlan, perDay, usdR, type Plan } from "@/lib/plan";
import { loadSetting } from "@/lib/setting";

/* Meekitaz Daily — the customer's plan inside the site's own design (approved 2026-11-09): no new bars or badges, only the site's
   filter chip, its tag row and one more price line on the cards. */
export function usePlan(): Plan | null {
  const [p, setP] = useState<Plan | null>(null);
  useEffect(() => { const r = () => setP(loadPlan()); r(); window.addEventListener("mk-plan", r); window.addEventListener("storage", r); return () => { window.removeEventListener("mk-plan", r); window.removeEventListener("storage", r); }; }, []);
  return p;
}

/** One line under the card's price, in the price's own type: "$13 a day", or "$16 a day +$1" when it's over the plan. With `ring`,
 *  a stone is shown as the whole ring — the saved setting plus this stone. */
export function PlanDay({ price, ring = false }: { price: number; ring?: boolean }) {
  const p = usePlan(); const [setP, setSetP] = useState(0);
  useEffect(() => { if (ring) setSetP(loadSetting()?.price || 0); }, [ring]);
  if (!p || !price) return null;
  const all = price + (ring ? setP : 0), d = perDay(all, p), over = d > p.day;
  return <span className={`price pl-day${over ? " over" : ""}`}>{ring && setP ? "the ring " : ""}{usdR(d)} a day{over ? <em>+{usdR(d - p.day)}</em> : null}</span>;
}
