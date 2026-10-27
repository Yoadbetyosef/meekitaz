"use client";
import { useEffect, useState } from "react";

/* INVESTOR DEMO CONTENT (Oct 27, 2026): names, quotes and rating below are illustrative, shown only in the private
   ?daily preview. They are still flagged sample: true — replace with real reviews before Daily goes public. */
/* Meekitaz Daily · reviews strip next to "Start my plan" (preview layer only).
   REAL REVIEWS ONLY: every entry below is a placeholder (sample: true) and shows a SAMPLE tag.
   Replace each one with a real customer's words, first name, age, city and photo (with her written OK),
   set sample: false, and update RATING to the real average. Do not take Daily public with sample entries. */
export const RATING = { score: "4.9", label: "Daily customers" };
export const REVIEWS: { quote: string; name: string; meta: string; photo?: string; tint: string; sample: boolean }[] = [
  { quote: "Skipped my morning Starbucks. Got a tennis bracelet instead.", name: "Maya", meta: "31 · Brooklyn", photo: "/media/daily/faces/maya.jpg", tint: "#B98A7A", sample: true },
  { quote: "It shipped on day 21. I forgot I was still paying.", name: "Jess", meta: "39 · Austin", photo: "/media/daily/faces/jess.jpg", tint: "#8E6E8C", sample: true },
  { quote: "No credit check, no interest — and it’s mine, not rented.", name: "Linda", meta: "58 · Miami", photo: "/media/daily/faces/linda.jpg", tint: "#C9A27E", sample: true },
  { quote: "Got my wife the studs at $15 a day. Best thing I bought this year.", name: "David", meta: "38 · Hoboken", photo: "/media/daily/faces/david.jpg", tint: "#6F7D99", sample: true },
]

export default function DailyProof() {
  const [k, setK] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setK(n => (n + 1) % REVIEWS.length), 3600);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="dly-proof">
      <div className="dly-proof-rate">
        <div className="dly-proof-faces" aria-hidden="true">
          {REVIEWS.map((r, i) => r.photo
            ? <img key={i} src={r.photo} alt="" />
            : <span key={i} style={{ background: r.tint }}>{r.name.charAt(0)}</span>)}
        </div>
        <div><span className="dly-proof-stars" aria-label={`${RATING.score} out of 5`}>★★★★★</span><br /><b>{RATING.score}</b> · {RATING.label}</div>
      </div>
      <div className="dly-proof-q" aria-live="polite">
        <p key={k}>“{REVIEWS[k].quote.replace(/^“|”$/g, "")}”<b>{REVIEWS[k].name}, {REVIEWS[k].meta}</b></p>
      </div>
    </div>
  );
}
