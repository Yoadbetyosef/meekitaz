"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { showroomImage } from "@/lib/data";

export default function PrivateClients() {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [who, setWho] = useState("");
  const done = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(1); // phones: 1 = choose, 2 = details (desktop shows everything)
  const [way, setWay] = useState("showroom");
  useEffect(() => { if (sent) done.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [sent]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setErr(false); setBusy(true);
    try {
      const r = await fetch("/api/appointment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) { setErr(true); setBusy(false); return; }
    } catch { setErr(true); setBusy(false); return; }
    setWho(String(data.name || "").trim().split(/\s+/)[0] || "");
    setBusy(false); setSent(true);
  }
  return (
    <section className="sec" id="contact" aria-label="Private clients">
      <div className="wrap"><div className="pc-grid">
        <div className="pc-img"><Image src={showroomImage} alt="Meekitaz showroom, Fifth Avenue" fill sizes="(max-width:767px) 100vw, 1200px" quality={78} /></div>
        <div className="pc-body">
          <small className="eyebrow">Private clients</small>
          <h2>See it before you say yes</h2>
          <p>Book a private appointment in our Fifth Avenue showroom, or a virtual one with the stones on camera and the certificates on screen.</p>
          {sent ? (
            <div className="pc-done" ref={done} role="status" aria-live="polite">
              <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" /><path d="M14 25l7 7 13-15" /></svg>
              <h3>Thank you{who ? `, ${who}` : ""}.</h3>
              <p>Your request is in. We will reach out to you within one business day to set up your {way === "virtual" ? "virtual appointment" : "visit to the showroom"}.</p>
            </div>
          ) : (
            <form className={`pc-form pc-step${step}`} onSubmit={submit}>
              <div className="pc-prog" aria-hidden="true"><i className="on" /><i className={step === 2 ? "on" : ""} /></div>
              <div className="pc-ways">
                <label className="pc-way"><input type="radio" name="way" value="showroom" checked={way === "showroom"} onChange={() => setWay("showroom")} /><span><b>Showroom</b><em>Fifth Avenue, New York</em></span></label>
                <label className="pc-way"><input type="radio" name="way" value="virtual" checked={way === "virtual"} onChange={() => setWay("virtual")} /><span><b>Virtual appointment</b><em>Google Meet or Zoom</em></span></label>
              </div>
              <button type="button" className="pc-next" onClick={() => setStep(2)}>Continue</button>
              <div className="pc-fields">
                <button type="button" className="pc-back" onClick={() => setStep(1)}>← {way === "virtual" ? "Virtual appointment" : "Showroom, Fifth Avenue"}</button>
                <input type="text" name="name" placeholder="Full name" required />
                <input type="email" name="email" placeholder="Email" required />
                <input type="text" name="looking" placeholder="What are you looking for? (e.g. oval, 2 ct)" />
                <button type="submit" disabled={busy}>{busy ? "Sending…" : "Request an appointment"}</button>
                {err && <p className="pc-err" role="alert">That did not go through. Please email us at <a href="mailto:sales@meekitaz.com">sales@meekitaz.com</a> and we will book you in.</p>}
              </div>
            </form>
          )}
        </div>
      </div></div>
    </section>
  );
}
