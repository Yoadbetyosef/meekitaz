"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { clearStone, loadStone, stoneLabel, type Stone } from "@/lib/setting";
import { dailyPlan } from "@/lib/daily";
import { useDaily } from "./DailyMode";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** On the rings page, when a diamond was picked first: "Your diamond: now choose a setting for it". */
export function useStone() {
  const [s, setS] = useState<Stone | null>(null);
  useEffect(() => { const sync = () => setS(loadStone()); sync(); window.addEventListener("mk-stone", sync); return () => window.removeEventListener("mk-stone", sync); }, []);
  return s;
}
/** (approved 2026-11-13, "A") on each ring card when a diamond was picked first: what the whole ring comes to. */
export function WithStoneLine({ price }: { price: number }) {
  const s = useStone(), on = useDaily();
  if (!s || !price) return null;
  const t = price + s.price;
  return <span className="ws-line">With your diamond · <b>{on ? `$${dailyPlan(t).perDay} a day` : usd(t)}</b></span>;
}
export default function StoneBar() {
  const s = useStone();
  if (!s) return null;
  return (
    <div className="sbar2 sbar2-pin" aria-label="Your diamond">
      <div className="sbar2-in">
        {s.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.image} alt="" referrerPolicy="no-referrer" />}
        <div><small>Your diamond</small><b>{stoneLabel(s)}</b><span>{[s.fancy || s.color, s.clarity, s.lab].filter(Boolean).join(" · ")} · {usd(s.price)}</span><em>Now choose its ring — every ring here fits your {s.shape.toLowerCase()} diamond.</em></div>
        <Link href={`/diamonds/${s.vendor}-${encodeURIComponent(s.stock)}`}>Change</Link>
        <button type="button" onClick={clearStone}>Remove</button>
      </div>
    </div>
  );
}
