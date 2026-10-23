"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "./Logo";
import { showroomImage } from "@/lib/data";

/** The end of every product page: who we are, in pink. Our wordmark, one line about the house, the three promises, the Fifth Avenue showroom with a way to book it,
 *  and the brand reel in a tall, slightly crooked frame with a turning badge. The reel loads and plays only while it is near the screen. */
export default function BrandEnd() {
  const box = useRef<HTMLElement>(null), vid = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = box.current, v = vid.current; if (!el || !v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!v.getAttribute("src")) v.setAttribute("src", "/media/brand-reel.mp4"); if (!reduce) v.play().catch(() => {}); }
      else v.pause();
    }), { rootMargin: "300px 0px", threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section className="be" ref={box} aria-label="About Meekitaz">
      <div className="wrap"><div className="be-grid">
        <div className="be-l">
          <Logo className="be-logo" />
          <p className="be-p"><i>Serious diamonds, worn lightly.</i><br />Lab-grown diamonds, certified, set the way a diamantaire sets for family, not for inventory. Come and see them first.</p>
          <div className="be-facts"><span>IGI certified</span><span>Lifetime warranty</span><span>30-day returns</span></div>
          <div className="be-show">
            <Image src={showroomImage} alt="The Meekitaz showroom" width={192} height={192} sizes="96px" quality={75} />
            <div><b>Fifth Avenue, New York</b><span>The showroom, by appointment. Or a virtual one, with the stones on camera.</span><Link href="/#contact" className="pill">Book a visit</Link></div>
          </div>
        </div>
        <div className="be-v">
          <svg className="be-spin" viewBox="0 0 120 120" role="img" aria-label="Most trusted brand 2026"><circle cx="60" cy="60" r="58" /><defs><path id="be-cp" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" /></defs><text><textPath href="#be-cp" textLength="268" lengthAdjust="spacing">Most trusted brand · 2026 ·</textPath></text></svg>
          <div className="be-fr"><video ref={vid} muted loop playsInline preload="none" poster="/media/brand-reel-poster.jpg" aria-label="Meekitaz, a short film" /></div>
        </div>
      </div></div>
    </section>
  );
}
