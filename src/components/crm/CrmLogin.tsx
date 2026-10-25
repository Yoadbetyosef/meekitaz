"use client";
import { useState } from "react";
import CrmChrome from "./CrmChrome";

export default function CrmLogin() {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(false); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(false);
    const r = await fetch("/api/crm/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    if (r.ok) location.reload(); else { setErr(true); setBusy(false); }
  }
  return (
    <div className="crm crm-login">
      <CrmChrome />
      <form onSubmit={go}>
        <div className="crm-brand">Meekitaz<small>CRM</small></div>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus />
        <button disabled={busy}>{busy ? "…" : "Enter"}</button>
        {err && <p>Wrong password</p>}
      </form>
    </div>
  );
}
