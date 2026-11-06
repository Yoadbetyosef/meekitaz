"use client";
import { useEffect } from "react";

/* Home hero, computers (approved 2026-11-06): when her film ends, a second clip continues from the same frame — she lifts a flat
   opaque board in the next section's colour until it fills the frame. The page samples the frames itself; the moment the frame is
   uniform, an overlay with the next section's look appears on the board's own colour (settling to the site colour), and the page
   scrolls itself to the real section so the hand-off is seamless. Any user move stops the automation. No loop, no rewind. */
const LIFT = "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261106_033915_f20a9d4b-e7f6-4018-9010-844339693a2a.mp4";
const M_W = 866, M_H = 627;

export default function HeroLift({ mPath }: { mPath: string }) {
  useEffect(() => {
    if (window.matchMedia("(max-width:767px)").matches) return; // computers only
    const box = document.querySelector<HTMLElement>(".cover.one .cv-film"), v1 = box?.querySelector<HTMLVideoElement>("video");
    if (!box || !v1) return;
    v1.loop = false;
    const v2 = document.createElement("video"); v2.muted = true; v2.playsInline = true; v2.preload = "none"; v2.crossOrigin = "anonymous"; v2.className = "cv-lift"; v2.setAttribute("aria-hidden", "true");
    box.appendChild(v2);
    const ov = document.createElement("div"); ov.className = "mk-liftov"; ov.setAttribute("aria-hidden", "true");
    ov.innerHTML = `<i class="mkd-grid"></i><i class="mkd-x x1"></i><i class="mkd-x x2"></i><i class="mkd-x x3"></i><i class="mkd-x x4"></i><span class="mkd-lab l1">Meekitaz</span><span class="mkd-lab l2">Est. New York</span><span class="mkd-lab l3">Lab-grown &middot; IGI certified</span><div class="mk-liftm"><svg viewBox="0 0 ${M_W} ${M_H}" fill-rule="evenodd"><path d="${mPath}"/></svg></div>`;
    document.body.appendChild(ov);
    let moved = false, phase = 0, raf = 0;
    const stop = () => { moved = true; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.addEventListener(e, stop, { passive: true }));
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 36; const ctx = cv.getContext("2d", { willReadFrequently: true });
    const uniform = () => { try { if (!ctx) return null; ctx.drawImage(v2, 0, 0, 64, 36); const d = ctx.getImageData(0, 0, 64, 36).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } r /= n; g /= n; b /= n; let dev = 0; for (let i = 0; i < d.length; i += 4) dev += Math.abs(d[i] - r) + Math.abs(d[i + 1] - g) + Math.abs(d[i + 2] - b); return { r, g, b, dev: dev / n }; } catch { return null; } };
    // preload the lift clip once her film is running
    const onPlay = () => { if (!v2.getAttribute("src")) { v2.src = LIFT; v2.preload = "auto"; v2.load(); } };
    v1.addEventListener("play", onPlay); if (!v1.paused) onPlay();
    const reveal = (col: string | null) => {
      phase = 2; v2.pause();
      ov.style.background = col || "#E5E3EF"; ov.classList.add("on"); window.setTimeout(() => { ov.style.background = "#E5E3EF"; }, 60);
      if (moved || window.scrollY > 40) { window.setTimeout(() => ov.classList.remove("on"), 900); return; }
      const sec = document.getElementById("film"); if (!sec) return;
      const H = window.innerHeight, secTop = sec.offsetTop, openAt = secTop + Math.round((sec.offsetHeight - H) * .86);
      const tween = (to: number, dur: number, ease: (p: number) => number, then?: () => void) => { const y0 = window.scrollY, t0 = performance.now(); const step = (now: number) => { if (moved) { ov.classList.remove("on"); return; } const p = Math.min(1, (now - t0) / dur); window.scrollTo(0, y0 + (to - y0) * ease(p)); if (p < 1) requestAnimationFrame(step); else if (then) then(); }; requestAnimationFrame(step); };
      const out = (p: number) => 1 - Math.pow(1 - p, 4), inout = (p: number) => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      window.setTimeout(() => tween(secTop, 1000, out, () => { ov.classList.remove("on"); window.setTimeout(() => { if (!moved) tween(openAt, 1200, inout); }, 350); }), 700);
    };
    const onEnded = () => { phase = 1; v2.style.opacity = "1"; v1.style.opacity = "0"; document.body.classList.add("hero-lift"); v2.play().catch(() => {}); };
    v1.addEventListener("ended", onEnded);
    v2.addEventListener("ended", () => { if (phase === 1) reveal(null); }); // if the frames can't be sampled (CORS), reveal at the clip's end
    const tick = () => { if (phase === 1) { if (v2.currentTime > 1.2) document.body.classList.add("hero-lift-up"); const u = uniform(); if (u && u.dev < 14) reveal(`rgb(${u.r | 0},${u.g | 0},${u.b | 0})`); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); v1.removeEventListener("ended", onEnded); v1.removeEventListener("play", onPlay); ["wheel", "touchstart", "keydown", "pointerdown"].forEach(e => window.removeEventListener(e, stop)); v2.remove(); ov.remove(); document.body.classList.remove("hero-lift", "hero-lift-up"); };
  }, [mPath]);
  return null;
}
