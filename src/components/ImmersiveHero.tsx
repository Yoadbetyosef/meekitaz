"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { photoSrc, isCleaned } from "@/lib/img";
import { DIAMOND } from "./StoneSwatch";

/** The top of every product page: a full-screen gallery (the worn photo, the piece, the stone, the film) with the choices in glass on top.
 *  A photo turns the page dark with white type; a product shot on white turns it warm cream with dark type, so the piece is always seen properly.
 *  Desktop: one glass card on the right. Phone: metal in a slim bar at the top, everything else with the price and the button in a panel at the bottom, all on screen at once. */
type Img = { url: string; alt: string };
type Slide = { kind: "img" | "stone" | "film"; url?: string; alt: string; label: string };
const VIEW_NAMES = ["The piece", "Another view", "Detail", "Detail", "Detail", "Detail"];

/** Is this picture a photograph (dark page) rather than a product shot on white (cream page)? Looks at the corners and edges. Null when the browser will not let us look. */
function looksLikePhoto(el: HTMLImageElement): boolean | null {
  try {
    const c = document.createElement("canvas"); c.width = 16; c.height = 16;
    const x = c.getContext("2d", { willReadFrequently: true }); if (!x) return null;
    x.drawImage(el, 0, 0, 16, 16);
    const pts: [number, number][] = [[0, 0], [15, 0], [0, 15], [15, 15], [8, 0], [0, 8], [15, 8], [8, 15]];
    let sum = 0; for (const [px, py] of pts) { const d = x.getImageData(px, py, 1, 1).data; sum += (d[0] + d[1] + d[2]) / 3; }
    return sum / pts.length < 225;
  } catch { return null; }
}

