"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { clearSetting, clearStone, loadSetting, loadStone, saveSetting, saveStone, stoneLabel, type Setting, type Stone } from "@/lib/setting";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const SIZES = Array.from({ length: 21 }, (_, i) => 3 + i * 0.5);

export default function BuildView() {
  const [setting, setS] = useState<Setting | null>(null);
  const [stone, setD] = useState<Stone | null>(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      const s = loadSetting(), d = loadStone();
      if (!s || !d) { if (live) { setS(s); setD(d); setReady(true); } return; }
      let st = s, dm: Stone | null = d;
      // the price is checked again, and the ring follows the shape of the diamond
      try { const j = await (await fetch(`/api/diamond?vendor=${d.vendor}&stock=${encodeURIComponent(d.stock)}`)).json(); if (j.item) { dm = j.item; saveStone(j.item); } else if (j.item === null && !j.error) dm = null; } catch { /* keep what we have */ }
      if (dm && st.shape !== dm.shape) {
        try {
          const j = await (await fetch(`/api/setting?${new URLSearchParams({ ns: st.ns, shape: dm.shape, metal: st.metal })}`)).json();
          if (j.item) { st = { ns: st.ns, handle: j.item.handle, variantId: j.item.variantId, title: j.item.title, shape: j.item.shape, metal: j.item.metal, price: j.item.price, image: j.item.images[0] || "" }; saveSetting(st); }
          else setNote(`This setting is not made in ${dm.shape}. Choose a different setting for your ${dm.shape.toLowerCase()} diamond.`);
        } catch { /* ignore */ }
      }
      if (live) { setS(st); setD(dm); if (!dm) setNote("This diamond is no longer available. Please choose another."); setReady(true); }
    })();
    return () => { live = false; };
  }, []);

  async function checkout() {
    if (!setting || !stone || !size || busy) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ variantId: setting.variantId, vendor: stone.vendor, stock: stone.stock, size }) });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "failed");
      window.location.href = j.url;
    } catch (e) {
      setErr(e instanceof Error && e.message === "not_configured" ? "Checkout for custom rings is being connected. Please book an appointment and we will complete your order with you."
        : e instanceof Error && e.message === "gone" ? "This diamond is no longer available. Please choose another." : "We could not start your checkout. Please try again, or book an appointment.");
      setBusy(false);
    }
  }

  const mismatch = !!(setting && stone && setting.shape !== stone.shape);
  const total = (setting?.price ?? 0) + (stone?.price ?? 0);
  return (
    <main className="bd">
      <div className="wrap">
        <div className="bd-steps"><span className="done"><b>✓</b>Setting</span><i /><span className="done"><b>✓</b>Diamond</span><i /><span className="on"><b>3</b>Review</span></div>
        <h1>Your ring</h1>
        {!ready ? <p className="bd-msg">Loading…</p> : !setting || !stone ? (
          <div className="bd-msg"><p>{!setting && !stone ? "You have not chosen a setting or a diamond yet." : !setting ? "You have a diamond. Now choose a setting for it." : "You have a setting. Now choose a diamond for it."}</p>
            <div className="bd-go">{!setting && <Link href={stone ? `/engagement-rings?style=${encodeURIComponent(stone.shape)}&build=1` : "/engagement-rings"} className="pp-add">Choose a setting</Link>}{!stone && <Link href={setting ? `/diamonds?style=${encodeURIComponent(setting.shape)}&c=2-20&build=1` : "/diamonds"} className="pp-add">Choose a diamond</Link>}</div></div>
        ) : (
          <div className="bd-card">
            <div className="bd-ln"><div className="bd-im">{setting.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`${setting.image}${setting.image.includes("?") ? "&" : "?"}width=240`} alt="" />}</div>
              <div className="bd-m"><b>{setting.title}</b><small>Setting · {setting.metal}</small><Link href={`/products/${setting.handle}`}>Change setting</Link></div><span className="bd-p">{usd(setting.price)}</span></div>
            <div className="bd-ln"><div className="bd-im bd-st">{stone.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={stone.image} alt="" referrerPolicy="no-referrer" />}</div>
              <div className="bd-m"><b>{stoneLabel(stone)} diamond</b><small>{[stone.fancy || stone.color, stone.clarity, stone.cut && `${stone.cut} cut`, `${stone.lab} certified`].filter(Boolean).join(" · ")}</small><Link href={`/diamonds?style=${encodeURIComponent(stone.shape)}&c=2-20&build=1`}>Change diamond</Link></div><span className="bd-p">{usd(stone.price)}</span></div>
            {(note || mismatch) && <p className="bd-note">{note || `This setting is not made in ${stone.shape}. Choose a different setting.`}</p>}
            <div className="bd-size"><label htmlFor="sz">Ring size (US)</label>
              <select id="sz" value={size} onChange={e => setSize(e.target.value)}><option value="">Select your size</option>{SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}</select>
              <Link href="/#contact" className="bd-help">Not sure? Book a free sizing appointment</Link></div>
            <div className="bd-sum"><div><span>Setting</span><b>{usd(setting.price)}</b></div><div><span>Diamond</span><b>{usd(stone.price)}</b></div><div><span>Shipping</span><b>Free, insured</b></div><div className="t"><span>Total</span><b>{usd(total)}</b></div></div>
            {err && <p className="bd-note">{err}</p>}
            <button type="button" className="pp-add bd-co" disabled={!size || busy || mismatch || !!note} onClick={checkout}>{busy ? "One moment…" : size ? "Checkout" : "Select a ring size to continue"}</button>
            <button type="button" className="bd-clear" onClick={() => { clearSetting(); clearStone(); window.location.href = "/engagement-rings"; }}>Start over</button>
          </div>
        )}
      </div>
    </main>
  );
}
