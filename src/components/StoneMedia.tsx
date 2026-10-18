"use client";
import { useState } from "react";

export default function StoneMedia({ image, embed, alt }: { image: string; embed: string | null; alt: string }) {
  const [tab, setTab] = useState<"photo" | "360">("photo");
  return (
    <div className="dd-media">
      {tab === "360" && embed
        ? <iframe src={embed} title="360° view" scrolling="no" allow="autoplay" className="dd-vid" />
        // eslint-disable-next-line @next/next/no-img-element
        : <img src={image} alt={alt} referrerPolicy="no-referrer" />}
      {embed && (
        <div className="dd-tabs" role="tablist" aria-label="Photo or 360 view">
          <button type="button" role="tab" aria-selected={tab === "photo"} className={tab === "photo" ? "on" : ""} onClick={() => setTab("photo")}>Photo</button>
          <button type="button" role="tab" aria-selected={tab === "360"} className={tab === "360" ? "on" : ""} onClick={() => setTab("360")}>360°</button>
        </div>
      )}
    </div>
  );
}
