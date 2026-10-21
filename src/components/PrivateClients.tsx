"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { showroomImage } from "@/lib/data";
import { brand } from "@/brands";

export default function PrivateClients() {
  const media = useRef<HTMLDivElement>(null);
  useEffect(() => { // people who ask their device for reduced motion get the still image, not the video
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) media.current?.querySelectorAll("video").forEach(v => { v.pause(); v.removeAttribute("autoplay"); });
  }, []);
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState(1); // phones: 1 = choose, 2 = details (desktop shows everything)
  const [way, setWay] = useState("showroom");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try { await fetch("/api/appointment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); } catch {}
    setSent(true);
  }
  return (
    <section className="sec" id="contact" aria-label="Private clients">
      <div className="wrap"><div className="pc-grid">
        <div className="pc-img" ref={media}>{brand.showroomImg?.video ? (<>
          <video className="pc-ph-d" src={brand.showroomImg.video.desktop} poster={brand.showroomImg.desktop} muted loop autoPlay playsInline preload="metadata" aria-label={brand.showroomImg.alt} />
          <video className="pc-ph-m" src={brand.showroomImg.video.mobile} poster={brand.showroomImg.mobile} muted loop autoPlay playsInline preload="metadata" aria-label={brand.showroomImg.alt} />
        </>) : brand.showroomImg ? (<>
          <Image className="pc-ph-d" src={brand.showroomImg.desktop} alt={brand.showroomImg.alt} fill sizes="(max-width:767px) 1px, 1200px" quality={78} />
          <Image className="pc-ph-m" src={brand.showroomImg.mobile} alt={brand.showroomImg.alt} fill sizes="(max-width:767px) 100vw, 1px" quality={78} />
        </>) : <Image src={showroomImage} alt={`${brand.display} showroom, ${brand.showroom.short}`} fill sizes="(max-width:767px) 100vw, 1200px" quality={78} />}</div>
        <div className="pc-body">
          <small className="eyebrow">Private clients</small>
          <h2>See it before you say yes</h2>
          <p>Book a private appointment in our {brand.showroom.in} showroom, or a virtual one with the stones on camera and the certificates on screen.</p>
          {sent ? <p className="pc-ok">Thank you. We’ll be in touch within one business day.</p> : (
            <form className={`pc-form pc-step${step}`} onSubmit={submit}>
              <div className="pc-prog" aria-hidden="true"><i className="on" /><i className={step === 2 ? "on" : ""} /></div>
              <div className="pc-ways">
                <label className="pc-way"><input type="radio" name="way" value="showroom" checked={way === "showroom"} onChange={() => setWay("showroom")} /><span><b>Showroom</b><em>{brand.showroom.line}</em></span></label>
                <label className="pc-way"><input type="radio" name="way" value="virtual" checked={way === "virtual"} onChange={() => setWay("virtual")} /><span><b>Virtual appointment</b><em>Google Meet or Zoom</em></span></label>
              </div>
              <button type="button" className="pc-next" onClick={() => setStep(2)}>Continue</button>
              <div className="pc-fields">
                <button type="button" className="pc-back" onClick={() => setStep(1)}>← {way === "virtual" ? "Virtual appointment" : `Showroom, ${brand.showroom.short}`}</button>
                <input type="text" name="name" placeholder="Full name" required />
                <input type="email" name="email" placeholder="Email" required />
                <input type="text" name="looking" placeholder="What are you looking for? (e.g. oval, 2 ct)" />
                <button type="submit">Request an appointment</button>
              </div>
            </form>
          )}
        </div>
      </div></div>
    </section>
  );
}
