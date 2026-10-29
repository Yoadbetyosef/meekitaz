"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { photoSrc, isCleaned } from "@/lib/img";
import { stonePicture } from "@/lib/stonePicture";

/** The top of every product page: a full-screen gallery (the worn photo, the piece, the stone, the film) with the choices in glass on top.
 *  A photo turns the page dark with white type; a product shot on white turns it warm cream with dark type, so the piece is always seen properly.
 *  Desktop: one glass card on the right. Phone: metal in a slim bar at the top, everything else with the price and the button in a panel at the bottom, all on screen at once. */
type Img = { url: string; alt: string };
type Slide = { kind: "img" | "stone" | "film" | "clip" | "box"; url?: string; alt: string; label: string };
const VIEW_NAMES = ["The piece", "Another view", "Detail", "Detail", "Detail", "Detail"];

/** Looks at a picture: is it a photograph (dark page) rather than a product shot on white (cream page)? And is its lower part, which sits behind the sheet on a phone, dark or light?
 *  Null when the browser will not let us look. */
function measure(el: HTMLImageElement): { photo: boolean | null; dark: boolean | null } {
  try {
    const c = document.createElement("canvas"); c.width = 16; c.height = 16;
    const x = c.getContext("2d", { willReadFrequently: true }); if (!x) return { photo: null, dark: null };
    x.drawImage(el, 0, 0, 16, 16);
    const lum = (px: number, py: number) => { const d = x.getImageData(px, py, 1, 1).data; return (d[0] * 0.299 + d[1] * 0.587 + d[2] * 0.114); };
    const edge: [number, number][] = [[0, 0], [15, 0], [0, 15], [15, 15], [8, 0], [0, 8], [15, 8], [8, 15]];
    let e = 0; for (const [px, py] of edge) e += lum(px, py);
    let low = 0, n = 0; for (let py = 9; py < 16; py++) for (let px = 1; px < 15; px += 2) { low += lum(px, py); n++; }
    return { photo: e / edge.length < 225, dark: low / n < 118 };
  } catch { return { photo: null, dark: null }; }
}

/** The colours a photograph has along its outer edges, so the part of the screen the photograph does not reach can be filled with them (seven colours along each of two opposite edges).
 *  The photograph is narrower than the screen: the left and right edges. It is wider: the top and bottom edges. Null when the browser will not let us look. */
