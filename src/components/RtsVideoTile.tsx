"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";

/* Engagement rings grid: a Ready-to-Ship film as a photo tile → the in-stock rings. The film only loads and plays while the tile is on
   screen (the supplier's films are heavy), and stops and unloads when it leaves. */
const FILM = "https://im.lgdus.co/Jwl/RG8426/RG8426.mp4"; // White gold Diamond Three-Stone Ring · 5.61 ct (reel-rg8426)
const POSTER = "https://cdn.shopify.com/s/files/1/0841/2905/4957/files/RG8426_20_1.png?v=1793250163&width=800";

export default function RtsVideoTile() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const vid = v.current; if (!vid) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!vid.getAttribute("src")) vid.src = FILM; vid.muted = true; vid.play().catch(() => {}); }
      else { vid.pause(); if (vid.getAttribute("src")) { vid.removeAttribute("src"); vid.load(); } }
    }, { threshold: 0.35 });
    io.observe(vid); return () => io.disconnect();
  }, []);
  return (
    <div className="pgrid-slot">
      <Link href="/ready-to-ship?type=Ring#results" className="op-tile op-link op-film">
        <video ref={v} poster={POSTER} muted loop playsInline preload="none" aria-label="A three-stone radiant diamond ring turning, ready to ship" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <span className="op-cap"><small>Ready to ship · in 48 hours</small><b>Explore ready&nbsp;to&nbsp;ship &rarr;</b></span>
      </Link>
    </div>
  );
}
