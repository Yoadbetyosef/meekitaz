"use client";
import { useEffect, useState } from "react";

/* (2026-11-15) Private switch for trying three "rhythms" of section sizes on the site: 0 = the site as it is, 1 = Big / small,
   2 = Statements, 3 = Quiet. Only a browser that has opened meekitaz.com/?look=1 sees it (?look=0 removes it). It sets html.sz1 /
   .sz2 / .sz3 — the rules are at the end of globals.css. Everyone else gets the site as it is. */
const SHOW = "mk-look-show", KEY = "mk-sz";
const NAMES = ["As it is", "Big / small", "Statements", "Quiet"];
export default function SizeSwitch() {
  const [show, setShow] = useState(false), [v, setV] = useState(0);
  const apply = (n: number) => { const c = document.documentElement.classList; c.remove("sz1", "sz2", "sz3", "mi"); if (n) c.add(`sz${n}`); };
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get("look");
      if (q === "1") localStorage.setItem(SHOW, "1");
      if (q === "0") { localStorage.removeItem(SHOW); localStorage.removeItem(KEY); }
      localStorage.removeItem("mk-mi-on");
      const s = localStorage.getItem(SHOW) === "1", n = s ? Math.max(0, Math.min(3, Number(localStorage.getItem(KEY)) || 0)) : 0;
      setShow(s); setV(n); apply(n);
    } catch { /* private mode: no switch */ }
  }, []);
  if (!show) return null;
  const pick = (n: number) => { setV(n); apply(n); try { localStorage.setItem(KEY, String(n)); } catch { /* ignore */ } window.dispatchEvent(new Event("resize")); };
  return (
    <div className="sz-sw" role="radiogroup" aria-label="Section sizes">
      {NAMES.map((t, n) => <button key={n} type="button" role="radio" aria-checked={v === n} className={v === n ? "on" : ""} title={t} onClick={() => pick(n)}>{n}</button>)}
    </div>
  );
}
