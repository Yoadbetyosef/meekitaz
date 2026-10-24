"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useCart } from "./CartProvider";

/* Welcome offer pop-up: free 0.5 ct studs with a $1,000+ first order (Shopify code FREESTUDS).
   When: desktop after 10 s, 40% scroll or exit intent; phone after 12 s or 50% scroll. Once per visit.
   Closed once → back after 7 days; closed again → 30 days; signed up → never. Never over the open bag.
   After closing, a turning "Free" sticker stays bottom-left to reopen it (its × hides it for the visit). */

const KEY = "mk_fs", S_SHOWN = "mk_fs_shown", S_NOSTICK = "mk_fs_nosticker";
type Saved = { signed?: boolean; closes?: number; until?: number };
const load = (): Saved => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const save = (v: Saved) => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } };
const ss = { get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k: string) => { try { sessionStorage.setItem(k, "1"); } catch { /* */ } } };
const SKIP = [/^\/checkout/, /^\/account/, /^\/admin/, /^\/build/];

export default function FreeStuds() {
  const path = usePathname() || "/";
  const { open: bagOpen, freeStuds } = useCart();
  const [show, setShow] = useState(false);
  const [sticker, setSticker] = useState(false);
  const [phase, setPhase] = useState<"form" | "busy" | "done">("form");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [adding, setAdding] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [scale, setScale] = useState(0.78);
  const inputRef = useRef<HTMLInputElement>(null);
  const shownRef = useRef(false);
  const skip = SKIP.some(r => r.test(path));

  useEffect(() => {
    const fit = () => { const m = window.innerWidth < 768; setMobile(m); setScale(Math.min(0.78, (window.innerWidth - 48) / 1020, (window.innerHeight - 80) / 500)); };
    fit(); window.addEventListener("resize", fit); return () => window.removeEventListener("resize", fit);
  }, []);

  const open = useCallback(() => { shownRef.current = true; ss.set(S_SHOWN); setSticker(false); setShow(true); setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 650); }, []);

  // Sticker for people who closed it before (and have not signed up).
  useEffect(() => {
    const s = load();
    if (!s.signed && (s.closes || 0) > 0 && !ss.get(S_NOSTICK)) setSticker(true);
  }, []);

  // Triggers
  useEffect(() => {
    if (skip) return;
    const s = load();
    if (s.signed || (s.until && Date.now() < s.until) || ss.get(S_SHOWN) || shownRef.current) return;
    const m = window.innerWidth < 768;
    const fire = () => { if (shownRef.current || document.querySelector(".cdrawer.on, .menu.on, .menu.open")) return; open(); cleanup(); };
    const t = window.setTimeout(fire, m ? 12000 : 10000);
    const onScroll = () => { const h = document.documentElement; const p = (h.scrollTop + window.innerHeight) / h.scrollHeight; if (p >= (m ? 0.5 : 0.4) && h.scrollHeight > window.innerHeight * 1.5) fire(); };
    const onOut = (e: MouseEvent) => { if (!e.relatedTarget && e.clientY <= 0) fire(); };
    window.addEventListener("scroll", onScroll, { passive: true });
    if (!m) document.addEventListener("mouseout", onOut);
    function cleanup() { window.clearTimeout(t); window.removeEventListener("scroll", onScroll); document.removeEventListener("mouseout", onOut); }
    return cleanup;
  }, [path, skip, open]);

  const close = useCallback(() => {
    setShow(false);
    if (phase === "done") return;
    const s = load(); const closes = (s.closes || 0) + 1;
    save({ ...s, closes, until: Date.now() + (closes >= 2 ? 30 : 7) * 864e5 });
    if (!ss.get(S_NOSTICK)) setSticker(true);
  }, [phase]);

  useEffect(() => {
    if (!show) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", k); return () => document.removeEventListener("keydown", k);
  }, [show, close]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setErr("Please enter a valid email."); return; }
    setPhase("busy");
    const r = await fetch("/api/free-studs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }).catch(() => null);
    if (!r || !r.ok) { setPhase("form"); setErr("Something went wrong. Please try again."); return; }
    save({ ...load(), signed: true }); setSticker(false); setPhase("done");
  }

  async function addStuds() {
    setAdding(true); const r = await freeStuds(); setAdding(false);
    if (r.ok) setShow(false); else setErr("We couldn't add them right now — use code FREESTUDS at checkout.");
  }

  if (skip && !show) return null;
  return (
    <>
      {show && <div className="fs-dim" onClick={close} />}
      {show && (
        <div className={`fs-pos ${mobile ? "fs-m" : "fs-d"}`} style={mobile ? undefined : { transform: `translate(-50%,-50%) scale(${scale})` }}>
          <div className="fs-pop" role="dialog" aria-modal="true" aria-labelledby="fs-title">
            <div className="fs-bg" /><div className="fs-ph" />
            <button className="fs-x" onClick={close} aria-label="Close">×</button>
            <div className="fs-tx">
              {phase !== "done" ? (<>
                <small className="fs-eb">First order treat</small>
                <h2 id="fs-title">Free diamond studs, on us.</h2>
                <p>Leave your email and get a pair of 0.5 ct diamond studs with your first order.</p>
                <form onSubmit={submit} noValidate>
                  <input ref={inputRef} type="email" inputMode="email" autoComplete="email" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} aria-label="Your email" />
                  <button className="fs-btn" disabled={phase === "busy"}>{phase === "busy" ? "One moment…" : "Claim my studs"}</button>
                </form>
                {err && <p className="fs-err">{err}</p>}
                <p className="fs-fine">One pair per customer, with a first order of $1,000+.</p>
              </>) : (<>
                <small className="fs-eb">You&rsquo;re in ✨</small>
                <h2 id="fs-title">Your code: <span className="fs-code">FREESTUDS</span></h2>
                <p>Spend $1,000+ and your 0.5 ct studs are free. We&rsquo;ve emailed you the code too.</p>
                <button className="fs-btn" onClick={addStuds} disabled={adding}>{adding ? "Adding…" : "Add my free studs"}</button>
                {err && <p className="fs-err">{err}</p>}
                <p className="fs-fine">The studs show as $0 at checkout once your order reaches $1,000.</p>
              </>)}
            </div>
          </div>
        </div>
      )}
      {sticker && !show && !bagOpen && !skip && !/^\/diamonds/.test(path) && (
        <div className="fs-stk">
          <button className="fs-stk-b" onClick={open} aria-label="Free diamond studs offer">
            <svg viewBox="0 0 108 108" aria-hidden="true"><defs><path id="fs-c" d="M54,54 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs><circle cx="54" cy="54" r="54" fill="#EFC5CA" /><text fontFamily="var(--body)" fontWeight="700" fontSize="9.5" letterSpacing="3.1" fill="#1C1A1B"><textPath href="#fs-c">FREE DIAMOND STUDS • FIRST ORDER • </textPath></text></svg>
            <span>Free</span>
          </button>
          <button className="fs-stk-x" onClick={() => { ss.set(S_NOSTICK); setSticker(false); }} aria-label="Hide">×</button>
        </div>
      )}
    </>
  );
}
