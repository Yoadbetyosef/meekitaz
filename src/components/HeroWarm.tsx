"use client";
import { useEffect } from "react";

/** When someone is about to open a category (hover, touch, click), start downloading that page's top photo right away. The page itself takes a moment
 *  to arrive from the server, and the photo downloads in parallel instead of after it, so the photo is already there when the page appears. */
export default function HeroWarm({ map }: { map: Record<string, { d: string; m: string }> }) {
  useEffect(() => {
    const done = new Set<string>();
    const widths = [390, 430, 640, 768, 1024, 1280, 1536, 1920, 2560]; // the image sizes we serve
    const warm = (slug: string) => {
      const e = map[slug]; if (!e || done.has(slug)) return; done.add(slug);
      const src = window.matchMedia("(max-width:767px)").matches ? e.m : e.d; if (!src) return;
      const need = window.innerWidth * (window.devicePixelRatio || 1);
      const w = widths.find(x => x >= need) || widths[widths.length - 1];
      const im = new Image(); im.decoding = "async"; im.src = `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=78`;
    };
    const on = (ev: Event) => {
      const a = (ev.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank") return;
      let u: URL; try { u = new URL(a.href, window.location.href); } catch { return; }
      if (u.origin !== window.location.origin) return;
      warm(u.pathname.replace(/^\//, "").split("/")[0]);
    };
    const evs = ["pointerover", "touchstart", "pointerdown"] as const;
    evs.forEach(n => document.addEventListener(n, on, { passive: true, capture: true }));
    return () => evs.forEach(n => document.removeEventListener(n, on, { capture: true }));
  }, [map]);
  return null;
}
