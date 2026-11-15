"use client";
import { useEffect, useState } from "react";

/* One small round switch, bottom-left, for trying a whole-site colour language ("Plum": plum, cream, peach, lilac, apricot,
   tangerine). Only a browser that has opened meekitaz.com/?look=1 sees it (?look=0 removes it); it adds html.mi, which re-points
   the site's colours (see the end of globals.css). Off for everyone else. */
const SHOW = "mk-look-show", ON = "mk-mi-on";
export default function PaletteSwitch() {
  const [show, setShow] = useState(false), [on, setOn] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(location.search).get("look");
      if (q === "1") localStorage.setItem(SHOW, "1");
      if (q === "0") { localStorage.removeItem(SHOW); localStorage.removeItem(ON); }
      const s = localStorage.getItem(SHOW) === "1", o = s && localStorage.getItem(ON) === "1";
      setShow(s); setOn(o); document.documentElement.classList.toggle("mi", o);
    } catch { /* private mode: no switch */ }
  }, []);
  if (!show) return null;
  const flip = () => { const n = !on; setOn(n); document.documentElement.classList.toggle("mi", n); try { localStorage.setItem(ON, n ? "1" : "0"); } catch { /* ignore */ } };
  return <button type="button" className={`pal-sw${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label="Bold look" title={on ? "Bold look: on" : "Bold look: off"} onClick={flip} />;
}
