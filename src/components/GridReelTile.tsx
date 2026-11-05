"use client";
import { useEffect, useRef } from "react";

/* A tall film tile inside a product grid (one column, two rows on computers; full width on phones). Loads and plays only on screen. */
export default function GridReelTile({ src, poster, label, href }: { src: string; poster: string; label?: string; href?: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = src; vid.muted = true; vid.play().catch(() => {}); }
      else { vid.pause(); }
    }, { threshold: 0.25 });
    io.observe(vid); return () => io.disconnect();
  }, [src]);
  const inner = (<>
    <video ref={v} muted loop playsInline preload="none" poster={poster} aria-hidden="true" />
    <i className="fl-plus p1" aria-hidden="true" /><i className="fl-plus p3" aria-hidden="true" />
    {label && <span className="grt-lab">{label}</span>}
  </>);
  return (
    <div className="pgrid-slot">
      {href ? <a className="op-tile grt" href={href}>{inner}</a> : <div className="op-tile grt">{inner}</div>}
    </div>
  );
}
