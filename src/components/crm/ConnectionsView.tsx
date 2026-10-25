"use client";
import { useEffect, useState } from "react";

type S = { gmail: { keys: boolean; account: string | null; last: number | null }; instagram: { keys: boolean; account: string | null; exp: number | null } };
export default function ConnectionsView() {
  const [s, setS] = useState<S | null>(null); const [msg, setMsg] = useState("");
  const load = () => fetch("/api/crm/connections").then(r => r.json()).then(setS).catch(() => null);
  useEffect(() => { load(); const q = new URLSearchParams(location.search); if (q.get("connected")) setMsg(`${q.get("connected") === "gmail" ? "Gmail" : "Instagram"} connected ✓`); if (q.get("err")) setMsg(`Couldn't connect: ${q.get("err")}`); }, []);
  const off = async (n: string) => { if (!confirm(`Disconnect ${n}?`)) return; await fetch("/api/crm/connections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ disconnect: n }) }); load(); };
  const sync = async () => { setMsg("Syncing…"); const r = await fetch("/api/crm/sync").then(x => x.json()).catch(() => null); setMsg(r?.gmail?.ok ? `Gmail synced · ${r.gmail.added} new` : `Sync: ${r?.gmail?.reason || "failed"}`); };
  if (!s) return <p className="crm-empty">Loading…</p>;
  return (
    <div className="td">
      {msg && <p className="ob-err" style={{ background: "#fff" }}>{msg}</p>}
      <section className="op-card cx">
        <div className="cx-h"><b>✉️ Gmail</b>{s.gmail.account ? <span className="ok">Connected · {s.gmail.account}</span> : <span>Not connected</span>}</div>
        <p className="op-muted">New emails in your inbox become conversations in Closers (or Customer Care, for orders, resizes, returns…). Replies you send from the CRM go out from your Gmail, in the same thread. Checked every 5 minutes.</p>
        {!s.gmail.keys ? <p className="op-muted"><b>Waiting for the Google keys</b> (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Vercel).</p>
          : s.gmail.account ? <div className="cx-a"><button onClick={sync}>Sync now</button><button onClick={() => off("gmail")}>Disconnect</button></div>
          : <a className="cx-btn" href="/api/crm/google/connect">Connect Gmail</a>}
      </section>
      <section className="op-card cx">
        <div className="cx-h"><b>📷 Instagram</b>{s.instagram.account ? <span className="ok">Connected · @{s.instagram.account}</span> : <span>Not connected</span>}</div>
        <p className="op-muted">New DMs to your business account arrive in Closers instantly. You reply from the CRM; Instagram allows replies within 24 hours of her last message.</p>
        {!s.instagram.keys ? <p className="op-muted"><b>Waiting for the Meta app keys</b> (IG_APP_ID, IG_APP_SECRET, IG_VERIFY_TOKEN in Vercel).</p>
          : s.instagram.account ? <div className="cx-a"><button onClick={() => off("instagram")}>Disconnect</button></div>
          : <a className="cx-btn" href="/api/crm/instagram/connect">Connect Instagram</a>}
      </section>
      <section className="op-card cx"><div className="cx-h"><b>📞 Phone & SMS (Twilio)</b><span>Later</span></div><p className="op-muted">Calls, missed calls, voicemails and texts. We&rsquo;ll connect this when the number is ready.</p></section>
    </div>
  );
}
