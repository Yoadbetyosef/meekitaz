"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { saveSetting } from "@/lib/setting";
import { usdR } from "@/lib/plan";
import { usePlanRoom } from "./PlanKit";
import type { FlowStone } from "./DiamondFlow";

/* The diamond on the build page (approved 2026-11-12):
   "A1" — with a setting chosen, a short strip under the three tiles, and "About this diamond" opens everything in a sheet.
   "B2" — with no setting yet, the diamond comes first, and right under it the settings that fit it; one tap builds the ring. */
const day = (n: number) => Math.ceil(n / 120);
const facts = (d: FlowStone) => [["Carat", d.carat.toFixed(2)], ["Color", d.fancy || d.color || "—"], ["Clarity", d.clarity || "—"], ["Cut", d.cut || "—"]];

export function DiamondStrip({ d, onOpen }: { d: FlowStone; onOpen: () => void }) {
  return (
    <button type="button" className="dx-strip" onClick={onOpen}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="dx-ic" src={d.image} alt="" />
      <span className="dx-tx"><span className="dx-k">Your diamond</span><span className="dx-t">{d.carat.toFixed(2)} ct {d.shape}</span>
        <span className="dx-v">{[d.fancy || d.color, d.clarity, d.cut].filter(Boolean).map(x => <span key={x}>{x}</span>)}<span className="ok">✓ {d.lab}</span></span></span>
      <span className="dx-more">About this diamond ›</span>
    </button>
  );
}

export function DiamondSheet({ d, open, onClose, onSwap, picture, onCert }: { d: FlowStone; open: boolean; onClose: () => void; onSwap: () => void; picture: React.ReactNode; onCert?: () => void }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, onClose]);
  return (
    <>
      <div className={`dx-dim${open ? " on" : ""}`} onClick={onClose} />
      <aside className={`dx-sheet${open ? " on" : ""}`} role="dialog" aria-label="About this diamond" aria-hidden={!open}>
        <div className="dx-h"><span>About this diamond</span><button type="button" onClick={onClose}>Close</button></div>
        <div className="dx-big">{open && picture}</div>
        <h3>{d.carat.toFixed(2)} ct {d.shape}</h3>
        <span className="dx-igi">✓ {d.lab} certified · lab-grown</span>
        <div className="dx-facts">{facts(d).map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
        <div className="dx-cert"><span className="dx-paper" /><div><b>{d.lab} {d.cert}</b><small>Independently graded</small></div>{d.certUrl && <a href={d.certUrl} target="_blank" rel="noopener" onClick={e => { if (onCert) { e.preventDefault(); onClose(); onCert(); } }}>View certificate →</a>}</div>
        <div className="dx-meas">
          {d.measurements && <div><span>Measurements</span><b>{/mm/i.test(d.measurements) ? d.measurements : `${d.measurements} mm`}</b></div>}
          {(d.polish || d.symmetry) && <div><span>Polish · Symmetry</span><b>{[d.polish, d.symmetry].filter(Boolean).join(" · ")}</b></div>}
          <div><span>Fluorescence</span><b>{d.fluor || "None"}</b></div>
          {d.ratio && <div><span>Ratio</span><b>{d.ratio}</b></div>}
          <div><span>Price</span><b>{usdR(d.price)} · {usdR(day(d.price))} a day</b></div>
        </div>
        <div className="dx-acts"><button type="button" onClick={() => { onClose(); onSwap(); }}>Swap diamond</button><button type="button" className="dx-keep" onClick={onClose}>Keep this diamond</button></div>
      </aside>
    </>
  );
}

