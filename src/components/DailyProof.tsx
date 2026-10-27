"use client";
import { useEffect, useState } from "react";

/* Meekitaz Daily · reviews strip next to "Start my plan" (preview layer only).
   REAL REVIEWS ONLY: every entry below is a placeholder (sample: true) and shows a SAMPLE tag.
   Replace each one with a real customer's words, first name, age, city and photo (with her written OK),
   set sample: false, and update RATING to the real average. Do not take Daily public with sample entries. */
export const RATING = { score: "4.9", label: "Daily customers" };
export const REVIEWS: { quote: string; name: string; meta: string; photo?: string; tint: string; sample: boolean }[] = [
  { quote: "Skipped my morning Starbucks. Got a tennis bracelet instead.", name: "Customer name", meta: "31 · Brooklyn", tint: "#B98A7A", sample: true },
  { quote: "It shipped on day 21. I forgot I was still paying.", name: "Customer name", meta: "28 · Austin", tint: "#8E6E8C", sample: true },
  { quote: "No credit check, no interest — and it’s mine, not rented.", name: "Customer name", meta: "36 · Miami", tint: "#C9A27E", sample: true },
  { quote: "$15 a day for studs I wear every single day. Easy math.", name: "Customer name", meta: "25 · Los Angeles", tint: "#6F7D99", sample: true },
];

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
            : <span key={i} className={r.sample ? "ph" : ""} style={{ background: r.tint }}>{r.name.charAt(0)}</span>)}
        </div>
        <div><span className="dly-proof-stars" aria-label={`${RATING.score} out of 5`}>★★★★★</span><br /><b>{RATING.score}</b> · {RATING.label}</div>
      </div>
      <div className="dly-proof-q" aria-live="polite">
        {REVIEWS.map((r, i) => (
          <p key={i} className={i === k ? "on" : ""}>
            “{r.quote.replace(/^“|”$/g, "")}”{r.sample && <span className="dly-proof-sample">sample</span>}
            <b>{r.name}, {r.meta}</b>
          </p>
        ))}
      </div>
    </div>
  );
}
