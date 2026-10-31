"use client";
import { useEffect, useRef } from "react";

export default function FloatingHeroVideo() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => { const el = v.current; if (!el) return; el.muted = true; el.play().catch(() => {}); }, []);
  return <video ref={v} className="flp-vid" src="/media/floating-collection.mp4" poster="/media/floating-collection-poster.jpg" muted loop playsInline autoPlay preload="auto" />;
}
