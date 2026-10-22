"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Jewelry type filter on the Gemstones page (All / Rings / Earrings / Bands ...). Works together with the stone-colour tiles: both live in the address bar. */
export default function GemTypeBar({ types }: { types: string[] }) {
  const router = useRouter(), path = usePathname(), sel = useSearchParams().get("type") || "";
  function choose(t: string) {
    const q = new URLSearchParams(window.location.search);
    if (t && t !== sel) q.set("type", t); else q.delete("type");
    router.replace(q.toString() ? `${path}?${q}` : path, { scroll: false });
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  return (
    <div className="gt-chips" role="group" aria-label="Jewelry type">
      <button type="button" className={`gt-chip${!sel ? " on" : ""}`} aria-pressed={!sel} onClick={() => choose("")}>All</button>
      {types.map(t => <button key={t} type="button" className={`gt-chip${sel === t ? " on" : ""}`} aria-pressed={sel === t} onClick={() => choose(t)}>{t}</button>)}
    </div>
  );
}
