"use client";
import { useEffect, useState } from "react";
import { loadStone, type Stone } from "@/lib/setting";

/* Shown the instant a stone is tapped, while its page is being prepared: the very stone, from what was just saved. */
export default function StoneLoading() {
  const [s, setS] = useState<Stone | null>(null);
  useEffect(() => { setS(loadStone()); }, []);
  return (
    <main className="df df-loading" aria-busy="true">
      <div className="dfl-stone">
        {s?.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.image} alt="" referrerPolicy="no-referrer" /> : <i />}
      </div>
      <div className="dfl-tx">{s ? <><b>{s.carat.toFixed(2)} ct</b><span>{[s.shape, s.fancy || s.color, s.clarity].filter(Boolean).join(" · ")}</span></> : <><b>&nbsp;</b><span>&nbsp;</span></>}</div>
    </main>
  );
}
