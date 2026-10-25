"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { wishList, removeWish, shareList, sharedId, wishName, type WishItem } from "@/lib/wish";
import { toast } from "./Toast";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
/** The Dream list drawer: saved pieces, friends' votes, and one link to share them all. */
export default function DreamList() {
  const [open, setOpen] = useState(false); const [items, setItems] = useState<WishItem[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({}); const [link, setLink] = useState(""); const [name, setName] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => {
    const r = () => setItems(wishList()); r(); setName(wishName());
    const o = () => { r(); setOpen(true); };
    window.addEventListener("mk-wish", r); window.addEventListener("mk-dream-open", o);
    return () => { window.removeEventListener("mk-wish", r); window.removeEventListener("mk-dream-open", o); };
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("sw-open", open);
    if (!open) return; const id = sharedId(); if (!id) return; setLink(`${location.origin}/dream/${id}`);
    fetch(`/api/wish/${id}`).then(r => r.json()).then(j => setVotes(j.votes || {})).catch(() => {});
  }, [open]);
  if (!open) return null;
  const share = async () => {
    setBusy(true); const id = await shareList(name); setBusy(false);
    if (!id) { toast("Couldn’t create the link. Try again."); return; }
    const u = `${location.origin}/dream/${id}`; setLink(u);
    if (navigator.share) { try { await navigator.share({ title: `${name ? name + "’s" : "My"} Dream list · Meekitaz`, text: "Help me choose! Tap ♥ on your favourite.", url: u }); return; } catch { /* cancelled */ } }
    try { await navigator.clipboard.writeText(u); toast("Link copied ✓ Send it to your friends"); } catch { /* */ }
  };
  const sorted = [...items].sort((a, b) => (votes[b.handle] || 0) - (votes[a.handle] || 0));
  const top = sorted.find(x => votes[x.handle]);
  return (
    <>
      <div className="ss-dim" onClick={() => setOpen(false)} />
      <aside className="dl" role="dialog" aria-modal="true" aria-label="My Dream list">
        <button className="sw-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
        <h3>My Dream list</h3><p className="ss-s">{items.length ? `${items.length} piece${items.length === 1 ? "" : "s"} you love` : "Tap ♡ on any piece to save it here."}</p>
        {sorted.map(x => (
          <div key={x.handle} className="dl-i">
            <Link href={`/products/${x.handle}`} onClick={() => setOpen(false)} className="im" style={{ backgroundImage: `url(${x.image})` }} aria-label={x.title} />
            <div className="tx"><Link href={`/products/${x.handle}`} onClick={() => setOpen(false)}><b>{x.title}</b></Link><small>{usd(x.price)}</small></div>
            {votes[x.handle] ? <span className={`dl-v${top?.handle === x.handle ? " top" : ""}`}>♥ {votes[x.handle]}</span> : null}
            <button className="dl-x" onClick={() => removeWish(x.handle)} aria-label={`Remove ${x.title}`}>×</button>
          </div>
        ))}
        {items.length > 0 && (
          <div className="dl-share">
            <b>Share my Dream list</b>
            <p>One link with all your picks. Friends tap ♥ on their favourite, and you see the votes here.</p>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your first name (optional)" maxLength={30} />
            {link ? <div className="lnk"><span>{link.replace(/^https?:\/\//, "")}</span><button onClick={share} disabled={busy}>{busy ? "…" : "Share"}</button></div>
              : <button className="go" onClick={share} disabled={busy}>{busy ? "Creating…" : "Create my link"}</button>}
          </div>
        )}
      </aside>
    </>
  );
}
