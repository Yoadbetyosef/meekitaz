"use client";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { usdR } from "@/lib/plan";
import type { Setting, Stone } from "@/lib/setting";

/* (2026-11-17) TRIAL, behind the private "Pill" switch (meekitaz.com/?look=1): the pill as a personal assistant.
   Its card offers three things to do that fit the page you are on, and a line to ask anything. Whatever needs thinking goes to
   Marcel (the same /api/mia the chat uses, same conversation) and the answer lands in the card, with real pieces. While he
   thinks a soft wave of our colours runs through the pill and around the card ("colour wave", design 3 of four). */
const MARCEL = "/media/marcel.png", K_CONV = "mk_mia_conv", K_VIS = "mk_mia_vis";
const ls = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* */ } } };
type Card = { title: string; price: string; url: string; image?: string };
type Ans = { text: string; cards?: Card[]; chips?: string[] };
type Act = { label: string; sub: string; run: () => void };
export type ProdCtx = { perDay: number; fits: boolean } | null;

export default function PillAide({ path, day, leftDay, prod, onPlan, close }: { path: string; day: number | null; leftDay: number; prod: ProdCtx; onPlan: () => void; close: () => void }) {
  const { cart, rings, add, addRing, setOpen: setBag } = useCart();
  const [busy, setBusy] = useState(false), [hit, setHit] = useState(-1), [ans, setAns] = useState<Ans | null>(null), [text, setText] = useState("");
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; document.body.classList.remove("pai-think"); }; }, []);
  useEffect(() => { document.body.classList.toggle("pai-think", busy); }, [busy]);

  async function ask(q: string, i = -1) {
    const m = q.trim(); if (!m || busy) return;
    setHit(i); setBusy(true); setAns(null); setText("");
    if (!ls.get(K_VIS)) ls.set(K_VIS, Math.random().toString(36).slice(2) + Date.now().toString(36));
    const r = await fetch("/api/mia", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: m, conversationId: ls.get(K_CONV), visitorId: ls.get(K_VIS), page: path }) }).then(x => x.json()).catch(() => null);
    if (!alive.current) return;
    setBusy(false);
    if (!r || r.error) { setAns({ text: "Sorry, I'm having a little trouble. Please try again in a moment." }); return; }
    if (r.id) ls.set(K_CONV, r.id);
    setAns({ text: r.reply || "", cards: (r.products || []).slice(0, 3), chips: (r.chips || []).slice(0, 3) });
    for (const a of (r.actions || []) as { type: string; setting?: Setting; stone?: Stone; variantId?: string }[]) {
      if (a.type === "add_ring" && a.setting && a.stone) addRing(a.setting, a.stone);
      else if (a.type === "add" && a.variantId) { await add(a.variantId); setBag(true); }
      else if (a.type === "open_bag") setBag(true);
    }
  }
  const say = (t: string, i: number) => { setHit(i); setAns({ text: t }); };

  // what fits this page
  const isProd = path.startsWith("/products/"), count = (cart?.totalQuantity || 0) + rings.length;
  const title = typeof document !== "undefined" && isProd ? (document.querySelector("h1")?.textContent || "").trim() : "";
  const buy = typeof document !== "undefined" && isProd ? [...document.querySelectorAll<HTMLButtonElement>("button.pp-add")].find(b => !b.disabled && b.offsetParent) : undefined;
  const buyLabel = buy ? (buy.childNodes[0]?.textContent || "").trim() : "";
  let head = "What can I do for you?", acts: Act[];
  if (isProd) {
    head = "About this piece";
    acts = [
      ...(buy && buyLabel ? [{ label: buyLabel, sub: prod && day ? `${usdR(Math.ceil(prod.perDay))} a day on your plan` : "Right from here", run: () => { close(); buy.click(); } }] : []),
      { label: "Does it fit my plan?", sub: day ? `You chose ${usdR(day)} a day` : "Choose a plan first", run: () => {
        if (!day) return onPlan();
        if (!prod) return void ask(`Does "${title}" fit a plan of ${day} dollars a day?`, 1);
        const per = Math.ceil(prod.perDay), more = Math.max(1, Math.ceil(prod.perDay - leftDay));
        say(prod.fits ? `Yes. This one is ${usdR(per)} a day on your plan.` : `Not yet. It needs ${usdR(more)} more a day. You can raise your plan, or I can show you ones that fit.`, 1);
      } },
      { label: "Show me similar ones", sub: "Close to this one", run: () => void ask(`I'm looking at "${title}". Show me a few similar pieces${day ? ` that fit ${day} dollars a day` : ""}.`, 2) },
    ];
  } else if (count > 0) {
    head = "Almost yours";
    acts = [
      { label: "Check out", sub: `${count} in your bag`, run: () => { close(); setBag(true); } },
      { label: "Help me choose a ring", sub: "Tell me what you like", run: () => void ask("Help me choose an engagement ring.", 1) },
      { label: "Talk to a person", sub: "Someone from our team", run: () => void ask("I'd like to talk to a person from the team.", 2) },
    ];
  } else {
    acts = [
      { label: "Help me choose a ring", sub: "Tell me what you like", run: () => void ask("Help me choose an engagement ring.", 0) },
      day ? { label: "See what fits my plan", sub: `${usdR(day)} a day`, run: () => void ask(`Show me engagement rings that fit ${day} dollars a day.`, 1) }
          : { label: "Choose my plan", sub: "From $1 a day", run: onPlan },
      { label: "Build my own ring", sub: "A diamond and a setting", run: () => { close(); window.location.href = "/build"; } },
    ];
  }
  return (
    <div className={`pai${busy ? " think" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <div className="pai-hd"><img src={MARCEL} alt="" /><div><b>{head}</b><small>Marcel · here with you</small></div></div>
      <div className="pai-plan"><span>Your plan</span><b>{day ? `${usdR(day)} a day` : "Not chosen yet"}</b><button type="button" onClick={onPlan}>{day ? "Change" : "Choose"}</button></div>
      <div className="pai-acts">{acts.map((a, i) => <button key={a.label} type="button" className={`${i === 0 ? "pri" : ""}${hit === i && busy ? " hit" : ""}`} disabled={busy} onClick={a.run}><span>{a.label}<small>{a.sub}</small></span><i aria-hidden="true">&rarr;</i></button>)}</div>
      {busy && <div className="pai-wait" aria-live="polite">Marcel is thinking<i /><i /><i /></div>}
      {ans && <div className="pai-ans" aria-live="polite">
        {ans.text && <p>{ans.text}</p>}
        {!!ans.cards?.length && <div className="pai-cards">{ans.cards.map(c => <a key={c.url} href={c.url}>{c.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={c.image} alt="" />}<b>{c.title}</b><em>{c.price}</em></a>)}</div>}
        {!!ans.chips?.length && <div className="pai-chips">{ans.chips.map(c => <button key={c} type="button" onClick={() => void ask(c)}>{c}</button>)}</div>}
        <button type="button" className="pai-more" onClick={() => { close(); window.dispatchEvent(new Event("mk-marcel-open")); }}>Keep talking with Marcel</button>
      </div>}
      <form className="pai-ask" onSubmit={e => { e.preventDefault(); void ask(text); }}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Something else? Ask Marcel…" aria-label="Ask Marcel" maxLength={1000} />
        <button disabled={busy || !text.trim()} aria-label="Send">&rarr;</button>
      </form>
    </div>
  );
}
