"use client";
import { useEffect, useRef, useState } from "react";
import { isWished, toggleWish, type WishItem } from "@/lib/wish";
import { toast } from "./Toast";

const C = ["#F7D3DA", "#DCEBF4", "#F7E9A8", "#E9DDF3", "#E8738A"];
/** The heart: blooms pink with a burst of little diamonds and flies into the header heart. */
export default function WishHeart({ item, className = "" }: { item: WishItem; className?: string }) {
  const [on, setOn] = useState(false); const b = useRef<HTMLButtonElement>(null);
  useEffect(() => { const r = () => setOn(isWished(item.handle)); r(); window.addEventListener("mk-wish", r); return () => window.removeEventListener("mk-wish", r); }, [item.handle]);
  const click = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const now = toggleWish(item); setOn(now);
    if (!now) { toast("Removed from your Dream list"); return; }
    const el = b.current; if (!el) return;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
    const box = el.querySelector(".wh-burst"); if (box) { box.innerHTML = ""; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = 24 + Math.random() * 14, d = document.createElement("i"); d.style.background = C[i % 5]; d.style.setProperty("--x", `${Math.cos(a) * r}px`); d.style.setProperty("--y", `${Math.sin(a) * r}px`); box.appendChild(d); } }
    // a little heart flies to the header heart
    const target = document.querySelector(".nav-wish"); const r0 = el.getBoundingClientRect();
    if (target && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const r1 = target.getBoundingClientRect(), f = document.createElement("span"); f.className = "wh-fly";
      f.style.left = `${r0.left + r0.width / 2 - 10}px`; f.style.top = `${r0.top + r0.height / 2 - 10}px`; document.body.appendChild(f);
      requestAnimationFrame(() => { f.style.transform = `translate(${r1.left + r1.width / 2 - r0.left - r0.width / 2}px, ${r1.top + r1.height / 2 - r0.top - r0.height / 2}px) scale(.5)`; f.style.opacity = ".3"; });
      window.setTimeout(() => { f.remove(); target.classList.remove("bump"); void (target as HTMLElement).offsetWidth; target.classList.add("bump"); }, 720);
    }
    toast("Saved to your Dream list ♥");
  };
  return (
    <button ref={b} type="button" className={`wh${on ? " on" : ""} ${className}`} aria-pressed={on} aria-label={on ? "Remove from Dream list" : "Save to Dream list"} onClick={click} data-no-nav>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.6 7 4.6c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.7-1.8 4.6-9.3 9.2-9.3 9.2z" /></svg>
      <span className="wh-burst" aria-hidden="true" />
    </button>
  );
}
export function ShareArrow({ item, className = "" }: { item: WishItem; className?: string }) {
  return (
    <button type="button" className={`wsh ${className}`} aria-label="Share" data-no-nav onClick={e => { e.preventDefault(); e.stopPropagation(); window.dispatchEvent(new CustomEvent("mk-share", { detail: item })); }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8" /></svg>
    </button>
  );
}