export default function ImmersiveHero({ title, bigTitle, images, model, stone, steps, summary, price, metal, rows, cta, appt, onVisible }: {
  title: string; bigTitle: string; images: Img[]; model?: string; stone?: string; summary?: string[];
  steps?: ReactNode; price: ReactNode; metal?: ReactNode; rows?: ReactNode; cta: ReactNode; appt?: ReactNode; onVisible?: (on: boolean) => void;
}) {
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = images.map(im => ({ kind: "img" as const, url: im.url, alt: im.alt, label: "" }));
    const m = model ? list.findIndex(s => s.url === model) : -1;
    if (m > 0) { const [x] = list.splice(m, 1); list.unshift(x); } // the worn photo opens the page
    let n = 0; list.forEach(s => { s.label = s.url === model ? "Worn" : VIEW_NAMES[Math.min(n++, VIEW_NAMES.length - 1)]; });
    return [...list, { kind: "stone", alt: "The stone", label: "The stone" }, { kind: "film", alt: "Meekitaz, a short film", label: "The film" }];
  }, [images, model]);
  const N = slides.length;
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false); // phone: the sheet at the bottom, folded (title, what is chosen, price, button) or open (every choice)
  const [modes, setModes] = useState<Record<string, "photo" | "piece">>({});
  const box = useRef<HTMLElement>(null), vid = useRef<HTMLVideoElement>(null), vis = useRef(true);
  const cur = Math.min(i, N - 1);
  const modeOf = useCallback((s: Slide): "photo" | "piece" => s.kind === "film" ? "photo" : s.kind === "stone" ? "piece" : (modes[s.url || ""] ?? (s.url === model ? "photo" : "piece")), [modes, model]);
  const go = useCallback((k: number) => setI(((k % N) + N) % N), [N]);
  useEffect(() => { setI(x => Math.min(x, N - 1)); }, [N]);

  // phone: where the folded sheet starts, so the picture can fill everything above it and carry on behind it
  const fit = useCallback(() => {
    const el = box.current; if (!el) return;
    if (window.innerWidth > 767) { el.style.removeProperty("--sht"); return; }
    const ctl = el.querySelector(".ih-ctl"); if (!ctl || el.classList.contains("open")) return;
    el.style.setProperty("--sht", `${Math.round(ctl.getBoundingClientRect().top - el.getBoundingClientRect().top)}px`);
  }, []);
  useEffect(() => {
    fit();
    const ro = new ResizeObserver(fit); const c = box.current?.querySelector(".ih-ctl"); if (c) ro.observe(c);
    window.addEventListener("resize", fit); return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, [fit, cur, rows, open]);

  // the film loads when it is near, plays only while it is the slide on screen and the hero is on screen
  useEffect(() => {
    const v = vid.current; if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const near = slides[cur]?.kind === "film" || slides[(cur + 1) % N]?.kind === "film";
    if (near && !v.getAttribute("src")) v.setAttribute("src", "/media/brand-reel.mp4");
    if (slides[cur]?.kind === "film" && vis.current && !reduce) v.play().catch(() => {}); else v.pause();
  }, [cur, slides, N]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { vis.current = e.isIntersecting; onVisible?.(e.isIntersecting); const v = vid.current; if (v && !e.isIntersecting) v.pause(); }), { threshold: 0.12 });
    io.observe(el); return () => io.disconnect();
  }, [onVisible]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null; if (t && /^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)) return;
      if (!vis.current) return;
      if (e.key === "ArrowRight") go(cur + 1); else if (e.key === "ArrowLeft") go(cur - 1); else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key);
  }, [cur, go]);

  // swipe (phone), and a tap on the left or right third of the picture
  const x0 = useRef<number | null>(null);
  const down = (e: React.PointerEvent) => { if ((e.target as HTMLElement).closest(".ih-ctl,.ih-thumbs,.ih-pager,.rsteps,.ih-scrim,.ih-ar,.ih-cnt")) { x0.current = null; return; } x0.current = e.clientX; };
  const up = (e: React.PointerEvent) => {
    if (x0.current === null) return; const dx = e.clientX - x0.current; x0.current = null;
    if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 10 && e.pointerType !== "mouse") { const r = e.currentTarget.getBoundingClientRect(), f = (e.clientX - r.left) / r.width; if (f > 0.66) go(cur + 1); else if (f < 0.34) go(cur - 1); }
  };
  const onImg = (url: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (url === model) return; const p = looksLikePhoto(e.currentTarget);
    if (p !== null) setModes(m => (m[url] === (p ? "photo" : "piece") ? m : { ...m, [url]: p ? "photo" : "piece" }));
  };
  const s = slides[cur], mode = modeOf(s);
  const len = bigTitle.length, sz = len <= 22 ? "l1" : len <= 40 ? "l2" : "l3";
  const diamond = DIAMOND[stone || ""] || DIAMOND.White;
  const src = (u: string, w: number, k: number) => photoSrc(u, w, title, k);
  return (
    <section className={`ih${open ? " open" : ""}`} ref={box} data-mode={mode} onPointerDown={down} onPointerUp={up} aria-roledescription="carousel" aria-label={`${title}, photos`}>
      <div className="ih-slides">
        {slides.map((sl, k) => {
          const m = modeOf(sl), on = k === cur;
          return (
            <div key={`${sl.kind}-${sl.url || k}`} className={`ih-sl ${m}${on ? " on" : ""}`} aria-hidden={!on}>
              {sl.kind === "img" && sl.url && (m === "photo"
                ? <div className={`ih-ph2${sl.url === model ? " mdl" : ""}`}><Image className="ih-bk" src={src(sl.url, 300, k)} alt="" fill sizes="30vw" quality={40} unoptimized={isCleaned(src(sl.url, 300, k))} /><Image className="ih-fg" src={src(sl.url, 1500, k)} alt={sl.alt} fill sizes="100vw" quality={78} priority={k === 0} unoptimized={isCleaned(src(sl.url, 1500, k))} onLoad={onImg(sl.url)} /></div>
                : <div className="ih-pc"><Image className="ih-pi" src={src(sl.url, 1400, k)} alt={sl.alt} fill sizes="(max-width:767px) 92vw, 820px" quality={80} priority={k === 0} unoptimized={isCleaned(src(sl.url, 1400, k))} onLoad={onImg(sl.url)} /></div>)}
              {sl.kind === "stone" && <div className="ih-pc st"><Image src={diamond} alt="" fill sizes="(max-width:767px) 70vw, 560px" quality={80} /></div>}
              {sl.kind === "film" && <video ref={vid} muted loop playsInline preload="none" poster="/media/brand-reel-poster.jpg" aria-label={sl.alt} />}
            </div>
          );
        })}
      </div>
      <div className="ih-shade" />
      {open && <div className="ih-scrim" onClick={() => setOpen(false)} />}
      <span className="ih-cnt" aria-hidden="true">{String(cur + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
      <button type="button" className="ih-ar l" aria-label="Previous photo" onClick={() => go(cur - 1)}><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></button>
      <button type="button" className="ih-ar r" aria-label="Next photo" onClick={() => go(cur + 1)}><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg></button>
      <div className="ih-segs" aria-hidden="true">{slides.map((_, k) => <i key={k} className={k === cur ? "on" : ""} />)}</div>

      <div className="ih-tt">
        <small className="eyebrow">Lab-grown · IGI certified</small>
        <h1 aria-label={title} className={sz}>{bigTitle}</h1>
        <span className="ih-cap" aria-live="polite">{s.label}</span>
      </div>

      <div className="ih-thumbs">{slides.map((sl, k) => (
        <button key={k} type="button" className={k === cur ? "on" : ""} aria-label={sl.label} aria-current={k === cur} onClick={() => go(k)}>
          {sl.kind === "img" && sl.url && <Image src={src(sl.url, 160, k)} alt="" width={64} height={64} quality={60} unoptimized={isCleaned(src(sl.url, 160, k))} />}
          {sl.kind === "stone" && <Image src={diamond} alt="" width={64} height={64} quality={60} />}
          {sl.kind === "film" && <><Image src="/media/brand-reel-poster.jpg" alt="" width={64} height={64} quality={60} /><span className="pl">▶</span></>}
        </button>))}
      </div>
      <div className="ih-pager">
        <button type="button" className="ih-arr" aria-label="Previous photo" onClick={() => go(cur - 1)}><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" /></svg></button>
        <span className="ih-cn">{String(cur + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
        <span className="ih-bars" aria-hidden="true">{slides.map((_, k) => <i key={k} className={k === cur ? "on" : ""} />)}</span>
        <button type="button" className="ih-arr" aria-label="Next photo" onClick={() => go(cur + 1)}><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg></button>
        <span className="ih-nx">Next · {slides[(cur + 1) % N].label}</span>
      </div>

      <div className="ih-ctl">
        <button type="button" className="ih-x" aria-label="Close the choices" onClick={() => setOpen(false)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        <button type="button" className="ih-hdl" aria-label={open ? "Fold the choices" : "Open the choices"} aria-expanded={open} onClick={() => setOpen(o => !o)}><i /></button>
        <div className="ih-pk">
          {steps}
          <h2 className="ih-st" onClick={() => setOpen(o => !o)}>{bigTitle}</h2>
          {summary && summary.length > 0 && <div className="ih-pills" onClick={() => setOpen(o => !o)}>{summary.map((t, k) => <span key={k}>{t}</span>)}<span className="m">{open ? "Done ▾" : "Change ▴"}</span></div>}
        </div>
        {(metal || steps) && <div className="ih-top">{steps}{metal}</div>}
        <div className="ih-bot">
          <div className="ih-pa"><div className="ih-price">{price}</div><div className="ih-cta">{cta}</div></div>
          {rows && <div className="ih-rows">{rows}</div>}
          {appt && <div className="ih-appt">{appt}</div>}
        </div>
      </div>
    </section>
  );
}
