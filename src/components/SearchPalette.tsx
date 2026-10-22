"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import StoneImg from "./StoneImg";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/data";
import { photoSrc, isCleaned } from "@/lib/img";
import { CATEGORIES, POPULAR, matchCategories, parseIntent } from "@/lib/search";

type Design = { handle: string; title: string; price: string; currency: string; image?: { url: string; alt: string }; metals: string[] };
const usd = (n: number | string, cur = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(+n);
const stripMetal = (t: string) => t.replace(/^(Rose gold|Yellow gold|White gold|Platinum|Silver) /i, "");
const Mag = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>;

/** Centered search palette: shortcuts into the existing filters, categories and designs as you type. ↑ ↓ ↵ esc work. */
export default function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const cache = useRef(new Map<string, { list: Design[]; fixed: string }>()); // the same text is not fetched twice
  const [q, setQ] = useState("");
  const [designs, setDesigns] = useState<Design[]>([]);
  const [done, setDone] = useState(false); // the results on screen belong to the current text
  const [failed, setFailed] = useState(false);
  const [fixed, setFixed] = useState("");
  const [active, setActive] = useState(-1);
  const shapes = useMemo(() => categories.find(c => c.slug === "engagement-rings")?.styles || [], []);
  const text = q.trim();

  useEffect(() => { if (open) { setTimeout(() => input.current?.focus(), 30); } else { setQ(""); setDesigns([]); setDone(false); setFailed(false); setFixed(""); setActive(-1); } }, [open]);
  useEffect(() => { // Escape closes it wherever the focus is
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  useEffect(() => {
    if (!open || text.length < 2) { setDesigns([]); setDone(false); setFailed(false); return; }
    setDone(false); setFailed(false);
    const hit = cache.current.get(text.toLowerCase());
    if (hit) { setDesigns(hit.list); setFixed(hit.fixed); setDone(true); setActive(-1); return; }
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(text)}`, { signal: ac.signal });
        if (!r.ok) throw new Error("unavailable");
        const j = await r.json(); const list: Design[] = j.designs || []; if (cache.current.size > 60) cache.current.clear(); const fx: string = j.corrected || ""; cache.current.set(text.toLowerCase(), { list, fixed: fx }); setDesigns(list); setFixed(fx); setDone(true); setActive(-1);
      } catch (e) {
        if ((e as Error).name === "AbortError") return; // a newer keystroke replaced this request
        setFailed(true); setDone(true);
      }
    }, 150);
    return () => { clearTimeout(t); ac.abort(); };
  }, [text, open]);

  const intent = useMemo(() => (text.length >= 2 ? parseIntent(text) : { go: [], terms: "", max: undefined }), [text]);
  const cats = useMemo(() => (text.length >= 2 ? matchCategories(text) : []), [text]);
  const rows = useMemo(() => {
    const out: { href: string }[] = [];
    designs.slice(0, 6).forEach(d => out.push({ href: `/products/${d.handle}` }));
    intent.go.forEach(g => out.push({ href: g.href }));
    cats.forEach(c => out.push({ href: c.href }));
    if (text.length >= 2) out.push({ href: `/search?q=${encodeURIComponent(text)}` });
    return out;
  }, [intent, cats, designs, text]);
  const idx = (href: string) => rows.findIndex(r => r.href === href);
  const go = useCallback((href: string) => { router.push(href); onClose(); }, [router, onClose]);
  function onKey(e: React.KeyboardEvent) {
    if (e.nativeEvent.isComposing) return; // an input method (Hebrew, Chinese…) is still composing
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(-1, a - 1)); }
    else if (e.key === "Enter" && text.length >= 2) { e.preventDefault(); go(active >= 0 ? rows[active].href : `/search?q=${encodeURIComponent(text)}`); }
  }
  if (!open) return null;
  const A = (href: string) => (active === idx(href) && active >= 0 ? " on" : "");
  return (
    <div className="sq-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
      <div className="sq" role="dialog" aria-modal="true" aria-label="Search" onKeyDown={onKey}>
        <div className="sq-field">
          <Mag />
          <input ref={input} autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search diamonds, rings, earrings…" autoComplete="off" spellCheck={false} enterKeyHint="search" aria-label="Search" />
          <button type="button" className="sq-x" onClick={onClose} aria-label="Close search">&times;</button>
        </div>
        <div className="sq-body">
          {text.length < 2 ? (
            <>
              <h5>Popular</h5>
              <div className="sq-chips">{POPULAR.map(p => <button key={p} type="button" className="sq-chip" onClick={() => { setQ(p); input.current?.focus(); }}>{p}</button>)}</div>
              <h5>Shop by shape</h5>
              <div className="sq-shapes">{shapes.map(s => (
                <button key={s.label} type="button" className="sq-shape" onClick={() => { setQ(`${s.label} engagement ring`); input.current?.focus(); }}>
                  <span><StoneImg img={s.img} alt="" base={64} quality={70} /></span>{s.label}
                </button>))}
              </div>
              <h5>Browse</h5>
              <div className="sq-chips">{CATEGORIES.map(c => <button key={c.href} type="button" className="sq-chip" onClick={() => go(c.href)}>{c.label}</button>)}</div>
            </>
          ) : (
            <>
              <h5>Designs{done && designs.length ? ` · ${designs.length}` : ""}</h5>
              {done && fixed && designs.length > 0 && <p className="sq-fix">Showing results for <b>{fixed}</b></p>}
              {designs.slice(0, 6).map(d => {
                const href = `/products/${d.handle}`, many = d.metals.length > 1, src = d.image ? photoSrc(d.image.url, 160, d.title) : "";
                return (
                  <button key={d.handle} type="button" className={`sq-row${A(href)}`} onMouseEnter={() => setActive(idx(href))} onClick={() => go(href)}>
                    <span className="sq-im">{d.image && <Image src={src} alt="" width={72} height={72} quality={70} unoptimized={isCleaned(src)} />}</span>
                    <span className="sq-tx"><b>{many ? stripMetal(d.title) : d.title}</b><small>{many ? `${d.metals.length} metals` : d.metals[0] || ""}</small></span>
                    <span className="sq-pr">{usd(d.price, d.currency)}</span>
                  </button>);
              })}
              {done && failed && <p className="sq-none">Search is unavailable for a moment. Browse below, or try again.</p>}
              {done && !failed && designs.length === 0 && <p className="sq-none">No designs match &ldquo;{text}&rdquo;. Try fewer words, a shape, or one of these.</p>}
              {done && !failed && designs.length === 0 && <div className="sq-chips">{POPULAR.slice(0, 4).map(p => <button key={p} type="button" className="sq-chip" onClick={() => setQ(p)}>{p}</button>)}</div>}
              {!done && designs.length === 0 && <p className="sq-none">Searching&hellip;</p>}
              {intent.go.length > 0 && <><h5>Or browse</h5>{intent.go.map(g => (
                <button key={g.href} type="button" className={`sq-go${A(g.href)}`} onMouseEnter={() => setActive(idx(g.href))} onClick={() => go(g.href)}>
                  <span><b>{g.label}</b><small>{g.hint}</small></span><i>&rarr;</i></button>))}</>}
              {cats.length > 0 && <><h5>Categories</h5><div className="sq-chips">{cats.map(c => <button key={c.href} type="button" className={`sq-chip${A(c.href)}`} onClick={() => go(c.href)}>{c.label}</button>)}</div></>}
              <button type="button" className={`sq-all${A(`/search?q=${encodeURIComponent(text)}`)}`} onMouseEnter={() => setActive(idx(`/search?q=${encodeURIComponent(text)}`))} onClick={() => go(`/search?q=${encodeURIComponent(text)}`)}>See all results for &ldquo;{text}&rdquo; &rarr;</button>
            </>
          )}
        </div>
        <div className="sq-foot"><span>&uarr; &darr; to move &middot; &crarr; to open</span><span>esc to close</span></div>
      </div>
    </div>
  );
}
