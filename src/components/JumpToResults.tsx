"use client";
import { useEffect } from "react";

/** Arriving with ?build=1 (from "Choose this setting"/"Choose this diamond") puts the customer at the filters and results, not at the top of the page. */
export default function JumpToResults() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.get("build")) return;
    let stop = false;
    const cancel = () => { stop = true; };
    window.addEventListener("wheel", cancel, { passive: true, once: true });
    window.addEventListener("touchstart", cancel, { passive: true, once: true });
    window.addEventListener("keydown", cancel, { once: true });
    const go = () => { const el = document.getElementById(q.get("to") || "results"); if (el && !stop) el.scrollIntoView({ behavior: "auto", block: "start" }); };
    // the list loads after the page does and the page grows: keep the filters in place for a moment
    const times = [0, 150, 400, 800, 1400, 2200, 3200];
    const ids = times.map(t => setTimeout(go, t));
    const done = setTimeout(() => { q.delete("build"); q.delete("to"); window.history.replaceState(window.history.state, "", window.location.pathname + (q.toString() ? "?" + q : "")); }, 3400);
    return () => { ids.forEach(clearTimeout); clearTimeout(done); };
  }, []);
  return null;
}
