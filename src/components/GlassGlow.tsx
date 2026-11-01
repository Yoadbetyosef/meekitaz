"use client";
import { useEffect } from "react";

/* TRIAL (2026-10-31): the glass buttons glow when pressed — a bloom of light on the button, a ring of light that spreads from it,
   a few sparks from the point pressed. Pairs with the "GLASS BUTTONS" block at the end of globals.css; delete both to revert. */
export const GLASS_BTN = ".pill,.cv-pill,.ooo-btn,.rh-btn,.pp-add,.cd-co,.dcard-cta,.nf-cta,.lr-go,.hush-cta,.sl-all,.sq-all,.pc-next,.dd-choose,.pc-form button,.cd-empty a,.mko-cta .pill";

export default function GlassGlow() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const onDown = (e: PointerEvent) => {
      const b = (e.target as Element)?.closest?.(GLASS_BTN) as HTMLElement | null; if (!b) return;
      b.classList.remove("gl-glow"); void b.offsetWidth; b.classList.add("gl-glow");
      setTimeout(() => b.classList.remove("gl-glow"), 1100);
      const r = b.getBoundingClientRect();
      const w = document.createElement("span"); w.className = "gl-wave";
      Object.assign(w.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
      document.body.appendChild(w); setTimeout(() => w.remove(), 950);
      for (let i = 0; i < 8; i++) {
        const s = document.createElement("span"); s.className = "gl-spark";
        const a = Math.random() * Math.PI * 2, d = 26 + Math.random() * 40;
        s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
        s.style.setProperty("--dx", Math.cos(a) * d + "px"); s.style.setProperty("--dy", Math.sin(a) * d + "px");
        document.body.appendChild(s); setTimeout(() => s.remove(), 850);
      }
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);
  return null;
}
