"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/* The passage into Engagement Rings (approved 2026-11-08, "Z1 · Rhythm" on the airy yellow L3). Any click on a link to
   /engagement-rings: a light yellow screen rises, his six ring drawings cut one to the next at mixed sizes and places with our M
   between them (black ink, no blue, no words), and it lifts off the rings page. The page loads underneath while it plays. */
const M_W = 866, M_H = 627;
type Lay = [number, number, number, number, number][]; // [drawing, x%, y%, height%, rotate]
/* one passage per category, same rhythm, same airy yellow, black ink, no words:
   the rings (approved 2026-11-08, Z1) and the necklaces (approved 2026-11-08, N3 — each drawing swings in like a pendant) */
const PASSAGES: Record<string, { set: string; label: string; swing?: boolean; roll?: boolean; stamp?: boolean; seq?: [string, number][]; aspect: number[]; d: Lay; p: Lay }> = {
  "/engagement-rings": { set: "r", label: "The rings", aspect: [.75, .75, .75, .75, .75, .75],
    d: [[0, 50, 52, 74, 0], [1, 24, 56, 42, -6], [2, 74, 48, 58, 4], [3, 50, 50, 34, 0], [4, 30, 48, 62, -3], [5, 72, 54, 44, 6]],
    p: [[0, 50, 52, 64, 0], [1, 32, 40, 34, -6], [2, 62, 58, 46, 4], [3, 50, 50, 30, 0], [4, 40, 50, 52, -3], [5, 60, 52, 40, 6]] },
  "/necklaces": { set: "n", label: "The necklaces", swing: true, aspect: [1.174, 1.115, 1.03, 0.775, 0.704, 1.04],
    d: [[0, 50, 52, 64, 0], [1, 26, 56, 40, -6], [2, 72, 48, 56, 4], [3, 50, 50, 34, 0], [4, 30, 50, 64, -3], [5, 70, 54, 44, 6]],
    p: [[0, 50, 50, 30, 0], [1, 38, 40, 22, -6], [2, 60, 58, 30, 4], [3, 50, 50, 26, 0], [4, 42, 50, 40, -3], [5, 58, 52, 26, 6]] },
  // the bracelets (approved 2026-11-08, T3 — each drawing rolls in from the side like a tennis bracelet across a table)
  "/bracelets": { set: "b", label: "The bracelets", roll: true, aspect: [0.73, 0.616, 0.62, 0.785, 0.627, 0.545],
    d: [[0, 50, 52, 72, 0], [1, 26, 56, 42, -6], [2, 72, 48, 60, 4], [3, 50, 50, 36, 0], [4, 30, 50, 64, -3], [5, 70, 54, 46, 6]],
    p: [[0, 50, 52, 58, 0], [1, 34, 42, 32, -6], [2, 62, 56, 44, 4], [3, 50, 50, 30, 0], [4, 42, 50, 50, -3], [5, 60, 52, 40, 6]] },
  // the bands (approved 2026-11-08, K3 — each drawing is stamped on; the fries open, biggest, and are stamped twice)
  "/bands": { set: "k", label: "The bands", stamp: true, aspect: [0.624, 0.641, 0.788, 0.847, 0.563, 1.482],
    seq: [["mo", 140], ["d0", 220], ["mf", 120], ["d0", 200], ["d1", 150], ["d2", 150], ["d3", 150], ["d4", 150], ["d5", 150], ["mf", 360]],
    d: [[1, 50, 52, 82, 0], [0, 26, 54, 52, -8], [2, 72, 48, 58, 6], [3, 32, 50, 50, -4], [5, 52, 48, 30, 0], [4, 72, 54, 62, 5]],
    p: [[1, 50, 52, 62, 0], [0, 34, 44, 40, -8], [2, 62, 56, 36, 6], [3, 44, 50, 32, -4], [5, 50, 48, 16, 0], [4, 58, 52, 50, 5]] },
};
const SEQ: [string, number][] = [["mo", 140], ["d0", 170], ["d1", 140], ["mf", 140], ["d2", 160], ["d3", 130], ["d4", 160], ["d5", 150], ["mf", 360]];