type Fit = { handle: string; title: string; price: number; image?: { url: string } };
export function DiamondFirst({ d, picture, shape, onCert }: { d: FlowStone; picture: React.ReactNode; shape: string; onCert?: () => void }) {
  const r = usePlanRoom();
  const [fits, setFits] = useState<Fit[] | null>(null), [busy, setBusy] = useState("");
  useEffect(() => {
    let live = true;
    fetch(`/api/products?${new URLSearchParams({ handle: "engagement-rings", sort: "best", style: shape, metal: "Yellow gold" })}`).then(x => x.json())
      .then((j: { products?: { handle: string; title: string; price: string; image?: { url: string } }[] }) => { if (live) setFits((j.products || []).slice(0, 10).map(p => ({ handle: p.handle, title: p.title, price: +p.price, image: p.image }))); })
      .catch(() => live && setFits([]));
    return () => { live = false; };
  }, [shape]);
  const build = async (h: string) => {
    setBusy(h);
    try {
      const j = await (await fetch(`/api/setting?handle=${encodeURIComponent(h)}`)).json();
      if (j.item && j.ns) { const it = j.item; saveSetting({ ns: j.ns, handle: it.handle, variantId: it.variantId, title: it.title, shape: it.shape, metal: it.metal, price: it.price, image: it.images?.[0] || "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }
    } catch { /* ignore */ }
    setBusy("");
  };
  const short = (t: string) => t.replace(/^(Yellow|White|Rose) gold /i, "").replace(new RegExp(`^${shape} Diamond `, "i"), "").replace(/ Engagement Ring/i, "");
  return (
    <div className="dx-first">
      <div className="dx-steps"><span className="on">1. Diamond</span><span>2. Setting</span><span>3. Review</span></div>
      <div className="dx-grid">
        <div className="dx-hero"><span className="dx-igi">✓ {d.lab} certified · lab-grown</span>{picture}</div>
        <div className="dx-info">
          <span className="dx-k">Your diamond</span>
          <h2>{d.carat.toFixed(2)} ct {d.shape}</h2>
          <p className="dx-sub">{[d.fancy || (d.color && `${d.color} color`), d.clarity && `${d.clarity} clarity`, d.cut && `${d.cut} cut`].filter(Boolean).join(" · ")}</p>
          <div className="dx-price"><b>{usdR(day(d.price))}</b><i>a day</i><small>{usdR(d.price)} · the diamond</small></div>
          <div className="dx-facts">{facts(d).map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
          <div className="dx-cert"><span className="dx-paper" /><div><b>{d.lab} {d.cert}</b><small>{d.measurements ? (/mm/i.test(d.measurements) ? d.measurements : `${d.measurements} mm`) : "Independently graded"}</small></div>{d.certUrl && <a href={d.certUrl} target="_blank" rel="noopener" onClick={e => { if (onCert) { e.preventDefault(); onCert(); } }}>Certificate →</a>}</div>
          <div className="dx-fits">
            <div className="dx-fh"><b>Settings that fit this diamond</b><a href={`/engagement-rings?style=${encodeURIComponent(shape)}&build=1`}>See all ›</a></div>
            <div className="dx-car">
              {fits === null && <span className="dx-wait">Finding settings for your {shape.toLowerCase()}…</span>}
              {fits && fits.map(f => { const ringDay = day(f.price + d.price), fitsPlan = r ? ringDay <= Math.max(0, r.leftDay) : false; return (
                <button type="button" key={f.handle} className={`dx-sc${busy === f.handle ? " busy" : ""}`} onClick={() => build(f.handle)}>
                  <span className="dx-sci">{f.image && <Image src={f.image.url} alt="" fill sizes="180px" quality={70} />}</span>
                  <b>{short(f.title)}</b><small>The ring · {usdR(ringDay)} a day</small>{r && <em className={fitsPlan ? "" : "o"}>{fitsPlan ? "● In your plan" : `● ${usdR(ringDay - Math.max(0, r.leftDay))} over your plan`}</em>}
                  <span className="dx-go">{busy === f.handle ? "Building…" : "Build this ring →"}</span>
                </button>); })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* (approved 2026-11-12) The certificate, inside the site: the lab's own report in a sheet (bottom on phones, side on computers), the
   short version under it, "Verified by" the lab, and "Back to my ring". The PDF comes through /api/cert so it can be framed. */
export function CertSheet({ d, open, onClose }: { d: FlowStone; open: boolean; onClose: () => void }) {
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, onClose]);
  const src = d.certUrl ? `/api/cert?u=${encodeURIComponent(d.certUrl)}` : "";
  return (
    <>
      <div className={`dx-dim${open ? " on" : ""}`} onClick={onClose} />
      <aside className={`dx-sheet cs-sheet${open ? " on" : ""}`} role="dialog" aria-label="Certificate" aria-hidden={!open}>
        <div className="cs-h"><div><small>Certificate · {d.lab}</small><b>{d.cert}</b></div><button type="button" onClick={onClose}>Close</button></div>
        {open && src && <div className="cs-pdf"><span className="cs-tag">The real report</span><iframe src={`${src}#view=FitH&toolbar=0`} title={`${d.lab} certificate ${d.cert}`} /></div>}
        <p className="cs-note">The official report, shown here — scroll it, zoom it.</p>
        <div className="cs-ver"><span>✓</span><div>Verified by {d.lab}<b>Independently graded. The number is laser-inscribed on the stone.</b></div></div>
        <div className="cs-sum"><h4>In short</h4>
          <div className="dx-facts">{facts(d).map(([k, v]) => <div key={k}><small>{k}</small><b>{v}</b></div>)}</div>
          <div className="dx-meas">
            {d.measurements && <div><span>Measurements</span><b>{/mm/i.test(d.measurements) ? d.measurements : `${d.measurements} mm`}</b></div>}
            {(d.polish || d.symmetry) && <div><span>Polish · Symmetry</span><b>{[d.polish, d.symmetry].filter(Boolean).join(" · ")}</b></div>}
            <div><span>Fluorescence</span><b>{d.fluor || "None"}</b></div>
          </div>
        </div>
        <div className="dx-acts">{d.certUrl && <a className="cs-open" href={d.certUrl} target="_blank" rel="noopener">Open full PDF</a>}<button type="button" className="dx-keep" onClick={onClose}>Back to my ring</button></div>
      </aside>
    </>
  );
}
