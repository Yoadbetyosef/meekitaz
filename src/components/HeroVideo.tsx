"use client";
import { useEffect, useRef } from "react";

/** A looping, silent film over the category hero photo: the phone version on phones, the desktop version on computers.
 *  Only the one for this screen is downloaded; the photo stays underneath as the poster. */
export default function HeroVideo({ desktop, mobile }: { desktop?: string; mobile?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current; if (!el) return;
    const m = window.matchMedia("(max-width:767px)");
    const pick = () => { const src = m.matches ? mobile : desktop; if (!src) { el.removeAttribute("src"); el.load(); el.style.opacity = "0"; return; } if (el.getAttribute("src") !== src) { el.style.opacity = "0"; el.setAttribute("src", src); el.load(); } el.play().catch(() => {}); };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const show = () => { el.style.opacity = "1"; };
    el.addEventListener("playing", show); pick(); m.addEventListener("change", pick);
    return () => { el.removeEventListener("playing", show); m.removeEventListener("change", pick); };
  }, [desktop, mobile]);
  return <video ref={v} className="cat-hero-vid" muted loop playsInline autoPlay preload="auto" aria-hidden="true" />;
}
