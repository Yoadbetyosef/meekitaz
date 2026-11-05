"use client";
import { useEffect, useState } from "react";

/* Site opening (approved 2026-11-05, "F4"): only when the home page is reached from outside the site (typed domain, a link, search),
   once per visit. Blue screen with a faint grid, plus marks, small labels and a 000→100 counter; our M and the Meekitaz wordmark cut
   hard between each other and grow fast; the wordmark ends as a huge translucent watermark; the screen lifts away. ~1.8s. */
const M = {"w": 866, "h": 627, "d": ["M61 132 L63 163 L69 183 L82 209 L98 231 L119 253 L149 280 L192 314 L222 335 L120 202 L95 158 L88 138 L87 124 L90 114 L101 104 L112 101 L133 102 L162 108 L185 116 L216 131 L235 143 L262 165 L302 209 L319 232 L346 275 L393 368 L407 384 L414 389 L427 394 L436 394 L448 390 L458 383 L468 372 L476 360 L519 274 L552 223 L576 193 L605 163 L640 136 L667 121 L691 111 L715 104 L740 100 L757 101 L768 105 L776 113 L779 122 L779 133 L772 155 L752 192 L719 238 L642 336 L704 290 L740 259 L762 237 L788 202 L797 184 L802 169 L805 152 L805 126 L799 101 L787 76 L772 55 L748 32 L716 13 L689 4 L660 0 L626 2 L609 6 L588 14 L563 29 L535 55 L514 84 L460 195 L447 218 L434 236 L415 208 L356 87 L340 62 L315 35 L302 25 L283 14 L259 5 L232 0 L203 0 L169 7 L135 22 L114 37 L96 55 L85 69 L68 101 Z", "M89 241 L89 277 L86 291 L77 315 L59 345 L18 403 L5 432 L1 450 L0 467 L2 482 L9 501 L29 529 L54 552 L87 574 L130 595 L181 612 L227 622 L269 626 L285 620 L301 603 L313 582 L318 569 L324 539 L324 507 L318 475 L308 449 L284 413 L246 373 L222 352 L167 313 L131 284 Z", "M776 241 L734 284 L718 298 L644 353 L607 385 L581 413 L564 437 L555 454 L548 472 L542 502 L542 537 L545 555 L553 579 L565 600 L578 615 L591 623 L598 625 L615 625 L653 619 L711 602 L748 587 L788 566 L821 543 L846 518 L859 496 L865 472 L865 456 L862 439 L853 415 L845 400 L801 337 L786 310 L779 290 L776 275 Z"]};
const WM = "/brand/meekitaz-logo-white.png";
const msvg = (outline: boolean) => `<svg viewBox="0 0 ${M.w} ${M.h}" fill-rule="evenodd"><path d="${M.d.join(" ")}" style="${outline ? "fill:none;stroke:#fff;stroke-width:3;vector-effect:non-scaling-stroke" : "fill:#fff"}"/></svg>`;
const wm = `<img src="${WM}" alt="" />`;
const SEQ: [string, number, number | "full"][] = [[msvg(true), 110, .3], [msvg(false), 110, .5], [wm, 110, .8], [msvg(false), 110, 1.0], [wm, 110, 1.4], [msvg(false), 120, 1.6], [wm, 120, 2.2], [wm, 520, "full"]];

export default function Intro() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("mk-intro")) return;
      const ref = document.referrer; if (ref && new URL(ref).origin === location.origin) return; // came from inside the site
      sessionStorage.setItem("mk-intro", "1");
    } catch { return; }
    setShow(true);
  }, []);
  useEffect(() => {
    if (!show) return;
    const it = document.getElementById("mk-intro"), fr = document.getElementById("mk-intro-fr"), cnt = document.getElementById("mk-intro-cnt");
    if (!it || !fr) return;
    document.documentElement.style.overflow = "hidden";
    const tm: number[] = []; let t = 120;
    const phone = window.innerWidth < 768;
    SEQ.forEach(([h, ms, sc]) => { tm.push(window.setTimeout(() => {
      fr.innerHTML = h; fr.style.opacity = "1";
      if (sc === "full") { fr.style.width = phone ? "150vw" : "130vw"; fr.style.opacity = ".28"; fr.style.transform = "translate(-50%,-50%)"; fr.style.transition = "transform .25s cubic-bezier(.2,.8,.2,1),opacity .25s"; }
      else { fr.style.width = ""; fr.style.transition = ""; fr.style.transform = `translate(-50%,-50%) scale(${sc})`; }
    }, t)); t += ms; });
    const total = t;
    for (let i = 0; i <= 20; i++) tm.push(window.setTimeout(() => { if (cnt) cnt.textContent = String(i * 5).padStart(3, "0"); }, 120 + i * (total - 120) / 20));
    tm.push(window.setTimeout(() => { it.classList.add("out"); }, total + 80));
    tm.push(window.setTimeout(() => { document.documentElement.style.overflow = ""; setShow(false); }, total + 700));
    return () => { tm.forEach(clearTimeout); document.documentElement.style.overflow = ""; };
  }, [show]);
  if (!show) return null;
  return (
    <div className="mk-intro" id="mk-intro" aria-hidden="true">
      <i className="mki-grid" /><i className="mki-x x1" /><i className="mki-x x2" /><i className="mki-x x3" /><i className="mki-x x4" />
      <span className="mki-lab l1">Meekitaz</span><span className="mki-lab l2">Est. New York</span><span className="mki-lab l3">Lab-grown &middot; IGI certified</span>
      <div className="mki-fr" id="mk-intro-fr" />
      <span className="mki-cnt" id="mk-intro-cnt">000</span>
    </div>
  );
}
