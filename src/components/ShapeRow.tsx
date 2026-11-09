"use client";
import StoneImg from "./StoneImg";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ShapeRow({ styles, className, ink }: { styles: { img: string; label: string }[]; className: string; ink?: boolean }) {
  const router = useRouter(), path = usePathname(), sel = useSearchParams().get("style") || "";
  function choose(label: string) {
    const next = sel === label ? "" : label;
    const q = new URLSearchParams(window.location.search);
    if (next) q.set("style", next); else q.delete("style");
    router.replace(q.toString() ? `${path}?${q}` : path, { scroll: false });
    if (next) setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  return (
    <div className={`${className}${sel ? " has-sel" : ""}${ink ? " ink" : ""}`}>
      {styles.map(s => (
        <button key={s.label} type="button" className={`sp${sel === s.label ? " on" : ""}`} aria-pressed={sel === s.label} onClick={() => choose(s.label)}>
          {ink
            /* (2026-11-08, N3) his cobalt drawings stand free on the page — no circle */
            // eslint-disable-next-line @next/next/no-img-element
            ? <span className="sp-ink"><img src={s.img} alt={s.label} /></span>
            : <span className="sp-img"><StoneImg img={s.img} alt={s.label} base={170} /></span>}<b>{ink ? s.label.replace(/ Necklace$/, "") : s.label}</b>
        </button>
      ))}
    </div>
  );
}
