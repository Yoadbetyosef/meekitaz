"use client";
import RingSteps from "./RingSteps";
import { useEffect, useState } from "react";
import Link from "next/link";
import { clearSetting, clearStone, loadSetting, loadStone, saveSetting, saveStone, stoneLabel, type Setting, type Stone, sameShape, baseShape } from "@/lib/setting";
import { diamondsUrl } from "@/lib/setting";
import RingW1 from "./RingW1";
import { usePlanRoom } from "./PlanKit";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const SIZES = Array.from({ length: 21 }, (_, i) => 3 + i * 0.5);
const half = (n: number) => `${Math.floor(n)}${n % 1 ? "½" : ""}`;
const day = (n: number) => Math.ceil(n / 120);

export default function BuildView() {
  const [setting, setS] = useState<Setting | null>(null);
  const [stone, setD] = useState<Stone | null>(null);
  const [ready, setReady] = useState(false);
  const [note, setNote] = useState("");
  const [size, setSize] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [tried, setTried] = useState(false);
  const room = usePlanRoom();
  // (V1) the gold can change right here (RingW1 saves the setting): follow it
  useEffect(() => { const f = () => { const s = loadSetting(); if (s) setS(s); }; window.addEventListener("mk-setting", f); return () => window.removeEventListener("mk-setting", f); }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      const s = loadSetting(), d = loadStone();
      if (!s || !d) { if (live) { setS(s); setD(d); setReady(true); } return; }
      let st = s, dm: Stone | null = d;
      // the price is checked again, and the ring follows the shape of the diamond
      try { const j = await (await fetch(`/api/diamond?vendor=${d.vendor}&stock=${encodeURIComponent(d.stock)}`)).json(); if (j.item) { dm = j.item; saveStone(j.item); } else if (j.item === null && !j.error) dm = null; } catch { /* keep what we have */ }
      if (dm && !sameShape(st.shape, dm.shape)) {
        try {
          const j = await (await fetch(`/api/setting?${new URLSearchParams({ ns: st.ns, shape: baseShape(dm.shape), metal: st.metal })}`)).json();
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

  const mismatch = !!(setting && stone && !sameShape(setting.shape, stone.shape));
  const total = (setting?.price ?? 0) + (stone?.price ?? 0);
  return (
    <main className="bd">
      <div className="wrap">
        <RingSteps step={3} />
        <h1>Your ring</h1>
        {!ready ? <p className="bd-msg">Loading…</p> : !setting || !stone ? (
          <div className="bd-msg"><p>{!setting && !stone ? "You have not chosen a setting or a diamond yet." : !setting ? "You have a diamond. Now choose a setting for it." : "You have a setting. Now choose a diamond for it."}</p>
            <div className="bd-go">{!setting && <Link href={stone ? `/engagement-rings?style=${encodeURIComponent(stone.shape)}&build=1` : "/engagement-rings"} className="pp-add">Choose a setting</Link>}{!stone && <Link href={setting ? diamondsUrl(setting.shape, setting.color) : "/diamonds"} className="pp-add">Choose a diamond</Link>}</div></div>
        ) : (
          /* (approved 2026-11-12, "V1") the review in our language: the ring and its three tiles (W1), the one thing left — her size —
             then the ring priced our way: a day first, the total small, the promises and the signature; the bar asks for the size first */
          <div className="rv">
            <p className="rv-kick">Almost yours</p>
            <p className="rv-lede">{size ? "Everything is chosen." : "One thing left: her size."}</p>
            <RingW1 shown={setting} shapeName={stone.shape === "Elongated Cushion" ? "Cushion" : stone.shape} stoneTitle={`${stoneLabel(stone)}`} stoneSub="" stonePrice={stone.price} stoneImg={stone.image}
              onSwap={m => { window.location.href = m === "stone" ? `/diamonds?style=${encodeURIComponent(stone.shape)}&c=2-20&build=1` : `/products/${setting.handle}`; }} />
            {(note || mismatch) && <p className="bd-note">{note || `This setting is not made in ${stone.shape}. Choose a different setting.`}</p>}
            <div className={`rv-card rv-size${tried && !size ? " need" : ""}`} id="rv-size">
              <div className="rv-lab"><span>Ring size (US)</span><em>{size ? `Size ${half(+size)}` : "the last thing"}</em></div>
              <div className="rv-rail" role="radiogroup" aria-label="Ring size">{SIZES.map(z => <button key={z} type="button" role="radio" aria-checked={size === String(z)} className={size === String(z) ? "on" : ""} onClick={() => setSize(String(z))}>{half(z)}</button>)}</div>
              <div className="rv-help"><Link href="/#contact">Not sure? Free sizer kit</Link><Link href="/#contact">Book a fitting</Link></div>
              {tried && !size && <p className="rv-need">● Choose a size to continue</p>}
            </div>
            <div className="rv-card rv-rec">
              <div className="rv-lab"><span>Your ring</span><em>4 months · no interest</em></div>
              <div className="rv-r"><span>Setting<small>{setting.title.replace(/^(Yellow|White|Rose) gold |^Platinum |^Silver /i, "")} · {[setting.karat, setting.metal.toLowerCase()].filter(Boolean).join(" ")}</small></span><b>{usd(day(setting.price))}<i>a day</i><small>{usd(setting.price)}</small></b></div>
              <div className="rv-r"><span>Diamond<small>{[stoneLabel(stone), stone.fancy || stone.color, stone.clarity, stone.lab].filter(Boolean).join(" · ")}</small></span><b>{usd(day(stone.price))}<i>a day</i><small>{usd(stone.price)}</small></b></div>
              <div className="rv-r"><span>Shipping<small>insured, to your door</small></span><b>Free</b></div>
              <div className="rv-tot"><span>The ring</span><span className="rv-v"><b>{usd(day(total))}</b><i>a day</i><small>{usd(total)} total · 4 months</small>{room && (day(total) <= Math.max(0, room.leftDay) ? <em>In your plan</em> : <em className="o">{usd(day(total) - Math.max(0, room.leftDay))} over your plan</em>)}</span></div>
              <div className="rv-prom"><div>No interest<b>a few dollars a day</b></div><div>No credit check<b>everyone’s approved</b></div><div>30-day returns<b>free, insured</b></div><div>Lifetime warranty<b>on the setting</b></div></div>
              <p className="rv-sig"><b>Meekitaz</b> — we promise.</p>
            </div>
            {err && <p className="bd-note">{err}</p>}
            <button type="button" className="bd-clear" onClick={() => { clearSetting(); clearStone(); window.location.href = "/engagement-rings"; }}>Start over</button>
            <div className="rv-bar">
              <div className="rv-bp"><b>{usd(day(total))}</b><i>a day</i><small>{usd(total)} total · 4 months · {size ? `size ${half(+size)}` : "no size yet"}</small></div>
              <button type="button" className={`rv-go${size ? "" : " off"}`} disabled={busy || mismatch || !!note} onClick={() => { if (!size) { setTried(true); document.getElementById("rv-size")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; } checkout(); }}>{busy ? "One moment…" : size ? "Checkout →" : "Choose your size"}</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
