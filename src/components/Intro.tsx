"use client";
import { useEffect, useState } from "react";

/* Site opening (approved 2026-11-05, "F4"): only when the home page is reached from outside the site (typed domain, a link, search),
   once per visit. Blue screen with a faint grid, plus marks, small labels and a 000→100 counter; our M and the Meekitaz wordmark cut
   hard between each other and grow fast; the wordmark ends as a huge translucent watermark; the screen lifts away. ~1.8s. */
const M = {"w": 866, "h": 627, "d": ["M61 132 L63 163 L69 183 L82 209 L98 231 L119 253 L149 280 L192 314 L222 335 L120 202 L95 158 L88 138 L87 124 L90 114 L101 104 L112 101 L133 102 L162 108 L185 116 L216 131 L235 143 L262 165 L302 209 L319 232 L346 275 L393 368 L407 384 L414 389 L427 394 L436 394 L448 390 L458 383 L468 372 L476 360 L519 274 L552 223 L576 193 L605 163 L640 136 L667 121 L691 111 L715 104 L740 100 L757 101 L768 105 L776 113 L779 122 L779 133 L772 155 L752 192 L719 238 L642 336 L704 290 L740 259 L762 237 L788 202 L797 184 L802 169 L805 152 L805 126 L799 101 L787 76 L772 55 L748 32 L716 13 L689 4 L660 0 L626 2 L609 6 L588 14 L563 29 L535 55 L514 84 L460 195 L447 218 L434 236 L415 208 L356 87 L340 62 L315 35 L302 25 L283 14 L259 5 L232 0 L203 0 L169 7 L135 22 L114 37 L96 55 L85 69 L68 101 Z", "M89 241 L89 277 L86 291 L77 315 L59 345 L18 403 L5 432 L1 450 L0 467 L2 482 L9 501 L29 529 L54 552 L87 574 L130 595 L181 612 L227 622 L269 626 L285 620 L301 603 L313 582 L318 569 L324 539 L324 507 L318 475 L308 449 L284 413 L246 373 L222 352 L167 313 L131 284 Z", "M776 241 L734 284 L718 298 L644 353 L607 385 L581 413 L564 437 L555 454 L548 472 L542 502 L542 537 L545 555 L553 579 L565 600 L578 615 L591 623 L598 625 L615 625 L653 619 L711 602 L748 587 L788 566 L821 543 L846 518 L859 496 L865 472 L865 456 L862 439 L853 415 L845 400 L801 337 L786 310 L779 290 L776 275 Z"]};
const WM = "/brand/meekitaz-logo-white.png";
const msvg = (outline: boolean) => `<svg viewBox="0 0 ${M.w} ${M.h}" fill-rule="evenodd"><path d="${M.d.join(" ")}" style="${outline ? "fill:none;stroke:#fff;stroke-width:3;vector-effect:non-scaling-stroke" : "fill:#fff"}"/></svg>`;
const wm = `<img src="${WM}" alt="" />`;
const PHONE = ["/media/intro/d0.png", "/media/passage/b2.png", "/media/passage/e1.png", "/media/passage/n0.png", "/media/passage/b4.png", "/media/passage/k3.png"];
const ill = (i: number) => `<img src="/media/intro/d${i}.png" alt="" />`;
/* W1 (approved 2026-11-08): our M / Meekitaz flicker with his six ink drawings woven in at the same pace, ending on the big Meekitaz watermark */
const SEQ: [string, number, number | "full" | "ill"][] = [[msvg(true), 220, .3], [msvg(false), 180, .5], [ill(0), 180, "ill"], [wm, 180, .8], [ill(1), 160, "ill"], [msvg(false), 180, 1.0], [ill(2), 180, "ill"], [wm, 180, 1.4], [ill(3), 160, "ill"], [msvg(false), 160, 1.6], [ill(4), 160, "ill"], [wm, 180, 2.2], [ill(5), 180, "ill"], [wm, 560, "full"]];

/* decided before React runs (inline script in the page), so the first frame is on screen at once even while the page is still loading */
export const INTRO_GATE = `(function(){try{if(sessionStorage.getItem("mk-intro"))return;var r=document.referrer;if(r&&new URL(r).origin===location.origin)return;sessionStorage.setItem("mk-intro","1");sessionStorage.setItem("mk-entry","1");document.documentElement.classList.add("mk-intro-on");}catch(e){}})();`;

