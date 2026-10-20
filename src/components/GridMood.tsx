"use client";
import { useEffect, useRef } from "react";

/** A silent, looping mood video that lives inside the product grid as a full-row tile. No sound, no controls; it plays only while on screen and is
 *  fetched only when it comes near, so it costs nothing on pages where nobody scrolls to it. */
export default function GridMood({ src, poster }: { src: string; poster: string }) {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { if (!el.getAttribute("src")) el.setAttribute("src", src); el.play().catch(() => {}); } else el.pause(); }), { threshold: 0.2, rootMargin: "300px 0px" });
    io.observe(el); return () => io.disconnect();
  }, [src]);
  return (
    <div className="gmood" aria-hidden="true">
      <video ref={v} muted loop playsInline preload="none" poster={poster} disablePictureInPicture />
    </div>
  );
}
