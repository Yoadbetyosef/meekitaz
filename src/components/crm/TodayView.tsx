"use client";
import { useCallback, useEffect, useState } from "react";

type R = { id: number; order_id: string | null; order_name: string | null; who: string | null; text: string; due: string; done: boolean };
export default function TodayView({ openOrder }: { openOrder: (id: string) => void }) {
  const [items, setItems] = useState<R[] | null>(null);
  const load = useCallback(async () => { const r = await fetch("/api/crm/reminders").then(x => x.json()).catch(() => null); setItems(r?.items || []); }, []);
  useEffect(() => { load(); }, [load]);
  const done = async (r: R, v: boolean) => { await fetch("/api/crm/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.order_id || "", action: "reminder_done", rid: r.id, done: v }) }); load(); };
  if (!items) return <p className="crm-empty">Loading…</p>;
  const today = new Date().toISOString().slice(0, 10);
  const groups: [string, R[]][] = [["Overdue", items.filter(r => !r.done && r.due < today)], ["Today", items.filter(r => !r.done && r.due === today)], ["Coming up", items.filter(r => !r.done && r.due > today)], ["Done", items.filter(r => r.done)]];
  return (
    <div className="td">
      {!items.length && <p className="crm-empty">No reminders yet. Add them from an order. Every morning the day&rsquo;s list is emailed to you.</p>}
      {groups.filter(([, l]) => l.length).map(([t, l]) => (
        <section key={t} className="op-card"><h3>{t} · {l.length}</h3>
          {l.map(r => (
            <div key={r.id} className={`op-rem${t === "Overdue" || t === "Today" ? " due" : ""}${r.done ? " done" : ""}`}>
              <input type="checkbox" checked={r.done} onChange={e => done(r, e.target.checked)} />
              <div>{r.text}<small>{r.due}{r.who ? ` · ${r.who}` : ""}{r.order_name ? " · " : ""}{r.order_id && <a onClick={() => openOrder(r.order_id!)}>{r.order_name || "order"}</a>}</small></div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
