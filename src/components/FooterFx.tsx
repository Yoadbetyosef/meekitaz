"use client";
import { useEffect } from "react";

/** The footer sits pinned behind the page; as the page lifts away its content settles up into place. */
export default function FooterFx() {
  useEffect(() => {
    const page = document.getElementById("mk-page"), inner = document.getElementById("mkfoot-in");
    if (!page || !inner || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const draw = () => {
      raf = 0;
      const t = Math.max(0, Math.min(1, (window.innerHeight - page.getBoundingClientRect().bottom) / window.innerHeight));
      inner.style.transform = `translateY(${(1 - t) * 12}%)`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(draw); };
    draw(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return null;
}
