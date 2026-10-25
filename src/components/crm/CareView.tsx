"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

type T = { id: string; channel: string; name: string | null; email: string | null; phone: string | null; lead: Record<string, string>; summary: string | null; unread: boolean; created_at: string; updated_at: string;
  ticket_no: number | null; care_cat: string | null; care_status: string | null; order_name: string | null; care_at: string | null; first_reply_at: string | null; solved_at: string | null; status: string; first: string | null; last: string | null };
type Msg = { id: number; role: string; content: string; meta: { via?: string; cards?: { title: string; price: string; url: string }[] }; created_at: string };
const CATS = ["resize", "repair", "return", "shipping", "certificate", "warranty", "payment", "other"];
const ST: [string, string][] = [["new", "New"], ["in_progress", "In progress"], ["waiting", "Waiting"], ["solved", "Solved"]];
const TABS: [string, string][] = [["open", "Open"], ["new", "New"], ["in_progress", "In progress"], ["waiting", "Waiting"], ["solved", "Solved"], ["all", "All"]];
const CH: Record<string, string> = { chat: "Site chat", popup: "Pop-up", appointment: "Appointment", email: "Email", sms: "SMS", insta: "Instagram", contact: "Contact form" };
const ago = (d: string) => { const s = (Date.now() - new Date(d).getTime()) / 1000; return s < 60 ? "now" : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`; };
function sla(t: T) {
  if (t.care_status === "solved") return { txt: "Solved", late: false };
  if (t.first_reply_at) return { txt: t.care_status === "waiting" ? "Waiting for her" : "Answered", late: false };
  const left = (new Date(t.care_at || t.created_at).getTime() + 864e5 - Date.now()) / 36e5;
  return left >= 0 ? { txt: `${Math.ceil(left)}h left`, late: left < 3 } : { txt: `Overdue ${Math.ceil(-left)}h`, late: true };
}

export default function CareView({ openOrder }: { openOrder: (id: string) => void }) {
  const [items, setItems] = useState<T[]>([]); const [tab, setTab] = useState("open"); const [sel, setSel] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]); const [text, setText] = useState(""); const [via, setVia] = useState<"chat" | "email" | "note">("email"); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const r = await fetch("/api/crm/care").then(x => x.json()).catch(() => null); if (r?.items) setItems(r.items); }, []);
  const loadMsgs = useCallback(async (id: string) => { const r = await fetch(`/api/crm/data?id=${id}`).then(x => x.json()).catch(() => null); if (r?.messages) setMsgs(r.messages); }, []);
  useEffect(() => { load(); const t = setInterval(load, 15000); return () => clearInterval(t); }, [load]);
  useEffect(() => { if (!sel) return; loadMsgs(sel); const t = setInterval(() => loadMsgs(sel), 8000); return () => clearInterval(t); }, [sel, loadMsgs]);
  const shown = useMemo(() => items.filter(t => tab === "all" ? true : tab === "open" ? t.care_status !== "solved" : t.care_status === tab)
    .sort((a, b) => (sla(a).late ? 0 : 1) - (sla(b).late ? 0 : 1) || +new Date(b.updated_at) - +new Date(a.updated_at)), [items, tab]);
  const t = items.find(x => x.id === sel) || null;
  const act = async (b: Record<string, unknown>) => { setBusy(true); const r = await fetch("/api/crm/care", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: sel, ...b }) }); setBusy(false); await load(); if (sel) await loadMsgs(sel); return r.ok; };
  const pick = (x: T) => { setSel(x.id); setMsgs([]); setVia(x.email ? "email" : x.channel === "chat" ? "chat" : "note"); fetch("/api/crm/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: x.id, action: "read" }) }); };
  async function send(e: React.FormEvent) {
    e.preventDefault(); if (!t || !text.trim()) return;
    const ok = via === "note" ? (await fetch("/api/crm/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: t.id, action: "note", text }) })).ok : await act({ action: "reply", via, text });
    if (ok) { setText(""); if (t) loadMsgs(t.id); } else alert("Couldn't send.");
  }
  async function goOrder() { if (!t?.order_name) return; const r = await fetch(`/api/crm/care?order=${encodeURIComponent(t.order_name)}`).then(x => x.json()).catch(() => null); if (r?.id) openOrder(r.id); else alert("No Shopify order with that number."); }

  return (
    <>
      <div className="crm-tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}<i>{items.filter(x => k === "all" ? true : k === "open" ? x.care_status !== "solved" : x.care_status === k).length}</i></button>)}</div>
      <div className="crm-split">
        <div className="crm-list">
          {!shown.length && <p className="crm-empty">No requests here. Tickets come from Mia, and from &ldquo;→ Customer Care&rdquo; in Closers.</p>}
          {shown.map(x => { const s = sla(x); return (
            <div key={x.id} className={`crm-row${x.unread ? " new" : ""}${x.id === sel ? " on" : ""}`} onClick={() => pick(x)}>
              <div className="a">{x.name || x.email || "Customer"}<span>#C-{x.ticket_no}</span></div>
              <div className="b">{x.first || x.summary || ""}</div>
              <div className="c"><span className="crm-pill ch-site">{x.care_cat || "other"}</span>{x.order_name && <span className="crm-pill ch-chat">{x.order_name}</span>}<span className={`cv-sla${s.late ? " late" : ""}`}>{s.txt}</span></div>
            </div>); })}
        </div>
        <div className="crm-pane">
          {!t ? <p className="crm-empty">Pick a request.</p> : (<>
            <div className="ph">
              <div className="who"><span className="crm-pill ch-site">{CH[t.channel] || t.channel}</span><h2>{t.name || t.email || "Customer"} · #C-{t.ticket_no}</h2><div>{[t.email, t.phone].filter(Boolean).join(" · ") || "No contact details"} · opened {ago(t.care_at || t.created_at)} ago</div></div>
              <div className="acts">
                {t.order_name && <button onClick={goOrder}>Open order {t.order_name}</button>}
                <button onClick={() => { const n = prompt("What's the sales chance? (e.g. resize on engagement ring → wedding band)"); if (n !== null) act({ action: "sales_chance", text: n }); }}>→ Closers (sales chance)</button>
              </div>
            </div>
            <div className="facts">
              <div><b>Status</b><select value={t.care_status || "new"} onChange={e => { const v = e.target.value; act({ action: "status", value: v, notify: v === "solved" ? confirm("Email her the “All done” message?") : undefined }); }}>{ST.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
              <div><b>Type</b><select value={t.care_cat || "other"} onChange={e => act({ action: "category", value: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><b>Order</b><input className="cv-ord" defaultValue={t.order_name || ""} key={t.id} placeholder="#1001" onBlur={e => { if (e.target.value !== (t.order_name || "")) act({ action: "order", value: e.target.value }); }} /></div>
              <div><b>First reply</b><span className={sla(t).late ? "cv-sla late" : "cv-sla"}>{sla(t).txt}</span></div>
            </div>
            <div className="thread">
              {msgs.map(m => m.role === "system" ? <div key={m.id} className="msg sys">{m.content} · {ago(m.created_at)}</div> : (
                <div key={m.id} className={`msg ${m.role}`}>{m.role === "assistant" && <em>Mia</em>}{m.role === "agent" && <em>You{m.meta?.via === "email" ? " · email" : " · chat"}</em>}{m.role === "note" && <em>Internal note</em>}{m.content}<small>{ago(m.created_at)}</small></div>))}
            </div>
            <form className="reply" onSubmit={send}>
              <select value={via} onChange={e => setVia(e.target.value as typeof via)} className="cv-via">
                {t.email && <option value="email">Email</option>}{t.channel === "chat" && <option value="chat">Site chat</option>}<option value="note">Note</option>
              </select>
              <input value={text} onChange={e => setText(e.target.value)} placeholder={via === "email" ? `Email ${t.email}…` : via === "chat" ? "Reply in the site chat…" : "Internal note…"} />
              <button disabled={busy}>{via === "note" ? "Save" : "Send"}</button>
            </form>
          </>)}
        </div>
      </div>
    </>
  );
}
