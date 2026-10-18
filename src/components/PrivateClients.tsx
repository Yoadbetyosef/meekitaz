"use client";
import { useState } from "react";
import Image from "next/image";
import { showroomImage } from "@/lib/data";

export default function PrivateClients() {
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try { await fetch("/api/appointment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); } catch {}
    setSent(true);
  }
  return (
    <section className="sec" id="contact" aria-label="Private clients">
      <div className="wrap pc-grid">
        <div className="pc-img"><Image src={showroomImage} alt="Meekitaz showroom, Fifth Avenue" fill sizes="(max-width:767px) 100vw, 560px" quality={75} /></div>
        <div className="pc-body">
          <small className="eyebrow">Private clients</small>
          <h2>See it before you say yes</h2>
          <p>Book a private appointment in our Fifth Avenue showroom, or a virtual one with the stones on camera and the certificates on screen.</p>
          {sent ? <p className="pc-ok">Thank you. We’ll be in touch within one business day.</p> : (
            <form className="pc-form" onSubmit={submit}>
              <div className="pc-ways">
                <label className="pc-way"><input type="radio" name="way" value="showroom" defaultChecked /><span><b>Showroom</b><em>Fifth Avenue, New York</em></span></label>
                <label className="pc-way"><input type="radio" name="way" value="virtual" /><span><b>Virtual appointment</b><em>Google Meet or Zoom</em></span></label>
              </div>
              <input type="text" name="name" placeholder="Full name" required />
              <input type="email" name="email" placeholder="Email" required />
              <input type="text" name="looking" placeholder="What are you looking for? (e.g. oval, 2 ct)" />
              <button type="submit">Request an appointment</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
