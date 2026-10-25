"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";
import type { Setting, Stone } from "@/lib/setting";

/* Mia — the Meekitaz diamond assistant (AI, hands over to a person when needed). Ivory style, bottom-right.
   Live for every visitor (?mia=0 hides it in one browser). */
const MIA = "https://cdn.shopify.com/s/files/1/0841/2905/4957/files/meekitaz-mia.png?v=1792885749";
const M_PATH = "M89.7,41.7 L84.9,46.6 L83.0,48.3 L74.5,54.6 L70.1,58.4 L67.2,61.6 L65.2,64.3 L64.2,66.3 L63.2,68.8 L62.7,71.8 L62.7,75.9 L63.0,78.0 L63.9,80.8 L65.3,83.2 L66.8,84.9 L68.3,85.8 L69.1,86.1 L71.1,86.1 L75.5,85.4 L82.2,83.4 L86.5,81.7 L91.1,79.2 L94.9,76.6 L97.8,73.7 L99.3,71.2 L100.0,68.4 L100.0,66.5 L99.7,64.6 L98.6,61.8 L97.7,60.1 L92.6,52.8 L90.9,49.6 L90.1,47.3 L89.7,45.6Z M10.3,41.7 L10.3,45.8 L9.9,47.5 L9.0,50.0 L7.0,53.4 L2.1,60.4 L0.6,63.8 L0.1,65.8 L0.0,67.8 L0.5,70.3 L1.0,71.7 L3.3,75.0 L6.2,77.6 L10.1,80.2 L15.0,82.6 L20.9,84.6 L26.2,85.7 L31.1,86.2 L33.0,85.5 L34.8,83.5 L36.2,81.1 L36.8,79.6 L37.5,76.1 L37.5,72.4 L36.8,68.7 L35.6,65.7 L32.8,61.6 L28.4,56.9 L25.7,54.5 L19.3,50.0 L15.1,46.6Z M7.0,29.1 L7.2,31.9 L8.0,35.0 L9.5,38.0 L11.3,40.5 L13.8,43.1 L17.2,46.2 L22.2,50.1 L25.7,52.5 L13.9,37.2 L11.0,32.1 L10.2,29.8 L10.1,28.1 L10.4,27.0 L11.7,25.8 L13.0,25.5 L15.4,25.6 L18.7,26.3 L21.4,27.2 L25.0,29.0 L27.2,30.3 L30.3,32.9 L32.4,35.0 L34.9,38.0 L36.9,40.6 L40.0,45.6 L45.4,56.4 L47.0,58.2 L47.9,58.8 L49.4,59.4 L50.4,59.4 L51.8,58.9 L53.0,58.1 L54.1,56.8 L55.0,55.4 L59.5,46.3 L63.8,39.6 L66.5,36.2 L69.9,32.7 L74.0,29.5 L77.1,27.8 L79.9,26.6 L82.7,25.8 L85.5,25.4 L87.5,25.5 L88.8,25.9 L89.7,26.9 L90.1,27.9 L90.1,29.2 L89.2,31.7 L86.9,36.0 L82.8,41.8 L74.2,52.7 L81.4,47.3 L85.5,43.8 L88.1,41.2 L91.1,37.2 L92.1,35.1 L92.7,33.3 L93.1,31.4 L93.1,28.4 L92.4,25.5 L91.0,22.6 L89.2,20.2 L86.5,17.5 L82.8,15.3 L79.7,14.3 L76.3,13.8 L72.4,14.1 L70.4,14.5 L68.0,15.4 L65.1,17.2 L61.9,20.2 L59.4,23.5 L53.2,36.4 L51.7,39.0 L50.2,41.1 L48.7,39.0 L46.6,35.3 L41.2,23.9 L39.3,21.0 L36.4,17.9 L34.9,16.7 L32.7,15.4 L29.9,14.4 L26.8,13.8 L23.5,13.8 L19.5,14.6 L15.6,16.4 L13.2,18.1 L11.1,20.2 L9.8,21.8 L7.9,25.5Z";
const Mark = ({ fill = "#1C1A1B" }: { fill?: string }) => <svg viewBox="0 0 100 100" aria-hidden="true"><path fill={fill} fillRule="evenodd" d={M_PATH} /></svg>;
type Card = { title: string; price: string; url: string; image?: string };
type Msg = { role: "user" | "assistant" | "agent"; content: string; cards?: Card[]; chips?: string[] };
const K_CONV = "mk_mia_conv", K_VIS = "mk_mia_vis", K_TEST = "mk_mia_test";
const ls = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* */ } }, del: (k: string) => { try { localStorage.removeItem(k); } catch { /* */ } } };
const SKIP = [/^\/checkout/, /^\/admin/];

