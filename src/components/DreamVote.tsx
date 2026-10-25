"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { handle: string; title: string; image: string; price: number };
const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
/** Friends vote for one favourite on a shared Dream list (one vote per browser; voting again moves it). */
export default function DreamVote({ id, items, votes: v0 }: { id: string; items: Item[]; votes: Record<string, number> }) {
  const [votes, setVotes] = useState(v0); const [mine, setMine] = useState<string | null>(null);
  useEffect(() => { try { setMine(localStorage.getItem(`mk_vote_${id}`)); } catch { /* */ } }, [id]);
  const vote = async (h: string) => {
    let voter = ""; try { voter = localStorage.getItem("mk_voter") || ""; if (!voter) { voter = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("mk_voter", voter); } localStorage.setItem(`mk_vote_${id}`, h); } catch { /* */ }
    setMine(h);
    const r = await fetch(`/api/wish/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ voter, handle: h }) }).then(x => x.json()).catch(() => null);
    if (r?.votes) setVotes(r.votes);
  };
  return (
    <div className="dream-grid">
      {items.map(x => (
        <div key={x.handle} className={`dream-c${mine === x.handle ? " mine" : ""}`}>
          <Link href={`/products/${x.handle}`} className="im" style={{ backgroundImage: `url(${x.image})` }} aria-label={x.title} />
          <b>{x.title}</b><small>{usd(x.price)}</small>
          <button onClick={() => vote(x.handle)} aria-pressed={mine === x.handle}>{mine === x.handle ? "♥ My favourite" : "♡ This one"}{votes[x.handle] ? <em>{votes[x.handle]}</em> : null}</button>
        </div>
      ))}
    </div>
  );
}