export default function Intro() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!document.documentElement.classList.contains("mk-intro-on")) { setDone(true); return; }
    // (2026-11-10, approved "V3"): phones get their own opening — cream, a pink window, his drawings bursting out over its top edge,
    // then the window fills the screen and a huge white Meekitaz watermark spills past the edges. ~1.7s. Computers keep the blue (W1).
    if (window.matchMedia("(max-width: 767px)").matches) {
      const it3 = document.getElementById("mk-intro3"), c3 = document.getElementById("mk-intro3-c"), f3 = document.getElementById("mk-intro3-fr");
      if (!it3 || !c3 || !f3) return;
      document.documentElement.style.overflow = "hidden";
      PHONE.forEach(src => { const im = new Image(); im.src = src; }); { const im = new Image(); im.src = WM; }
      const BEAT = 185, starts = PHONE.map((_, i) => 100 + i * BEAT), wmAt = 100 + PHONE.length * BEAT, total = wmAt + 560;
      let t0 = 0, step = -1, raf = 0, lifted = false, finished = false, wm = false;
      const tick = (now: number) => {
        if (!t0) t0 = now; const e = now - t0;
        while (step + 1 < PHONE.length && e >= starts[step + 1]) { step++; c3.innerHTML = `<img src="${PHONE[step]}" alt="" />`; c3.classList.remove("pop"); void c3.offsetWidth; c3.classList.add("pop"); }
        if (e >= wmAt && !wm) { wm = true; f3.classList.add("fill"); c3.innerHTML = `<img src="${WM}" alt="" />`; c3.classList.remove("pop"); c3.classList.add("wm"); }
        if (e >= total && !lifted) { lifted = true; it3.classList.add("out"); document.documentElement.classList.add("mk-intro-lift"); window.dispatchEvent(new Event("mk-intro-lift")); }
        if (e >= total + 600 && !finished) { finished = true; document.documentElement.style.overflow = ""; document.documentElement.classList.remove("mk-intro-on", "mk-intro-lift"); window.dispatchEvent(new Event("mk-intro-done")); setDone(true); }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => { cancelAnimationFrame(raf); document.documentElement.style.overflow = ""; };
    }
    const it = document.getElementById("mk-intro"), fr = document.getElementById("mk-intro-fr"), cnt = document.getElementById("mk-intro-cnt");
    if (!it || !fr) return;
    document.documentElement.style.overflow = "hidden";
    [0, 1, 2, 3, 4, 5].forEach(i => { const im = new Image(); im.src = `/media/intro/d${i}.png`; });
    // a timeline driven by real elapsed time (not stacked timeouts), so a slow first load cannot collapse the whole sequence into its last frame
    const starts: number[] = []; let t = 120; SEQ.forEach(([, ms]) => { starts.push(t); t += ms; }); const total = t;
    let t0 = 0, step = -1, raf = 0, lifted = false, finished = false;
    const tick = (now: number) => {
      if (!t0) t0 = now; const e = now - t0;
      while (step + 1 < SEQ.length && e >= starts[step + 1]) {
        step++; const [h, , sc] = SEQ[step]; fr.innerHTML = h; fr.style.opacity = "1";
        if (sc === "full") { fr.style.width = window.innerWidth < 768 ? "150vw" : "130vw"; fr.style.opacity = ".28"; fr.style.transform = "translate(-50%,-50%)"; fr.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1),opacity .25s"; }
        else if (sc === "ill") { fr.style.width = "auto"; fr.style.transition = ""; fr.style.transform = "translate(-50%,-50%)"; fr.classList.add("ill"); }
        else { fr.style.width = ""; fr.style.transition = ""; fr.style.transform = `translate(-50%,-50%) scale(${sc})`; }
        if (sc !== "ill") fr.classList.remove("ill");
      }
      if (cnt) cnt.textContent = String(Math.min(100, Math.round(Math.max(0, e - 120) / (total - 120) * 20) * 5)).padStart(3, "0");
      if (e >= total + 80 && !lifted) { lifted = true; it.classList.add("out"); document.documentElement.classList.add("mk-intro-lift"); window.dispatchEvent(new Event("mk-intro-lift")); } // her film starts as the blue lifts
      if (e >= total + 700 && !finished) { finished = true; document.documentElement.style.overflow = ""; document.documentElement.classList.remove("mk-intro-on", "mk-intro-lift"); window.dispatchEvent(new Event("mk-intro-done")); setDone(true); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); document.documentElement.style.overflow = ""; };
  }, []);
  if (done) return null;
  return (
    <>
    <div className="mk-intro3" id="mk-intro3" aria-hidden="true"><i className="mki3-fr" id="mk-intro3-fr" /><div className="mki3-c" id="mk-intro3-c" /></div>
    <div className="mk-intro" id="mk-intro" aria-hidden="true">
      <i className="mki-grid" /><i className="mki-x x1" /><i className="mki-x x2" /><i className="mki-x x3" /><i className="mki-x x4" />
      <span className="mki-lab l1">Meekitaz</span><span className="mki-lab l2">Est. New York</span><span className="mki-lab l3">Lab-grown &middot; IGI certified</span>
      <div className="mki-fr" id="mk-intro-fr" dangerouslySetInnerHTML={{ __html: msvg(true) }} style={{ opacity: 1, transform: "translate(-50%,-50%) scale(.3)" }} />
      <span className="mki-cnt" id="mk-intro-cnt">000</span>
    </div>
    </>
  );
}
