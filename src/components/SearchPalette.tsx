"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  const [q, setQ] = useState("");
  const [designs, setDesigns] = useState<Design[]>([]);
  const [done, setDone] = useState(false); // the results on screen belong to the current text
  const [active, setActive] = useState(-1);
  const shapes = useMemo(() => categories.find(c => c.slug === "engagement-rings")?.styles || [], []);
  const text = q.trim();

  useEffect(() => { if (open) { setTimeout(() => input.current?.focus(), 30); } else { setQ(""); setDesigns([]); setDone(false); setActive(-1); } }, [open]);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);
  useEffect(() => {
    if (!open || text.length < 2) { setDesigns([]); setDone(false); return; }
    setDone(false);
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/search?q=${encodeURIComponent(text)}`, { signal: ac.signal }); const j = await r.json(); setDesigns(j.designs || []); setDone(true); setActive(-1); }
      catch { /* aborted or offline: keep what is on screen */ }
    }, 150);
    return () => { clearTimeout(t); ac.abort(); };
  }, [text, open]);

  const intent = useMemo(() => (text.length >= 2 ? parseIntent(text) : { go: [], terms: "", max: undefined }), [text]);
  const cats = useMemo(() => (text.length >= 2 ? matchCategories(text) : []), [text]);
  const rows = useMemo(() => {
    const out: { href: string }[] = [];
    intent.go.forEach(g => out.push({ href: g.href }));
    cats.forEach(c => out.push({ href: c.href }));
    designs.slice(0, 6).forEach(d => out.push({ href: `/products/${d.handle}` }));
    if (text.length >= 2) out.push({ href: `/search?q=${encodeURIComponent(text)}` });
    return out;
  }, [intent, cats, designs, text]);
  const idx = (href: string) => rows.findIndex(r => r.href === href);
  const go = useCallback((href: string) => { router.push(href); onClose(); }, [router, onClose]);
  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(rows.length - 1, a + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(-1, a - 1)); }
    else if (e.key === "Enter" && text.length >= 2) { e.preventDefault(); go(active >= 0 ? rows[active].href : `/search?q=${encodeURIComponent(text)}`); }
  }
  if (!open) return null;
  const A = (href: string) => (active === idx(href) && active >= 0 ? " on" : "");
  return (
    <div className="sp-back" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }} role="presentation">
      <div className="sp" role="dialog" aria-modal="true" aria-label="Search" onKeyDown={onKey}>
        <div className="sp-field">
          <Mag />
          <input ref={input} value={q} onChange={e => setQ(e.target.value)} placeholder="Search diamonds, rings, earrings…" autoComplete="off" spellCheck={false} enterKeyHint="search" aria-label="Search" />
          <button type="button" className="sp-x" onClick={onClose} aria-label="Close search">&times;</button>
        </div>
        <div className="sp-body">
          {text.length < 2 ? (
            <>
              <h5>Popular</h5>
              <div className="sp-chips">{POPULAR.map(p => <button key={p} type="button" className="sp-chip" onClick={() => { setQ(p); input.current?.focus(); }}>{p}</button>)}</div>
              <h5>Shop by shape</h5>
              <div className="sp-shapes">{shapes.map(s => (
                <button key={s.label} type="button" className="sp-shape" onClick={() => go(`/engagement-rings?style=${encodeURIComponent(s.label)}`)}>
                  <span><Image src={s.img} alt="" fill sizes="64px" quality={60} /></span>{s.label}
                </button>))}
              </div>
              <h5>Browse</h5>
              <div className="sp-chips">{CATEGORIES.map(c => <button key={c.href} type="button" className="sp-chip" onClick={() => go(c.href)}>{c.label}</button>)}</div>
            </>
          ) : (
            <>
              {intent.go.length > 0 && <><h5>Go straight to</h5>{intent.go.map(g => (
                <button key={g.href} type="button" className={`sp-go${A(g.href)}`} onMouseEnter={() => setActive(idx(g.href))} onClick={() => go(g.href)}>
                  <span><b>{g.label}</b><small>{g.hint}</small></span><i>&rarr;</i></button>))}</>}
              {cats.length > 0 && <><h5>Categories</h5><div className="sp-chips">{cats.map(c => <button key={c.href} type="button" className={`sp-chip${A(c.href)}`} onClick={() => go(c.href)}>{c.label}</button>)}</div></>}
              <h5>Designs{done && designs.length ? ` · ${designs.length}` : ""}</h5>
              {designs.slice(0, 6).map(d => {
                const href = `/products/${d.handle}`, many = d.metals.length > 1, src = d.image ? photoSrc(d.image.url, 160, d.title) : "";
                return (
                  <button key={d.handle} type="button" className={`sp-row${A(href)}`} onMouseEnter={() => setActive(idx(href))} onClick={() => go(href)}>
                    <span className="sp-im">{d.image && <Image src={src} alt="" width={72} height={72} quality={70} unoptimized={isCleaned(src)} />}</span>
                    <span className="sp-tx"><b>{many ? stripMetal(d.title) : d.title}</b><small>{many ? `${d.metals.length} metals` : d.metals[0] || ""}</small></span>
                    <span className="sp-pr">{usd(d.price, d.currency)}</span>
                  </button>);
              })}
              {done && designs.length === 0 && <p className="sp-none">No designs match &ldquo;{text}&rdquo;. Try fewer words, a shape, or a category.</p>}
              {!done && designs.length === 0 && <p className="sp-none">Searching&hellip;</p>}
              <button type="button" className={`sp-all${A(`/search?q=${encodeURIComponent(text)}`)}`} onMouseEnter={() => setActive(idx(`/search?q=${encodeURIComponent(text)}`))} onClick={() => go(`/search?q=${encodeURIComponent(text)}`)}>See all results for &ldquo;{text}&rdquo; &rarr;</button>
            </>
          )}
        </div>
        <div className="sp-foot"><span>&uarr; &darr; to move &middot; &crarr; to open</span><span>esc to close</span></div>
      </div>
    </div>
  );
}
