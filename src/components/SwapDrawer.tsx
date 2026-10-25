"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveSetting, saveStone, type Setting, type Stone } from "@/lib/setting";
import { toast } from "./Toast";

/* "Swap setting" / "Swap diamond" on the build page: change one half of the ring and keep the other. */
const METALS = ["Yellow gold", "White gold", "Rose gold", "Platinum"];
const KARATS = ["10K", "14K", "18K"];
type SItem = Setting & { images?: string[] };
const CT: [string, number, number][] = [["Any", 0.5, 20], ["1ct+", 1, 20], ["1.5ct+", 1.5, 20], ["2ct+", 2, 20], ["2.5ct+", 2.5, 20], ["3ct+", 3, 20], ["4ct+", 4, 20]];
type DItem = Stone & { id: string; embed: string | null };
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function SwapDrawer({ mode, shape, setting, stone, onClose }: { mode: "setting" | "stone" | null; shape: string; setting: Setting | null; stone: Stone; onClose: () => void }) {
  const router = useRouter();
  const [metal, setMetal] = useState(setting?.metal || "Yellow gold");
  const [ct, setCt] = useState<[number, number]>(() => { const c = stone.carat; const pick = [...CT].reverse().find(([, lo]) => c >= lo); return pick ? [pick[1], pick[2]] : [0.5, 20]; });
  const [karat, setKarat] = useState(setting?.karat || "10K");
  const [sets, setSets] = useState<SItem[] | null>(null);
  const [view, setView] = useState<SItem | null>(null); const [img, setImg] = useState(0);
  const [stones, setStones] = useState<DItem[] | null>(null);

  useEffect(() => { document.documentElement.classList.toggle("sw-open", !!mode); return () => document.documentElement.classList.remove("sw-open"); }, [mode]);
  useEffect(() => {
    if (mode !== "setting") return; setSets(null);
    fetch(`/api/settings-for?${new URLSearchParams({ shape, metal, karat })}`).then(r => r.json()).then(j => setSets(j.items || [])).catch(() => setSets([]));
  }, [mode, shape, metal, karat]);
  useEffect(() => { if (!mode) setView(null); }, [mode]);
  useEffect(() => { if (view && sets) { const n = sets.find(x => x.ns === view.ns); if (n && n.handle !== view.handle || n && n.price !== view.price) setView(n); } }, [sets]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (mode !== "stone") return; setStones(null);
    const base = shape === "Elongated Cushion" ? "Cushion" : shape;
    const q = new URLSearchParams({ shapes: base, caratFrom: String(ct[0]), sort: "price_asc", page: "1", ...(stone.fancy ? {} : { colorFrom: "D", colorTo: "F", clarityFrom: "FL", clarityTo: "VS1" }) });
    if (ct[1] < 20) q.set("caratTo", String(ct[1]));
    fetch(`/api/diamonds?${q}`).then(r => r.json()).then(j => setStones(((j.items || []) as DItem[]).filter(x => x.stock !== stone.stock).slice(0, 12))).catch(() => setStones([]));
  }, [mode, shape, ct, stone.stock, stone.fancy]);

  if (!mode) return null;
  const pickSetting = (s: Setting) => { saveSetting(s); toast("Setting swapped · your diamond is kept"); onClose(); };
  const pickStone = (d: DItem) => { const { id: _id, embed: _e, ...st } = d; void _id; void _e; saveStone(st); toast("Diamond swapped · your setting is kept"); onClose(); router.push(`/diamonds/${d.vendor}-${encodeURIComponent(d.stock)}`); };

  return (
    <>
      <div className="sw-dim" onClick={onClose} />
      <aside className="sw" role="dialog" aria-modal="true" aria-label={mode === "setting" ? "Swap your setting" : "Swap your diamond"}>
        <button className="sw-x" onClick={onClose} aria-label="Close">×</button>
        {mode === "setting" ? (view ? <>
          <button className="sw-back" onClick={() => setView(null)}>← All settings</button>
          <div className="sw-gal"><span className="im" style={{ backgroundImage: `url(${(view.images || [view.image])[img] || view.image})` }} />
            {(view.images || []).length > 1 && <div className="sw-th">{(view.images || []).map((u, k) => <button key={u} className={k === img ? "on" : ""} style={{ backgroundImage: `url(${u})` }} onClick={() => setImg(k)} aria-label={`Photo ${k + 1}`} />)}</div>}</div>
          <h3 className="sw-t">{view.title}</h3>
          <div className="sw-chips">{METALS.map(m => <button key={m} className={m === metal ? "on" : ""} onClick={() => setMetal(m)}>{m}</button>)}</div>
          {metal !== "Platinum" && <div className="sw-chips">{KARATS.map(k => <button key={k} className={k === karat ? "on" : ""} onClick={() => setKarat(k)}>{k}</button>)}</div>}
          <div className="sw-buy"><b>{usd(view.price)}</b><span>setting{view.karat ? ` · ${view.karat}` : ""} · + your diamond {usd(stone.price)}</span></div>
          <button className="sw-use" disabled={view.handle === setting?.handle && (view.karat || "") === (setting?.karat || "")} onClick={() => pickSetting(view)}>{view.handle === setting?.handle && (view.karat || "") === (setting?.karat || "") ? "This is your setting" : `Use this setting · ${usd(view.price + stone.price)}`}</button>
          <Link className="sw-more" href={`/products/${view.handle}`} onClick={onClose}>See full details →</Link>
        </> : <>
          <h3>Swap your setting</h3><p>Settings made for your {stone.carat.toFixed(2)} ct {shape.toLowerCase()}. Your diamond stays.</p>
          <div className="sw-chips">{METALS.map(m => <button key={m} className={m === metal ? "on" : ""} onClick={() => setMetal(m)}>{m}</button>)}</div>
          {metal !== "Platinum" && <div className="sw-chips">{KARATS.map(k => <button key={k} className={k === karat ? "on" : ""} onClick={() => setKarat(k)}>{k}</button>)}</div>}
          {!sets ? <p className="sw-msg">Finding settings…</p> : !sets.length ? <p className="sw-msg">No {shape.toLowerCase()} settings in {metal.toLowerCase()} yet. Try another metal.</p> :
            <div className="sw-grid">{sets.map(s => { const cur = s.handle === setting?.handle && (s.karat || "") === (setting?.karat || ""); return (
              <button key={s.handle} className={`sw-c${cur ? " cur" : ""}`} onClick={() => { setImg(0); setView(s); }}>
                <span className="im" style={{ backgroundImage: `url(${s.image})` }} /><b>{s.title.replace(/^(Yellow gold|White gold|Rose gold|Platinum)\s+/i, "")}</b><small>{usd(s.price)}{s.karat ? ` · ${s.karat}` : ""}</small>{cur && <em>Current</em>}
              </button>); })}</div>}
          <Link className="sw-more" href={`/engagement-rings?style=${encodeURIComponent(shape === "Elongated Cushion" ? "Cushion" : shape)}&build=1`} onClick={onClose}>Browse all {shape.toLowerCase()} settings on the site →</Link>
          <p className="sw-note">Your diamond stays saved while you browse; any setting you choose brings you back here to review the pair.</p>
        </>) : <>
          <h3>Swap your diamond</h3><p>{shape} diamonds for your setting. Your setting stays.</p>
          <div className="sw-chips">{CT.map(([l, lo, hi]) => <button key={l} className={ct[0] === lo && ct[1] === hi ? "on" : ""} onClick={() => setCt([lo, hi])}>{l}</button>)}</div>
          {!stones ? <p className="sw-msg">Finding diamonds…</p> : !stones.length ? <p className="sw-msg">No stones in this size. Try another size.</p> :
            <div className="sw-grid">{stones.map(d => (
              <button key={d.id} className="sw-c" onClick={() => pickStone(d)}>
                <span className="im st" style={{ backgroundImage: `url(${d.image})` }} /><b>{d.carat.toFixed(2)} ct {d.shape}</b><small>{[d.fancy || d.color, d.clarity, d.lab].filter(Boolean).join(" · ")}</small><small className="pr">{usd(d.price)}</small>
              </button>))}</div>}
          <Link className="sw-more" href={`/diamonds?style=${encodeURIComponent(shape === "Elongated Cushion" ? "Cushion" : shape)}`} onClick={onClose}>Browse all {shape.toLowerCase()} diamonds →</Link>
        </>}
      </aside>
    </>
  );
}
