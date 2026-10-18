"use client";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ShapeRow({ styles, className }: { styles: { img: string; label: string }[]; className: string }) {
  const router = useRouter(), path = usePathname(), sel = useSearchParams().get("style") || "";
  function choose(label: string) {
    const next = sel === label ? "" : label;
    router.replace(next ? `${path}?style=${encodeURIComponent(next)}` : path, { scroll: false });
    if (next) setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }
  return (
    <div className={`${className}${sel ? " has-sel" : ""}`}>
      {styles.map(s => (
        <button key={s.label} type="button" className={`sp${sel === s.label ? " on" : ""}`} aria-pressed={sel === s.label} onClick={() => choose(s.label)}>
          <span className="sp-img"><Image src={s.img} alt={s.label} fill sizes="160px" quality={70} /></span><b>{s.label}</b>
        </button>
      ))}
    </div>
  );
}
