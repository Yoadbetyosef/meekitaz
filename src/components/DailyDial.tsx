"use client";
/** The ring inside a circle that fills as it becomes hers. */
export default function DailyDial({ pct, image }: { pct: number; image: string }) {
  const r = 120, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="ddial">
      <svg viewBox="0 0 280 280" aria-hidden="true">
        <defs><linearGradient id="ddg" x1="0" x2="1"><stop offset="0" stopColor="#F7D3DA" /><stop offset=".5" stopColor="#C9A7EB" /><stop offset="1" stopColor="#E8738A" /></linearGradient></defs>
        <circle cx="140" cy="140" r={r} fill="none" stroke="#EFE7DD" strokeWidth="16" />
        <circle cx="140" cy="140" r={r} fill="none" stroke="url(#ddg)" strokeWidth="16" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} style={{ transition: "stroke-dashoffset .35s ease" }} />
      </svg>
      <span className="ph" style={{ backgroundImage: `url(${image})` }} />
      <span className="pct">{p >= 100 ? "All yours" : `${p}% yours`}</span>
    </div>
  );
}