export default function MiaChat() {
  const path = usePathname() || "/";
  const { open: bagOpen, add, addRing, setOpen: setBag } = useCart();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [human, setHuman] = useState(false);
  const conv = useRef<string | null>(null);
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Live for everyone. ?mia=0 hides her in this browser (for testing), ?mia=1 brings her back.
    const q = new URLSearchParams(window.location.search).get("mia");
    if (q === "0") ls.set(K_TEST, "off"); if (q === "1") ls.del(K_TEST);
    setEnabled(ls.get(K_TEST) !== "off");
    if (!ls.get(K_VIS)) ls.set(K_VIS, Math.random().toString(36).slice(2) + Date.now().toString(36));
    conv.current = ls.get(K_CONV);
  }, [path]);

  // Load the conversation when opened, then check for replies from the team every 8 s.
  useEffect(() => {
    if (!open || !conv.current) return;
    let alive = true;
    const load = async () => {
      const r = await fetch(`/api/mia?c=${conv.current}`).then(x => x.json()).catch(() => null);
      if (!alive || !r?.messages) return;
      setHuman(r.status === "human");
      setMsgs(r.messages.map((m: { role: Msg["role"]; content: string; meta?: { cards?: Card[]; chips?: string[] } }) => ({ role: m.role, content: m.content, cards: m.meta?.cards, chips: m.meta?.chips })));
    };
    load(); const t = setInterval(load, 8000);
    return () => { alive = false; clearInterval(t); };
  }, [open]);

  useEffect(() => { body.current?.scrollTo({ top: 1e6, behavior: "smooth" }); }, [msgs, busy]);

  async function send(t: string) {
    const m = t.trim(); if (!m || busy) return;
    setText(""); setMsgs(x => [...x.map(y => ({ ...y, chips: undefined })), { role: "user", content: m }]); setBusy(true);
    const r = await fetch("/api/mia", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: m, conversationId: conv.current, visitorId: ls.get(K_VIS), page: path }) }).then(x => x.json()).catch(() => null);
    setBusy(false);
    if (!r || r.error) { setMsgs(x => [...x, { role: "assistant", content: "Sorry, I'm having a little trouble — please try again in a moment." }]); return; }
    if (r.id) { conv.current = r.id; ls.set(K_CONV, r.id); }
    if (r.human) setHuman(true);
    if (r.reply) setMsgs(x => [...x, { role: "assistant", content: r.reply, cards: r.products, chips: r.chips }]);
    // Mia acts on the site: put a ring (setting + diamond) or a product in the bag, or open the bag for checkout.
    for (const a of (r.actions || []) as { type: string; setting?: Setting; stone?: Stone; variantId?: string }[]) {
      if (a.type === "add_ring" && a.setting && a.stone) addRing(a.setting, a.stone);
      else if (a.type === "add" && a.variantId) { await add(a.variantId); setBag(true); }
      else if (a.type === "open_bag") setBag(true);
    }
    if (r.handoff) setHuman(true);
  }

  if (!enabled || SKIP.some(s => s.test(path))) return null;
  return (
    <>
      {open && (
        <div className="mia-w" role="dialog" aria-label="Chat with Mia">
          <div className="mia-hd">
            <div className="mia-av"><img src={MIA} alt="" /><span className="mia-mb"><Mark /></span></div>
            <div><h4>Mia · Meekitaz</h4><small><i />{human ? "A person from our team is joining" : "Your diamond assistant · replies instantly"}</small></div>
            <button className="mia-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
          </div>
          <div className="mia-body" ref={body}>
            <div className="mia-intro"><img src={MIA} alt="" /><div><b>Hi, I&rsquo;m Mia ✨</b><span>I know every ring we make. Ask me anything — a real person can join anytime.</span></div></div>
            {msgs.length === 0 && <div className="mia-chips">{["Engagement rings", "Free studs offer", "Shipping & returns"].map(c => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>}
            {msgs.map((m, i) => (
              <div key={i} className="mia-g">
                <div className={`mia-m ${m.role === "user" ? "u" : "a"}`}>{m.role === "agent" && <em>Meekitaz team · </em>}{m.content}</div>
                {!!m.cards?.length && <div className="mia-prods">{m.cards.map(c => <a key={c.url} className="mia-pc" href={c.url}>{c.image && <img src={c.image} alt="" />}<div><b>{c.title}</b>{c.price}</div></a>)}</div>}
                {i === msgs.length - 1 && !!m.chips?.length && <div className="mia-chips">{m.chips.map(c => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>}
              </div>
            ))}
            {busy && <div className="mia-typing"><i /><i /><i /></div>}
          </div>
          <form className="mia-ft" onSubmit={e => { e.preventDefault(); send(text); }}>
            <input value={text} onChange={e => setText(e.target.value)} placeholder="Ask about a ring, sizes, shipping…" aria-label="Message" maxLength={1000} />
            <button disabled={busy || !text.trim()} aria-label="Send">↑</button>
          </form>
          <div className="mia-legal">AI assistant · a real person can join anytime</div>
        </div>
      )}
      {!bagOpen && (
        <button className={`mia-launch${open ? " on" : ""}`} onClick={() => setOpen(o => !o)} aria-label={open ? "Close chat" : "Chat with Mia"}>
          <img src={MIA} alt="" /><span className="mia-mb"><Mark /></span>
        </button>
      )}
    </>
  );
}
