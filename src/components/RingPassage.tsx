"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/* The passage into Engagement Rings (approved 2026-11-08, "Z1 · Rhythm" on the airy yellow L3). Any click on a link to
   /engagement-rings: a light yellow screen rises, his six ring drawings cut one to the next at mixed sizes and places with our M
   between them (black ink, no blue, no words), and it lifts off the rings page. The page loads underneath while it plays. */
const M_W = 866, M_H = 627;
// [drawing, x%, y%, height%, rotate] — computers, then phones
const LAY_D: [number, number, number, number, number][] = [[0, 50, 52, 74, 0], [1, 24, 56, 42, -6], [2, 74, 48, 58, 4], [3, 50, 50, 34, 0], [4, 30, 48, 62, -3], [5, 72, 54, 44, 6]];
const LAY_P: [number, number, number, number, number][] = [[0, 50, 52, 64, 0], [1, 32, 40, 34, -6], [2, 62, 58, 46, 4], [3, 50, 50, 30, 0], [4, 40, 50, 52, -3], [5, 60, 52, 40, 6]];
const SEQ: [string, number][] = [["mo", 140], ["d0", 170], ["d1", 140], ["mf", 140], ["d2", 160], ["d3", 130], ["d4", 160], ["d5", 150], ["mf", 360]];

export default function RingPassage({ mPath }: { mPath: string }) {
  const router = useRouter(), path = usePathname();
  const [run, setRun] = useState(0), [phone, setPhone] = useState(false), [frame, setFrame] = useState(""), [cnt, setCnt] = useState(0), [stage, setStage] = useState<"" | "in" | "out">("");
  const target = useRef<string | null>(null), done = useRef(false), arrived = useRef(false);
  // preload the drawings once
  useEffect(() => { [0, 1, 2, 3, 4, 5].forEach(i => { const im = new Image(); im.src = `/media/passage/r${i}.png`; }); }, []);
  // catch clicks on links to the rings page
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a"); if (!a || a.target === "_blank") return;
      const u = new URL(a.href, location.href); if (u.origin !== location.origin || u.pathname !== "/engagement-rings") return;
      if (location.pathname === "/engagement-rings" || window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;
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
    const starts: number[] = []; let t = 340; SEQ.forEach(([, ms]) => { starts.push(t); t += ms; }); const total = t;
    let raf = 0, t0 = 0, step = -1;
    const tick = (now: number) => {
      if (!t0) t0 = now; const e = now - t0;
      while (step + 1 < SEQ.length && e >= starts[step + 1]) { step++; setFrame(SEQ[step][0] + ":" + step); }
      setCnt(Math.min(100, Math.round(Math.max(0, e - 340) / (total - 340) * 20) * 5));
      if (e >= total) { done.current = true; if (arrived.current) setStage("out"); else window.setTimeout(() => setStage("out"), 2500); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, router]);
  // the rings page has arrived: lift as soon as the sequence is over
  useEffect(() => { if (!target.current || path !== "/engagement-rings") return; arrived.current = true; if (done.current) setStage("out"); }, [path]);
  useEffect(() => { if (stage !== "out") return; const k = window.setTimeout(() => { setStage(""); target.current = null; }, 650); return () => window.clearTimeout(k); }, [stage]);
  if (!stage) return null;
  const LAY = phone ? LAY_P : LAY_D, cur = frame.split(":")[0];
  const msvg = <svg viewBox={`0 0 ${M_W} ${M_H}`} fillRule="evenodd"><path d={mPath} /></svg>;
  return (
    <div className={`rp rp-${stage}`} aria-hidden="true">
      <i className="rp-grid" /><i className="rp-x x1" /><i className="rp-x x2" /><i className="rp-x x3" /><i className="rp-x x4" />
      <span className="rp-lab l1">Meekitaz</span><span className="rp-lab l2">The rings</span><span className="rp-lab l3">Lab-grown &middot; IGI certified</span>
      <span className="rp-cnt">{String(cnt).padStart(3, "0")}</span>
      {LAY.map(([i, x, y, h, r], k) => <i key={k} className={`rp-d${cur === "d" + k ? " on" : ""}`} style={{ left: x + "%", top: y + "%", height: h + "%", width: `calc(${h}vh * .75)`, ["--src" as string]: `url(/media/passage/r${i}.png)`, ["--r" as string]: r + "deg" }} />)}
      <div className={`rp-m o${cur === "mo" ? " on" : ""}`}>{msvg}</div>
      <div className={`rp-m${cur === "mf" ? " on" : ""}`} key={frame}>{msvg}</div>
    </div>
  );
}
