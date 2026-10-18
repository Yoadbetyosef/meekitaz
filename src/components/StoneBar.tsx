"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { clearStone, loadStone, stoneLabel, type Stone } from "@/lib/setting";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** On the rings page, when a diamond was picked first: "Your diamond: now choose a setting for it". */
export default function StoneBar() {
  const [s, setS] = useState<Stone | null>(null);
  useEffect(() => { const sync = () => setS(loadStone()); sync(); window.addEventListener("mk-stone", sync); return () => window.removeEventListener("mk-stone", sync); }, []);
  if (!s) return null;
  return (
    <div className="sbar2" aria-label="Your diamond">
      <div className="sbar2-in">
        {s.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.image} alt="" referrerPolicy="no-referrer" />}
        <div><small>Your diamond</small><b>{stoneLabel(s)}</b><span>{[s.fancy || s.color, s.clarity, s.lab].filter(Boolean).join(" · ")} · {usd(s.price)} · now choose a setting</span></div>
        <Link href={`/diamonds/${s.vendor}-${encodeURIComponent(s.stock)}`}>View</Link>
        <button type="button" onClick={clearStone}>Remove</button>
      </div>
    </div>
  );
}
