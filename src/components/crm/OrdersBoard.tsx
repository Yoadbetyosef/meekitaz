"use client";
import { useCallback, useEffect, useState } from "react";
import type { OrderRow, Stage } from "@/lib/orders";

const STAGES: Stage[] = ["new", "cad", "factory", "ready", "shipped", "refund", "upgrade"];
const LABEL: Record<Stage, string> = { new: "New order", cad: "3D CAD", factory: "Sent to factory", ready: "Ready", shipped: "Shipped", refund: "Refund request", upgrade: "Upgrade request" };
const LATE: Partial<Record<Stage, number>> = { new: 1, cad: 4, factory: 14, ready: 2 };
const days = (d: string) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

export default function OrdersBoard() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<OrderRow | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [ship, setShip] = useState<{ o: OrderRow; tracking: string; carrier: string; notify: boolean } | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => { const r = await fetch("/api/crm/orders").then(x => x.json()).catch(() => null); if (r) { setOrders(r.orders || []); setErr(r.error || ""); } }, []);
  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);
  const say = (t: string) => { setToast(t); setTimeout(() => setToast(""), 2500); };

  async function move(o: OrderRow, stage: Stage, extra: Record<string, unknown> = {}) {
    if (stage === "shipped" && !extra.tracking && o.stage !== "shipped") { setShip({ o, tracking: o.tracking || "", carrier: o.carrier || "FedEx", notify: true }); return; }
    setOrders(list => list?.map(x => x.id === o.id ? { ...x, stage, stageAt: new Date().toISOString() } : x) || null);
    const r = await fetch("/api/crm/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id, name: o.name, email: o.email, stage, ...extra }) }).then(x => x.json()).catch(() => null);
    say(`${o.name} → ${LABEL[stage]}${r?.emailed ? " · tracking email sent" : ""}`); load();
  }

  if (!orders) return <p className="crm-empty">Loading orders…</p>;
  return (
    <>
      {err && <p className="ob-err">Couldn&rsquo;t read orders from Shopify: {err}</p>}
      {!orders.length && !err && <p className="ob-err" style={{ background: "#fff" }}>No orders yet. Every new Shopify order lands in <b>New order</b> automatically.</p>}
      <div className="ob">
        {STAGES.map(s => {
          const list = orders.filter(o => o.stage === s);
          return (
            <div key={s} className={`ob-col${s === "refund" || s === "upgrade" ? " alt" : ""}${drag ? " drop" : ""}`}
              onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const o = orders.find(x => x.id === drag); setDrag(null); if (o && o.stage !== s) move(o, s); }}>
              <h3>{LABEL[s]}<span>{list.length}</span></h3>
              <div className="ob-sum">{usd(list.reduce((a, o) => a + o.total, 0))}</div>
              {list.map(o => {
                const d = days(o.stageAt), late = LATE[s] != null && d > (LATE[s] as number);
                return (
                  <div key={o.id} className="ob-card" draggable onDragStart={() => setDrag(o.id)} onDragEnd={() => setDrag(null)} onClick={() => setOpen(o)}>
                    <div className="t">{o.name}<span>{usd(o.total)}</span></div>
                    <div className="n">{o.customer}</div>
                    <p>{o.items.filter(i => !/care package/i.test(i.title)).map(i => i.title + (i.variant ? ` · ${i.variant}` : "")).join(" + ")}</p>
                    <div className="f"><span className={late ? "late" : ""}>{d === 0 ? "today" : `${d} day${d > 1 ? "s" : ""}`} here</span>{o.tracking && <span>📦</span>}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {open && (
        <div className="ob-ov" onClick={() => setOpen(null)}>
          <aside className="ob-dr" onClick={e => e.stopPropagation()}>
            <button className="ob-x" onClick={() => setOpen(null)}>×</button>
            <small className="ob-eb">{LABEL[open.stage]}</small>
            <h2>{open.name} · {open.customer}</h2>
            <p className="ob-sub">{open.email} · {new Date(open.createdAt).toLocaleDateString()} · {usd(open.total)} · {open.financial.toLowerCase()}</p>
            <h4>Items</h4>
            {open.items.map((i, k) => <div key={k} className="ob-item"><b>{i.qty > 1 ? `${i.qty} × ` : ""}{i.title}</b>{i.variant && <span>{i.variant}</span>}{i.attrs.map(a => <span key={a.key}>{a.key}: {a.value}</span>)}</div>)}
            {open.note && <><h4>Order notes</h4><p className="ob-note">{open.note}</p></>}
            <h4>Stage</h4>
            <div className="ob-stg">{STAGES.map(s => <button key={s} className={open.stage === s ? "on" : ""} onClick={() => { move(open, s); setOpen({ ...open, stage: s }); }}>{LABEL[s]}</button>)}</div>
            {open.tracking && <p className="ob-sub">Tracking: {open.carrier} {open.tracking}</p>}
            <a className="ob-link" href={`https://admin.shopify.com/store/d0vj18-bf/orders/${open.id.split("/").pop()}`} target="_blank" rel="noopener">Open in Shopify ↗</a>
          </aside>
        </div>
      )}

      {ship && (
        <div className="ob-ov" onClick={() => setShip(null)}>
          <form className="ob-ship" onClick={e => e.stopPropagation()} onSubmit={e => { e.preventDefault(); const s = ship; setShip(null); setOpen(null); move(s.o, "shipped", { tracking: s.tracking, carrier: s.carrier, notify: s.notify }); }}>
            <h3>Ship {ship.o.name}</h3>
            <label>Carrier<select value={ship.carrier} onChange={e => setShip({ ...ship, carrier: e.target.value })}><option>FedEx</option><option>UPS</option></select></label>
            <label>Tracking number<input value={ship.tracking} onChange={e => setShip({ ...ship, tracking: e.target.value })} required autoFocus /></label>
            <label className="row"><input type="checkbox" checked={ship.notify} onChange={e => setShip({ ...ship, notify: e.target.checked })} /> Email the customer her tracking link</label>
            <div><button type="button" className="sec" onClick={() => setShip(null)}>Cancel</button><button>Mark shipped</button></div>
          </form>
        </div>
      )}
      {toast && <div className="ob-toast">{toast}</div>}
    </>
  );
}
