"use client";
import { useEffect, useState } from "react";

/* The "new language" switch — meekitaz.com/?look=1 (Yoad only, this browser only; ?look=0 removes it).
   One switch: the site exactly as it is, in the type of the home-page concept "01" — Inter Tight headings,
   Instrument Serif italics, JetBrains Mono labels — and buttons that turn blue under the pointer. Off = the site as it is today. */
const SHOW = "mk-look-show", ON = "mk-look-on";
const apply = (on: boolean) => document.body.classList.toggle("lk2", on);

export default function LookSwitch() {
  const [show, setShow] = useState(false), [on, setOn] = useState(true);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("look");
      if (q === "1") localStorage.setItem(SHOW, "1");
      if (q === "0") { localStorage.removeItem(SHOW); localStorage.removeItem(ON); }
      const s = localStorage.getItem(SHOW) === "1", o = !(s && localStorage.getItem(ON) === "0"); // on is the site now; off shows the earlier type
      setShow(s); setOn(o); apply(o);
    } catch { /* private mode: no switch */ }
  }, []);
  if (!show) return null;
  const flip = () => { const n = !on; setOn(n); apply(n); try { localStorage.setItem(ON, n ? "1" : "0"); } catch { /* ignore */ } };
  return (
    <button type="button" className={`lk-sw${on ? " on" : ""}`} role="switch" aria-checked={on} onClick={flip}>
      <i aria-hidden="true" /><span>{on ? "New language · on" : "Earlier type"}</span>
    </button>
  );
}