export default function RingPassage({ mPath }: { mPath: string }) {
  const router = useRouter(), path = usePathname();
  const [run, setRun] = useState(0), [phone, setPhone] = useState(false), [frame, setFrame] = useState(""), [cnt, setCnt] = useState(0), [stage, setStage] = useState<"" | "in" | "out">("");
  const target = useRef<string | null>(null), dest = useRef(""), done = useRef(false), arrived = useRef(false);
  // preload the drawings once
  useEffect(() => { Object.values(PASSAGES).forEach(P => [0, 1, 2, 3, 4, 5].forEach(i => { const im = new Image(); im.src = `/media/passage/${P.set}${i}.png`; })); }, []);
  // catch clicks on links to the rings page
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a"); if (!a || a.target === "_blank") return;
      const u = new URL(a.href, location.href); if (u.origin !== location.origin || !PASSAGES[u.pathname]) return;
      if (location.pathname === u.pathname || window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
      dest.current = u.pathname;
      e.preventDefault();
      target.current = u.pathname + u.search + u.hash; done.current = false; arrived.current = false;
      setPhone(window.matchMedia("(max-width:767px)").matches); setRun(r => r + 1);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  // play
  useEffect(() => {
    if (!run || !target.current) return;
    setStage("in"); setFrame(""); setCnt(0);
    const href = target.current; window.setTimeout(() => router.push(href), 60);
    const SQ = PASSAGES[dest.current]?.seq || SEQ;
    const starts: number[] = []; let t = 340; SQ.forEach(([, ms]) => { starts.push(t); t += ms; }); const total = t;
    let raf = 0, t0 = 0, step = -1;
    const tick = (now: number) => {
      if (!t0) t0 = now; const e = now - t0;
      while (step + 1 < SQ.length && e >= starts[step + 1]) { step++; setFrame(SQ[step][0] + ":" + step); }
      setCnt(Math.min(100, Math.round(Math.max(0, e - 340) / (total - 340) * 20) * 5));
      if (e >= total) { done.current = true; if (arrived.current) setStage("out"); else window.setTimeout(() => setStage("out"), 2500); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, router]);
  // the rings page has arrived: lift as soon as the sequence is over
  useEffect(() => { if (!target.current || path !== dest.current) return; arrived.current = true; if (done.current) setStage("out"); }, [path]);
  useEffect(() => { if (stage !== "out") return; const k = window.setTimeout(() => { setStage(""); target.current = null; }, 650); return () => window.clearTimeout(k); }, [stage]);
  if (!stage) return null;
  const P = PASSAGES[dest.current] || PASSAGES["/engagement-rings"], LAY = phone ? P.p : P.d, cur = frame.split(":")[0];
  const msvg = <svg viewBox={`0 0 ${M_W} ${M_H}`} fillRule="evenodd"><path d={mPath} /></svg>;
  return (
    <div className={`rp rp-${stage}${P.swing ? " rp-swing" : ""}${P.roll ? " rp-roll" : ""}${P.stamp ? " rp-stamp" : ""}`} aria-hidden="true">
      <i className="rp-grid" /><i className="rp-x x1" /><i className="rp-x x2" /><i className="rp-x x3" /><i className="rp-x x4" />
      <span className="rp-lab l1">Meekitaz</span><span className="rp-lab l2">{P.label}</span><span className="rp-lab l3">Lab-grown &middot; IGI certified</span>
      <span className="rp-cnt">{String(cnt).padStart(3, "0")}</span>
      {LAY.map(([i, x, y, h, r], k) => <i key={k} className={`rp-d${cur === "d" + k ? " on" : ""}`} style={{ left: x + "%", top: y + "%", height: h + "%", width: `calc(${h}vh * ${P.aspect[i]})`, ["--src" as string]: `url(/media/passage/${P.set}${i}.png)`, ["--r" as string]: r + "deg" }} />)}
      <div className={`rp-m o${cur === "mo" ? " on" : ""}`}>{msvg}</div>
      <div className={`rp-m${cur === "mf" ? " on" : ""}`} key={frame}>{msvg}</div>
    </div>
  );
}
