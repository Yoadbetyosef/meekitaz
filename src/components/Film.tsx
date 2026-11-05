"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Signature from "@/components/Signature";

/* Home · "Made, not mined." — the film sits small under the title and opens to a big window (not full screen) as you
   scroll; when it's open, the handwritten Meekitaz signature writes itself on it in glowing white, then a line and the button. */
const M_W = 866, M_H = 627, M_D = "M61 132 L63 163 L69 183 L82 209 L98 231 L119 253 L149 280 L192 314 L222 335 L120 202 L95 158 L88 138 L87 124 L90 114 L101 104 L112 101 L133 102 L162 108 L185 116 L216 131 L235 143 L262 165 L302 209 L319 232 L346 275 L393 368 L407 384 L414 389 L427 394 L436 394 L448 390 L458 383 L468 372 L476 360 L519 274 L552 223 L576 193 L605 163 L640 136 L667 121 L691 111 L715 104 L740 100 L757 101 L768 105 L776 113 L779 122 L779 133 L772 155 L752 192 L719 238 L642 336 L704 290 L740 259 L762 237 L788 202 L797 184 L802 169 L805 152 L805 126 L799 101 L787 76 L772 55 L748 32 L716 13 L689 4 L660 0 L626 2 L609 6 L588 14 L563 29 L535 55 L514 84 L460 195 L447 218 L434 236 L415 208 L356 87 L340 62 L315 35 L302 25 L283 14 L259 5 L232 0 L203 0 L169 7 L135 22 L114 37 L96 55 L85 69 L68 101 Z M89 241 L89 277 L86 291 L77 315 L59 345 L18 403 L5 432 L1 450 L0 467 L2 482 L9 501 L29 529 L54 552 L87 574 L130 595 L181 612 L227 622 L269 626 L285 620 L301 603 L313 582 L318 569 L324 539 L324 507 L318 475 L308 449 L284 413 L246 373 L222 352 L167 313 L131 284 Z M776 241 L734 284 L718 298 L644 353 L607 385 L581 413 L564 437 L555 454 L548 472 L542 502 L542 537 L545 555 L553 579 L565 600 L578 615 L591 623 L598 625 L615 625 L653 619 L711 602 L748 587 L788 566 L821 543 L846 518 L859 496 L865 472 L865 456 L862 439 L853 415 L845 400 L801 337 L786 310 L779 290 L776 275 Z"; // our M as a vector, so it can be any colour

export default function Film() {
  const sec = useRef<HTMLElement>(null), box = useRef<HTMLDivElement>(null), head = useRef<HTMLDivElement>(null), v = useRef<HTMLVideoElement>(null);
  const mL = useRef<HTMLDivElement>(null), mR = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [sound, setSound] = useState(false);

  useEffect(() => {
    const s = sec.current!, b = box.current!, h = head.current!, vid = v.current!, l = mL.current!, rr = mR.current!;
    let raf = 0, vis = false, wasOpen = false;
    const ease = (p: number) => p * p * (3 - 2 * p), cl = (x: number) => Math.min(1, Math.max(0, x));
    /* "D" (approved 2026-11-03): our M sits whole in the middle; scrolling splits it into two halves that slide apart, and the film
       opens between them like a curtain up to its full window — then the signature, line, button and sound work as before */
    const frame = () => {
      raf = 0; if (!vis) return;
      const r = s.getBoundingClientRect(), W = window.innerWidth, H = window.innerHeight, phone = W < 768;
      const p = cl(-r.top / (s.offsetHeight - H));
      const g = ease(cl((p - .12) / .7));
      const tw = phone ? W * .9 : Math.min(W * .64, 1240), th = phone ? Math.min(H * .7, tw * 1.25) : Math.min(H * .76, tw / 1.65);
      b.style.width = tw * g + "px"; b.style.height = th * (.5 + .5 * g) + "px";
      b.style.visibility = g < .01 ? "hidden" : "visible";
      b.style.top = 56 - 6 * g + "%"; b.style.borderRadius = "22px";
      const dx = (tw / 2 + 200) * ease(cl(p / .7)), mo = String(1 - cl((p - .45) / .3));
      l.style.transform = `translate(calc(-50% - ${dx}px),-50%)`; rr.style.transform = `translate(calc(-50% + ${dx}px),-50%)`;
      l.style.top = rr.style.top = 56 - 6 * g + "%"; l.style.opacity = rr.style.opacity = mo;
      h.style.opacity = String(1 - Math.min(1, ease(cl(p / .5)) * 1.6));
      const isOpen = g > .98;
      if (isOpen !== wasOpen) { if (isOpen) setOpen(true); else if (p < .2) setOpen(false); wasOpen = isOpen; }
    };
    const tick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    const io = new IntersectionObserver(([e]) => {
      vis = e.isIntersecting;
      if (vis) { vid.play().catch(() => {}); tick(); } else vid.pause();
    }, { rootMargin: "100px" });
    io.observe(s); window.addEventListener("scroll", tick, { passive: true }); window.addEventListener("resize", tick);
    return () => { io.disconnect(); window.removeEventListener("scroll", tick); window.removeEventListener("resize", tick); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section className="mkopen" id="film" ref={sec} aria-label="Made, not mined">
      <div className="mko-stick">
        <div className="mko-head" ref={head}><small>Made, not mined</small><h2>Worn loudly.</h2></div>
        {/* the opening's look (approved 2026-11-05): faint grid, four corner plus marks, three small labels — in our blue on the lavender */}
        <div className="mko-deco" aria-hidden="true"><i className="mkd-grid" /><i className="mkd-x x1" /><i className="mkd-x x2" /><i className="mkd-x x3" /><i className="mkd-x x4" /><span className="mkd-lab l1">Meekitaz</span><span className="mkd-lab l2">Est. New York</span><span className="mkd-lab l3">Lab-grown &middot; IGI certified</span></div>
        <div className="mko-m mko-ml" ref={mL} aria-hidden="true"><svg viewBox={`0 0 ${M_W} ${M_H}`} fillRule="evenodd"><path d={M_D} /></svg></div>
        <div className="mko-m mko-mr" ref={mR} aria-hidden="true"><svg viewBox={`0 0 ${M_W} ${M_H}`} fillRule="evenodd"><path d={M_D} /></svg></div>
        <div className={`mko-box${open ? " open" : ""}`} ref={box}>
          <video ref={v} playsInline muted loop preload="metadata" poster="/media/meekitaz-film-poster.jpg">
            <source src="/media/meekitaz-film.mp4" type="video/mp4" />
          </video>
          <div className="mko-shade" aria-hidden="true" />
          <div className="mko-over">
            <Signature on={open} />
            <div className="mko-cta">
              <p>Every stone IGI or GIA certified, grown above ground, set in New York.</p>
              <Link href="/engagement-rings" className="pill">Shop engagement rings</Link>
            </div>
          </div>
          <button className={`mko-snd${sound ? " on" : ""}`} type="button" aria-label={sound ? "Sound off" : "Sound on"}
            onClick={() => { const el = v.current!; el.muted = sound; setSound(!sound); if (!sound) el.play().catch(() => {}); }}>
            {sound ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M18.5 6.5a8 8 0 0 1 0 11" /></svg>
                   : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h4l5 4V5L8 9H4z" /><path d="M19 9l-4 6M15 9l4 6" /></svg>}
          </button>
        </div>
      </div>
    </section>
  );
}