type Wash = { ar: number; v: boolean; a: string[]; b: string[] };
function washOf(el: HTMLImageElement, frame: number): Wash | null {
  try {
    const nw = el.naturalWidth, nh = el.naturalHeight; if (!nw || !nh) return null;
    const ar = nw / nh, v = ar > frame, W = 48, H = Math.max(10, Math.round(48 / ar));
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true }); if (!x) return null;
    x.drawImage(el, 0, 0, W, H);
    const avg = (x0: number, y0: number, w: number, h: number) => { const d = x.getImageData(x0, y0, w, h).data; let r = 0, g = 0, b = 0, n = 0; for (let k = 0; k < d.length; k += 4) { r += d[k]; g += d[k + 1]; b += d[k + 2]; n++; } return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`; };
    const a: string[] = [], b: string[] = [];
    for (let k = 0; k < 7; k++) {
      if (!v) { const y0 = Math.floor(k * H / 7), h = Math.max(1, Math.floor((k + 1) * H / 7) - y0); a.push(avg(0, y0, 2, h)); b.push(avg(W - 2, y0, 2, h)); }
      else { const x0 = Math.floor(k * W / 7), w = Math.max(1, Math.floor((k + 1) * W / 7) - x0); a.push(avg(x0, 0, w, 2)); b.push(avg(x0, H - 2, w, 2)); }
    }
    return { ar, v, a, b };
  } catch { return null; }
}
const washGrad = (cols: string[], v: boolean) => `linear-gradient(${v ? 90 : 180}deg,${cols.map((c, k) => `${c} ${Math.round(k * 100 / 6)}%`).join(",")})`;

/** Where the piece is on a product shot: the shots are squares with a lot of white around the piece, so the piece looks small. The box around what is not white, as fractions of the picture. */
type Trim = { x0: number; y0: number; x1: number; y1: number; r: number };
function trimOf(el: HTMLImageElement): Trim | null {
  try {
    const nw = el.naturalWidth, nh = el.naturalHeight; if (!nw || !nh) return null;
    const W = 160, H = Math.max(40, Math.round(160 * nh / nw));
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true }); if (!x) return null;
    x.drawImage(el, 0, 0, W, H);
    const d = x.getImageData(0, 0, W, H).data; let x0 = W, x1 = 0, y0 = H, y1 = 0;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { const i = (y * W + xx) * 4; if (d[i + 3] > 20 && (d[i] < 238 || d[i + 1] < 238 || d[i + 2] < 238)) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    if (x1 <= x0 || y1 <= y0) return null;
    const pad = Math.max(x1 - x0, y1 - y0) * 0.06;
    return { x0: Math.max(0, x0 - pad) / W, x1: Math.min(W, x1 + pad) / W, y0: Math.max(0, y0 - pad) / H, y1: Math.min(H, y1 + pad) / H, r: nw / nh };
  } catch { return null; }
}

export default function ImmersiveHero({ title, bigTitle, images, model, stone, stoneShape, stoneSlide = true, film, clip, boxPic, steps, summary, price, metal, rows, cta, appt, onVisible, actions }: {
  actions?: React.ReactNode;
  title: string; bigTitle: string; images: Img[]; model?: string; stone?: string; stoneShape?: string; stoneSlide?: boolean; film?: { src: string; poster: string; srcD?: string; posterD?: string }; clip?: { src: string; poster: string }; boxPic?: { src: string; alt: string }; summary?: string[];
  steps?: ReactNode; price: ReactNode; metal?: ReactNode; rows?: ReactNode; cta: ReactNode; appt?: ReactNode; onVisible?: (on: boolean) => void;
}) {
  const [wideFilm, setWideFilm] = useState(false);
  useEffect(() => { const m = window.matchMedia("(min-width: 768px)"); const on = () => setWideFilm(m.matches); on(); m.addEventListener("change", on); return () => m.removeEventListener("change", on); }, []);
  const clipSrc = clip?.src, boxSrc = boxPic?.src;
  const slides = useMemo<Slide[]>(() => {
    const list: Slide[] = images.map(im => ({ kind: "img" as const, url: im.url, alt: im.alt, label: "" }));
    const m = model ? list.findIndex(s => s.url === model) : -1;
    if (m > 0) { const [x] = list.splice(m, 1); list.unshift(x); } // the worn photo opens the page
    let n = 0; list.forEach(s => { s.label = s.url === model ? "Worn" : VIEW_NAMES[Math.min(n++, VIEW_NAMES.length - 1)]; });
    return [...list, ...(clipSrc ? [{ kind: "clip" as const, alt: "The piece in motion", label: "In motion" }] : []), ...(boxSrc ? [{ kind: "box" as const, alt: boxPic?.alt || "How it arrives", label: "How it arrives" }] : []), ...(stoneSlide ? [{ kind: "stone" as const, alt: "The stone", label: "The stone" }] : []), { kind: "film", alt: "Meekitaz, a short film", label: "The film" }];
  }, [images, model, clipSrc, boxSrc, stoneSlide]);
  const N = slides.length;
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false); // phone: the sheet at the bottom, folded (title, what is chosen, price, button) or open (every choice)
  const [modes, setModes] = useState<Record<string, "photo" | "piece">>({});
  const [tones, setTones] = useState<Record<string, "dark" | "light">>({});
  const [washes, setWashes] = useState<Record<string, Wash>>({});
  const [trims, setTrims] = useState<Record<string, Trim>>({});
  const [pcBox, setPcBox] = useState({ w: 0, h: 0 });
  const box = useRef<HTMLElement>(null), vid = useRef<HTMLVideoElement>(null), cvid = useRef<HTMLVideoElement>(null), vis = useRef(true);
  const cur = Math.min(i, N - 1);
  const modeOf = useCallback((s: Slide): "photo" | "piece" => s.kind === "film" || s.kind === "clip" ? "photo" : s.kind === "stone" || s.kind === "box" ? "piece" : (modes[s.url || ""] ?? (s.url === model ? "photo" : "piece")), [modes, model]);
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

  // computers can get their own landscape film; phones keep the original
  const filmSrc = (wideFilm && film?.srcD) || film?.src || "/media/brand-reel.mp4", filmPoster = (wideFilm && film?.posterD) || film?.poster || "/media/brand-reel-poster.jpg";
  // the film loads when it is near, plays only while it is the slide on screen and the hero is on screen
  useEffect(() => {
    const v = vid.current; if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const near = slides[cur]?.kind === "film" || slides[(cur + 1) % N]?.kind === "film";
    if (near && v.getAttribute("src") !== filmSrc) v.setAttribute("src", filmSrc);
    if (slides[cur]?.kind === "film" && vis.current && !reduce) v.play().catch(() => {}); else v.pause();
  }, [cur, slides, N, filmSrc]); // eslint-disable-line react-hooks/exhaustive-deps
  // the product's own film: contained in the piece area, plays only while it is the slide on screen
  useEffect(() => {
    const v = cvid.current; if (!v || !clip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const near = slides[cur]?.kind === "clip" || slides[(cur + 1) % N]?.kind === "clip" || slides[(cur - 1 + N) % N]?.kind === "clip";
    if (near && !v.getAttribute("src")) v.setAttribute("src", clip.src);
    if (slides[cur]?.kind === "clip" && vis.current && !reduce) v.play().catch(() => {}); else v.pause();
  }, [cur, slides, N, clip]);
  // laptop and desktop: where the title starts (the piece takes everything above it), and how big the piece area is (to scale the piece up to it)
  useEffect(() => {
    const el = box.current; const tt = el?.querySelector<HTMLElement>(".ih-tt"); if (!el || !tt) return;
    const set = () => {
      el.style.setProperty("--ttop", `${tt.offsetTop}px`);
      const pc = el.querySelector<HTMLElement>(".ih-pc");
      if (window.innerWidth < 768 || !pc) { setPcBox(b => (b.w === 0 && b.h === 0 ? b : { w: 0, h: 0 })); return; }
      const w = Math.round(pc.offsetWidth), h = Math.round(pc.offsetHeight);
      setPcBox(b => (b.w === w && b.h === h ? b : { w, h }));
    };
    set(); const ro = new ResizeObserver(set); ro.observe(tt); ro.observe(el);
    window.addEventListener("resize", set); return () => { ro.disconnect(); window.removeEventListener("resize", set); };
  }, [cur, slides]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const io = new IntersectionObserver(es => es.forEach(e => { vis.current = e.isIntersecting; onVisible?.(e.isIntersecting); const v = vid.current; if (v && !e.isIntersecting) v.pause(); const c = cvid.current; if (c && !e.isIntersecting) c.pause(); }), { threshold: 0.12 });
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
  const down = (e: React.PointerEvent) => { if ((e.target as HTMLElement).closest(".ih-ctl,.ih-thumbs,.ih-pager,.rsteps,.ih-scrim,.ih-dots,.ih-cnt")) { x0.current = null; return; } x0.current = e.clientX; };
  const up = (e: React.PointerEvent) => {
    if (x0.current === null) return; const dx = e.clientX - x0.current; x0.current = null;
    if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1));
    else if (Math.abs(dx) < 10 && e.pointerType !== "mouse") { const r = e.currentTarget.getBoundingClientRect(), f = (e.clientX - r.left) / r.width; if (f > 0.66) go(cur + 1); else if (f < 0.34) go(cur - 1); }
  };
  const onImg = (url: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    const r = measure(e.currentTarget);
    const tr = trimOf(e.currentTarget); if (tr) setTrims(m => (m[url] ? m : { ...m, [url]: tr }));
    if (url !== model && r.photo !== null) setModes(m => (m[url] === (r.photo ? "photo" : "piece") ? m : { ...m, [url]: r.photo ? "photo" : "piece" }));
    if (r.dark !== null) setTones(t => (t[url] === (r.dark ? "dark" : "light") ? t : { ...t, [url]: r.dark ? "dark" : "light" }));
  };
  // the photograph's own image: besides the usual look, its edge colours fill the sides it does not reach (laptop and desktop)
  const onFg = (url: string) => (e: React.SyntheticEvent<HTMLImageElement>) => {
    onImg(url)(e);
    const f = box.current ? box.current.clientWidth / Math.max(1, box.current.clientHeight) : 1.78;
    const w = washOf(e.currentTarget, f); if (w) setWashes(m => (m[url] ? m : { ...m, [url]: w }));
  };
  // a piece photo is scaled and moved so the piece (not the white around it) fills the piece area
  const trimStyle = (url?: string): CSSProperties | undefined => {
    const t = url ? trims[url] : undefined; if (!t || !pcBox.w || !pcBox.h) return undefined;
    const dw = t.r >= pcBox.w / pcBox.h ? pcBox.w : pcBox.h * t.r, dh = dw / t.r;
    const bw = (t.x1 - t.x0) * dw, bh = (t.y1 - t.y0) * dh, sc = Math.min(1.9, Math.max(1, Math.min(pcBox.w / bw, pcBox.h / bh)));
    return { transform: `translate(${((0.5 - (t.x0 + t.x1) / 2) * dw * sc).toFixed(1)}px, ${((0.5 - (t.y0 + t.y1) / 2) * dh * sc).toFixed(1)}px) scale(${sc.toFixed(3)})` };
  };
  const s = slides[cur], mode = modeOf(s);
  // on a phone the sheet sits over the lower part of the picture: white type when that part is dark, dark type when it is light
  const tone: "dark" | "light" = s.kind === "film" || s.kind === "clip" ? "dark" : mode === "photo" && s.url ? (tones[s.url] ?? "light") : "light";
  const len = bigTitle.length, sz = len <= 22 ? "l1" : len <= 40 ? "l2" : "l3";
  const diamond = stonePicture(stoneShape, stone); // the stone slide shows the shape the customer is looking at
  // the cleaner needs the photo's place among the Shopify photos, and the worn photo (which opens the page) is not one of them
  const slotOff = model && slides[0]?.url === model ? 1 : 0;
  const src = (u: string, w: number, k: number) => photoSrc(u, w, title, Math.max(0, k - slotOff));
  return (
    <section className={`ih${open ? " open" : ""}`} ref={box} data-mode={mode} data-tone={tone} data-clip={s.kind === "clip" ? "1" : undefined} data-box={s.kind === "box" ? "1" : undefined} onPointerDown={down} onPointerUp={up} aria-roledescription="carousel" aria-label={`${title}, photos`}>
      <div className="ih-slides">
        {slides.map((sl, k) => {
          const m = modeOf(sl), on = k === cur;
          return (
            <div key={`${sl.kind}-${sl.url || k}`} className={`ih-sl ${m}${on ? " on" : ""}`} aria-hidden={!on}>
              {sl.kind === "img" && sl.url && (m === "photo"
                ? (() => { const w = washes[sl.url || ""]; return (
                  <div className={`ih-ph2${sl.url === model ? " mdl" : ""}${w ? ` ws${w.v ? " wv" : ""}` : ""}`} style={w ? ({ "--ar": w.ar, "--wa": washGrad(w.a, w.v), "--wb": washGrad(w.b, w.v) } as CSSProperties) : undefined}>
                    <Image className="ih-bk" src={src(sl.url, 300, k)} alt="" fill sizes="30vw" quality={40} unoptimized={isCleaned(src(sl.url, 300, k))} />
                    {w && <div className="ih-wash" aria-hidden="true"><i className="a" /><i className="b" /></div>}
                    <div className="ih-fgw"><Image className="ih-fg" src={src(sl.url, 1500, k)} alt={sl.alt} fill sizes="100vw" quality={78} priority={k === 0} unoptimized={isCleaned(src(sl.url, 1500, k))} onLoad={onFg(sl.url)} /></div>
                  </div>); })()
                : <div className="ih-pc"><Image className="ih-pi" src={src(sl.url, 1400, k)} alt={sl.alt} fill sizes="(max-width:767px) 92vw, 820px" quality={80} priority={k === 0} unoptimized={isCleaned(src(sl.url, 1400, k))} onLoad={onImg(sl.url)} style={trimStyle(sl.url)} /></div>)}
              {sl.kind === "stone" && <div className="ih-pc st"><Image src={diamond} alt="" fill sizes="(max-width:767px) 70vw, 560px" quality={80} /></div>}
              {sl.kind === "box" && boxPic && <div className="ih-pc box"><Image className="ih-pi" src={boxPic.src} alt={sl.alt} fill sizes="(max-width:767px) 100vw, 60vw" quality={80} onLoad={e => { const tr = trimOf(e.currentTarget); if (tr) setTrims(m => (m[boxPic.src] ? m : { ...m, [boxPic.src]: tr })); }} style={trimStyle(boxPic.src)} /></div>}
              {sl.kind === "clip" && clip && <div className="ih-pc clip"><video ref={cvid} muted loop playsInline preload="none" poster={clip.poster} aria-label={sl.alt} /></div>}
              {sl.kind === "film" && <video ref={vid} muted loop playsInline preload="none" poster={filmPoster} aria-label={sl.alt} />}
            </div>
          );
        })}
      </div>
      <div className="ih-shade" />
      {open && <div className="ih-scrim" onClick={() => setOpen(false)} />}
      <span className="ih-cnt" aria-hidden="true">{String(cur + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
      <div className="ih-dots" aria-label="Photos">{slides.map((sl, k) => (
        <button key={k} type="button" className={k === cur ? "on" : ""} aria-label={`${sl.label}, photo ${k + 1} of ${N}`} aria-current={k === cur} onClick={() => go(k)}><i /></button>))}
      </div>

      <div className="ih-tt">
        {actions && <div className="ih-acts">{actions}</div>}
        <small className="eyebrow">Lab-grown · IGI certified</small>
        <h1 aria-label={title} className={sz}>{bigTitle}</h1>
        <span className="ih-cap" aria-live="polite">{s.label}</span>
      </div>

      <div className="ih-thumbs">{slides.map((sl, k) => (
        <button key={k} type="button" className={k === cur ? "on" : ""} aria-label={sl.label} aria-current={k === cur} onClick={() => go(k)}>
          {sl.kind === "img" && sl.url && <Image src={src(sl.url, 160, k)} alt="" width={64} height={64} quality={60} unoptimized={isCleaned(src(sl.url, 160, k))} />}
          {sl.kind === "stone" && <Image src={diamond} alt="" width={64} height={64} quality={60} />}
          {sl.kind === "box" && boxPic && <Image src={boxPic.src} alt="" width={64} height={64} quality={60} />}
          {sl.kind === "clip" && clip && <><Image src={clip.poster} alt="" width={64} height={64} quality={60} /><span className="pl">▶</span></>}
          {sl.kind === "film" && <><Image src={filmPoster} alt="" width={64} height={64} quality={60} /><span className="pl">▶</span></>}
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
        <div className="ih-scr">
          {(metal || steps) && <div className="ih-top">{steps}{metal}</div>}
          <div className="ih-bot">
            <div className="ih-pa"><div className="ih-price">{price}</div><div className="ih-cta">{cta}</div></div>
            {rows && <div className="ih-rows">{rows}</div>}
            {appt && <div className="ih-appt">{appt}</div>}
          </div>
        </div>
        <div className="ih-foot"><div className="ih-hm"><i className="mkm" aria-hidden="true" /><span><b>By Meekitaz</b>, Graded by IGI or GIA</span></div>{cta}</div>
      </div>
    </section>
  );
}
