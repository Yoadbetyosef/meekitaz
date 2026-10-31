"use client";
import { useEffect, useRef } from "react";

/* Home · the Floating collection: the same frame as the Meekitaz film above, mirrored — film on the left, the name on the right. */
export default function FloatingFilm() {
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current; if (!el) return;
    el.muted = true;
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) el.play().catch(() => {}); else el.pause(); }), { threshold: 0.25, rootMargin: "300px 0px" });
    io.observe(el); return () => io.disconnect();
  }, []);
  return (
    <section className="mkfilm flip" aria-label="Floating collection">
      <div className="mkfilm-in">
        <div className="mkfilm-vid">
          <video ref={v} playsInline muted loop preload="none" poster="/media/floating-collection-poster.jpg">
            <source src="/media/floating-collection.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="mkfilm-txt"><h2>Floating collection</h2></div>
      </div>
    </section>
  );
}
