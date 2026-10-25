"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import CrmChrome from "./CrmChrome";
import OrdersBoard from "./OrdersBoard";
import TodayView from "./TodayView";

type Conv = { id: string; channel: string; status: string; kind: string | null; temp: string | null; stage: string; name: string | null; email: string | null; phone: string | null;
  lead: Record<string, string>; summary: string | null; unread: boolean; created_at: string; updated_at: string; last: string | null; first: string | null };
type Msg = { id: number; role: string; content: string; meta: { cards?: { title: string; price: string; url: string }[] }; created_at: string };

const CH: Record<string, [string, string]> = { chat: ["Site chat", "ch-chat"], popup: ["Pop-up", "ch-pop"], appointment: ["Appointment", "ch-appt"], contact: ["Contact form", "ch-site"], email: ["Email", "ch-email"], sms: ["SMS", "ch-sms"], insta: ["Instagram", "ch-insta"] };
const TABS: [string, string][] = [["all", "All"], ["hot", "Hot"], ["chat", "Site chat"], ["popup", "Pop-up"], ["appointment", "Appointments"], ["human", "Waiting for you"], ["care", "Moved to care"]];
const ago = (d: string) => { const s = (Date.now() - new Date(d).getTime()) / 1000; return s < 60 ? "now" : s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`; };
const who = (c: Conv) => c.name || c.email || c.phone || "Website visitor";
const want = (c: Conv) => c.lead?.interest || c.summary || c.first || "";

export default function CrmApp() {
  const [view, setView] = useState<"closers" | "orders" | "today">("closers");
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [items, setItems] = useState<Conv[]>([]);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [thread, setThread] = useState<{ conversation: Conv; messages: Msg[] } | null>(null);
  const [text, setText] = useState(""); const [note, setNote] = useState(false);

  const loadList = useCallback(async () => { const r = await fetch("/api/crm/data").then(x => x.json()).catch(() => null); if (r?.items) setItems(r.items); }, []);
  const loadThread = useCallback(async (id: string) => { const r = await fetch(`/api/crm/data?id=${id}`).then(x => x.json()).catch(() => null); if (r?.conversation) setThread(r); }, []);
  useEffect(() => { loadList(); const t = setInterval(loadList, 15000); return () => clearInterval(t); }, [loadList]);
  useEffect(() => { if (!sel) return; loadThread(sel); const t = setInterval(() => loadThread(sel), 8000); return () => clearInterval(t); }, [sel, loadThread]);

  const post = async (body: Record<string, unknown>) => { await fetch("/api/crm/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (sel) await loadThread(sel); await loadList(); };
  const open = (id: string) => { setSel(id); setThread(null); post({ id, action: "read" }); };

  const closers = items.filter(c => c.kind !== "care");
  const shown = useMemo(() => {
    const base = tab === "care" ? items.filter(c => c.kind === "care") : closers.filter(c =>
      tab === "all" ? true : tab === "hot" ? c.temp === "hot" : tab === "human" ? c.status === "human" : c.channel === tab);
    const t = q.trim().toLowerCase();
    const f = t ? base.filter(c => [c.name, c.email, c.phone, want(c), c.last].join(" ").toLowerCase().includes(t)) : base;
    const rank = (c: Conv) => (c.unread ? 0 : 10) + ({ hot: 0, warm: 1, cold: 2 }[c.temp || "warm"] ?? 1);
    return [...f].sort((a, b) => rank(a) - rank(b) || +new Date(b.updated_at) - +new Date(a.updated_at));
  }, [items, closers, tab, q]);
  const count = (k: string) => k === "care" ? items.filter(c => c.kind === "care").length : closers.filter(c => k === "all" ? true : k === "hot" ? c.temp === "hot" : k === "human" ? c.status === "human" : c.channel === k).length;

  const c = thread?.conversation;
  async function send(e: React.FormEvent) { e.preventDefault(); if (!sel || !text.trim()) return; await post({ id: sel, action: note ? "note" : "reply", text }); setText(""); }

  return (
    <div className="crm">
      <CrmChrome />
      <aside className="crm-side">
        <div className="crm-brand">Meekitaz<small>CRM</small></div>
        <nav>
          <button className={view === "closers" ? "on" : ""} onClick={() => setView("closers")}>Closers <span>{closers.filter(x => x.unread).length || ""}</span></button>
          <button className={view === "today" ? "on" : ""} onClick={() => setView("today")}>Today</button>
          <button className={view === "orders" ? "on" : ""} onClick={() => { setOpenOrder(null); setView("orders"); }}>Orders</button>
          <button disabled title="Next">Customer Care <em>soon</em></button>
        </nav>
        <button className="crm-out" onClick={async () => { await fetch("/api/crm/login", { method: "DELETE" }); location.reload(); }}>Log out</button>
      </aside>
      {view === "today" ? <main className="crm-main"><div className="crm-top"><h1>Today</h1></div><TodayView openOrder={id => { setOpenOrder(id); setView("orders"); }} /></main> :
       view === "orders" ? <main className="crm-main"><div className="crm-top"><h1>Orders</h1></div><OrdersBoard key={openOrder || "board"} initial={openOrder} /></main> :
      <main className="crm-main">
        <div className="crm-top"><h1>Closers</h1><input placeholder="Search name, email, ring…" value={q} onChange={e => setQ(e.target.value)} /></div>
        <div className="crm-tabs">{TABS.map(([k, l]) => <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>{l}<i>{count(k)}</i></button>)}</div>
        <div className="crm-split">
          <div className="crm-list">
            {!shown.length && <p className="crm-empty">Nothing here yet.</p>}
            {shown.map(x => (
              <div key={x.id} className={`crm-row${x.unread ? " new" : ""}${x.id === sel ? " on" : ""}`} onClick={() => open(x.id)}>
                <div className="a">{who(x)}<span>{ago(x.updated_at)}</span></div>
                <div className="b">{want(x)}</div>
                <div className="c"><span className={`crm-pill ${CH[x.channel]?.[1] || "ch-site"}`}>{CH[x.channel]?.[0] || x.channel}</span>{x.temp && <span className={`crm-pill t-${x.temp}`}>{x.temp}</span>}{x.status === "human" && <span className="crm-pill t-you">you</span>}</div>
              </div>
            ))}
          </div>
          <div className="crm-pane">
            {!c ? <p className="crm-empty">Pick a conversation.</p> : (<>
              <div className="ph">
                <div className="who"><span className={`crm-pill ${CH[c.channel]?.[1] || "ch-site"}`}>{CH[c.channel]?.[0] || c.channel}</span>
                  <h2>{who(c)}</h2><div>{[c.email, c.phone].filter(Boolean).join(" · ") || "No contact details yet"}</div></div>
                <div className="acts">
                  {c.status === "human" ? <button onClick={() => post({ id: c.id, action: "update", patch: { status: "ai" } })}>Hand back to Mia</button> : <button onClick={() => post({ id: c.id, action: "update", patch: { status: "human" } })}>Take over from Mia</button>}
                  {c.kind === "care" ? <button onClick={() => post({ id: c.id, action: "update", patch: { kind: "sales" } })}>→ Closers</button> : <button className="dark" onClick={() => post({ id: c.id, action: "update", patch: { kind: "care" } })}>→ Customer Care</button>}
                </div>
              </div>
              <div className="facts">
                <div><b>Heat</b>{(["hot", "warm", "cold"] as const).map(t => <button key={t} className={`crm-pill t-${t}${c.temp === t ? " sel" : ""}`} onClick={() => post({ id: c.id, action: "update", patch: { temp: t } })}>{t}</button>)}</div>
                <div><b>Stage</b><select value={c.stage} onChange={e => post({ id: c.id, action: "update", patch: { stage: e.target.value } })}>{["new", "contacted", "appointment", "proposal", "won", "lost"].map(s => <option key={s}>{s}</option>)}</select></div>
                {Object.entries(c.lead || {}).filter(([, v]) => v).map(([k, v]) => <div key={k}><b>{k.replace(/_/g, " ")}</b>{String(v)}</div>)}
              </div>
              <div className="thread">
                {thread!.messages.map(m => m.role === "system" ? <div key={m.id} className="msg sys">{m.content} · {ago(m.created_at)}</div> : (
                  <div key={m.id} className={`msg ${m.role}`}>
                    {m.role === "assistant" && <em>Mia</em>}{m.role === "agent" && <em>You</em>}{m.role === "note" && <em>Internal note</em>}
                    {m.content}
                    {!!m.meta?.cards?.length && <div className="cards">{m.meta.cards.map(k => <a key={k.url} href={k.url} target="_blank" rel="noopener">{k.title} · {k.price}</a>)}</div>}
                    <small>{ago(m.created_at)}</small>
                  </div>
                ))}
              </div>
              <form className="reply" onSubmit={send}>
                <label className={note ? "on" : ""}><input type="checkbox" checked={note} onChange={e => setNote(e.target.checked)} /> Note</label>
                <input value={text} onChange={e => setText(e.target.value)} placeholder={note ? "Internal note (the customer doesn't see it)" : c.channel === "chat" ? "Reply in the site chat… (Mia steps aside)" : "Write a note — reply to this lead by email for now"} />
                <button>{note ? "Save" : "Send"}</button>
              </form>
            </>)}
          </div>
        </div>
      </main>}
    </div>
  );
}
