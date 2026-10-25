"use client";
import { useCallback, useEffect, useState } from "react";
import type { OrderFull, Stage } from "@/lib/orders";

const STAGES: Stage[] = ["new", "cad", "factory", "ready", "shipped"];
const LABEL: Record<Stage, string> = { new: "New order", cad: "3D CAD", factory: "Sent to factory", ready: "Ready", shipped: "Shipped", refund: "Refund request", upgrade: "Upgrade request" };
const PLAN: Record<string, number> = { new: 0, cad: 1, factory: 4, ready: 18, shipped: 20 }; // planned day offsets from the order date
const usd = (n: number) => (n < 0 ? "−" : "") + "$" + Math.abs(Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const day = (d: string | Date) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const when = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const ICON: Record<string, string> = { note: "📝 Note", call: "📞 Call", email: "✉️ Email", message: "💬 Message", system: "" };

export default function OrderPage({ id, onClose, onMove }: { id: string; onClose: () => void; onMove: (stage: Stage) => void }) {
  const [o, setO] = useState<OrderFull | null>(null); const [err, setErr] = useState("");
  const [kind, setKind] = useState("note"); const [text, setText] = useState("");
  const [rText, setRText] = useState(""); const [rDue, setRDue] = useState(new Date().toISOString().slice(0, 10));
  const [mail, setMail] = useState<{ subject: string; text: string } | null>(null); const [busy, setBusy] = useState(false);

  const load = useCallback(async () => { const r = await fetch(`/api/crm/order?id=${encodeURIComponent(id)}`).then(x => x.json()).catch(() => null); if (r?.order) setO(r.order); else setErr(r?.error || "Couldn't load the order"); }, [id]);
  useEffect(() => { load(); }, [load]);
  const post = async (b: Record<string, unknown>) => { setBusy(true); const r = await fetch("/api/crm/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: o?.name, ...b }) }); setBusy(false); await load(); return r.ok; };

  if (err) return <div className="op"><button className="op-back" onClick={onClose}>← Orders</button><p className="crm-empty">{err}</p></div>;
  if (!o) return <div className="op"><button className="op-back" onClick={onClose}>← Orders</button><p className="crm-empty">Loading…</p></div>;
  const cur = STAGES.indexOf(o.stage), today = new Date().toISOString().slice(0, 10);
  const promised = new Date(new Date(o.createdAt).getTime() + 21 * 864e5);
  const care = o.lines.find(l => /care package/i.test(l.title));
  const next = cur >= 0 && cur < STAGES.length - 1 ? STAGES[cur + 1] : null;
  const d = Math.floor((Date.now() - new Date(o.stageAt).getTime()) / 864e5);

  return (
    <div className="op">
      <div className="op-hd">
        <div>
          <button className="op-back" onClick={onClose}>← Orders</button>
          <h1>{o.name} · {o.customer}</h1>
          <div className="op-sub">{[o.email, o.phone].filter(Boolean).join(" · ")} · Ordered {when(o.createdAt)}</div>
          <div className="op-chips"><span className="c-stage">{LABEL[o.stage]} · day {d + 1}</span><span className="c-paid">{o.financial.toLowerCase().replace(/_/g, " ")}{o.gateways.length ? ` · ${o.gateways.join(", ")}` : ""}</span>{care && <span className="c-care">{care.title.replace(" Package", "")}</span>}{o.herDate && <span className="c-date">Her date · {o.herDate}</span>}</div>
        </div>
        <div className="op-acts">
          {o.email && <button onClick={() => setMail({ subject: `About your Meekitaz order ${o.name}`, text: `Hi ${o.customer.split(" ")[0]},\n\n` })}>Email {o.customer.split(" ")[0]}</button>}
          <a href={`https://admin.shopify.com/store/d0vj18-bf/orders/${o.id.split("/").pop()}`} target="_blank" rel="noopener">Open in Shopify ↗</a>
          {next && <button className="dark" onClick={() => { onMove(next); setTimeout(load, 600); }}>Move to {LABEL[next]} →</button>}
        </div>
      </div>
      <div className="op-steps">{STAGES.map((s, i) => {
        const planned = new Date(new Date(o.createdAt).getTime() + PLAN[s] * 864e5);
        return <div key={s} className={`op-st${i < cur ? " done" : ""}${i === cur ? " cur" : ""}`}><i />{LABEL[s]}<small>{i < cur ? "done" : i === cur ? `since ${day(o.stageAt)}` : `planned ${day(planned)}`}</small></div>;
      })}{(o.stage === "refund" || o.stage === "upgrade") && <div className="op-st cur"><i />{LABEL[o.stage]}<small>since {day(o.stageAt)}</small></div>}</div>

      <div className="op-grid">
        <div>
          <section className="op-card"><h3>What {o.customer.split(" ")[0]} ordered</h3>
            {o.lines.map((l, k) => (
              <div key={k} className="op-item">
                <div className="im" style={l.image ? { backgroundImage: `url(${l.image})` } : undefined} />
                <div className="tx"><b>{l.qty > 1 ? `${l.qty} × ` : ""}{l.title}</b>{l.variant && <span>{l.variant}</span>}{l.sku && <span>{l.sku}</span>}{l.attrs.map(a => <span key={a.key}>{a.key}: {a.value}</span>)}</div>
                <div className="pr">{usd(l.total)}{l.total < l.price * l.qty && <s>{usd(l.price * l.qty)}</s>}</div>
              </div>
            ))}
          </section>
          {o.note && <section className="op-card"><h3>Special requests</h3><div className="op-req">{o.note}</div></section>}
          <section className="op-card"><h3>Timeline · what was said and done</h3>
            <div className="op-add">
              <div className="row">{["note", "call", "email", "message"].map(k => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{ICON[k]}</button>)}</div>
              <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What happened? e.g. Called her, she approved CAD v1 but wants the halo a bit thinner." />
              <button className="dark" disabled={busy || !text.trim()} onClick={async () => { if (await post({ action: "event", kind, text })) setText(""); }}>Add to timeline</button>
            </div>
            <ul className="op-tl">
              {o.events.map(e => <li key={e.id} className={e.kind}>{e.kind !== "system" && <b>{ICON[e.kind]}{e.author ? ` · ${e.author}` : ""} </b>}{e.text}<small>{when(e.created_at)}</small></li>)}
              {o.history.filter(h => h.channel === "chat").map(h => <li key={h.id} className="message"><b>Chat with Mia </b>{h.summary || "Conversation"}<small>{when(h.updated_at)}</small></li>)}
              <li className="system">Order placed in Shopify{o.gateways.length ? ` · ${o.gateways.join(", ")}` : ""}<small>{when(o.createdAt)}</small></li>
            </ul>
          </section>
        </div>
        <div>
          <section className="op-card"><h3>Reminders</h3>
            {!o.reminders.length && <p className="op-muted">No reminders yet.</p>}
            {o.reminders.map(r => (
              <label key={r.id} className={`op-rem${!r.done && r.due <= today ? " due" : ""}${r.done ? " done" : ""}`}>
                <input type="checkbox" checked={r.done} onChange={e => post({ action: "reminder_done", rid: r.id, done: e.target.checked })} />
                <div>{r.text}<small>{r.due === today ? "Due today" : r.due < today && !r.done ? `Overdue · ${r.due}` : r.due}{r.who ? ` · ${r.who}` : ""}</small></div>
              </label>
            ))}
            <div className="op-remadd"><input value={rText} onChange={e => setRText(e.target.value)} placeholder="New reminder…" /><input type="date" value={rDue} onChange={e => setRDue(e.target.value)} /><button className="dark" disabled={!rText.trim() || busy} onClick={async () => { if (await post({ action: "reminder", text: rText, due: rDue })) setRText(""); }}>Add</button></div>
          </section>
          <section className="op-card"><h3>Payment</h3>
            <div className="op-money">
              <span>Subtotal</span><span>{usd(o.money.subtotal)}</span>
              {o.money.discounts > 0 && <><span>Discounts{o.money.codes.length ? ` · ${o.money.codes.join(", ")}` : ""}</span><span className="neg">{usd(-o.money.discounts)}</span></>}
              <span>Shipping{o.ship?.method ? ` · ${o.ship.method}` : ""}</span><span>{o.money.shipping ? usd(o.money.shipping) : "Free"}</span>
              <span>Tax</span><span>{usd(o.money.tax)}</span>
              <span className="tot">Total</span><span className="tot">{usd(o.money.total)}</span>
              <span>Received</span><span>{usd(o.money.received)}</span>
            </div>
            <div className="op-kv"><span>Method</span><b>{o.gateways.join(", ") || "—"}</b><span>Status</span><b>{o.financial.toLowerCase().replace(/_/g, " ")}</b></div>
          </section>
          <section className="op-card"><h3>Shipping to</h3>
            {o.ship ? <div className="op-kv"><span>Name</span><b>{o.ship.name}</b><span>Address</span><b>{o.ship.lines.map((l, k) => <span key={k} style={{ display: "block" }}>{l}</span>)}</b>{o.ship.phone && <><span>Phone</span><b>{o.ship.phone}</b></>}<span>Method</span><b>{o.ship.method || "—"} · signature required</b><span>Tracking</span><b>{o.tracking ? `${o.carrier || ""} ${o.tracking}` : <em style={{ opacity: .5 }}>Added when shipped</em>}</b></div> : <p className="op-muted">No shipping address on the order.</p>}
          </section>
          <section className="op-card"><h3>Key dates</h3>
            <div className="op-kv"><span>Ordered</span><b>{day(o.createdAt)}</b><span>Promised by</span><b>{day(promised)}</b>{o.herDate && <><span>Her date</span><b>{o.herDate}</b></>}<span>In stage since</span><b>{day(o.stageAt)}</b>{care && <><span>Care package</span><b>{care.title.replace(" Package", "")}</b></>}</div>
          </section>
          <section className="op-card"><h3>Her history</h3>
            {!o.history.length && <p className="op-muted">No chats or sign-ups with this email.</p>}
            {o.history.map(h => <div key={h.id} className="op-conv"><span><i className={`k-${h.channel}`}>{h.channel}</i>{h.summary || h.lead?.interest || "Conversation"}</span><small>{day(h.updated_at)}</small></div>)}
          </section>
        </div>
      </div>

      {mail && (
        <div className="ob-ov" onClick={() => setMail(null)}>
          <form className="ob-ship" style={{ width: "min(560px,92vw)" }} onClick={e => e.stopPropagation()} onSubmit={async e => { e.preventDefault(); if (await post({ action: "email", to: o.email, subject: mail.subject, text: mail.text })) setMail(null); else alert("Couldn't send the email."); }}>
            <h3>Email {o.customer}</h3>
            <label>Subject<input value={mail.subject} onChange={e => setMail({ ...mail, subject: e.target.value })} /></label>
            <label>Message<textarea value={mail.text} onChange={e => setMail({ ...mail, text: e.target.value })} style={{ minHeight: 200, border: "1px solid rgba(28,26,27,.14)", borderRadius: 12, padding: 12, font: "15px/1.5 var(--body)" }} autoFocus /></label>
            <p className="op-muted" style={{ margin: 0 }}>Sent from sales@meekitaz.com; her reply goes to that inbox. Saved in the timeline.</p>
            <div><button type="button" className="sec" onClick={() => setMail(null)}>Cancel</button><button disabled={busy}>{busy ? "Sending…" : "Send"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}
