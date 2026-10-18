"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { clearSetting, loadSetting, saveSetting, settingFrom, type Setting } from "@/lib/setting";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

/** "Your setting" on the diamonds page. When the customer changes the stone shape, the ring changes to the same design in that shape. */
export default function SettingBar() {
  const shape = useSearchParams().get("style") || "";
  const [s, setS] = useState<Setting | null>(null);
  const [note, setNote] = useState("");
  const busy = useRef(false);

  const sync = useCallback(() => setS(loadSetting()), []);
  useEffect(() => { sync(); window.addEventListener("mk-setting", sync); return () => window.removeEventListener("mk-setting", sync); }, [sync]);

  useEffect(() => {
    const cur = loadSetting();
    if (!cur || !shape || cur.shape === shape || busy.current) { if (cur && cur.shape === shape) setNote(""); return; }
    busy.current = true;
    fetch(`/api/setting?${new URLSearchParams({ ns: cur.ns, shape, metal: cur.metal })}`).then(r => r.json()).then(j => {
      if (j.item) { saveSetting(settingFrom(cur, j.item)); setNote(""); }
      else setNote(`This design is not made in ${shape}. You can keep browsing ${shape} diamonds and choose a different setting afterwards.`);
    }).catch(() => {}).finally(() => { busy.current = false; });
  }, [shape]);

  if (!s) return null;
  return (
    <div className="sbar2" aria-label="Your setting">
      <div className="sbar2-in">
        {s.image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={`${s.image}${s.image.includes("?") ? "&" : "?"}width=200`} alt="" />}
        <div><small>Your setting</small><b>{s.title}</b><span>{s.karat ? `${s.karat} ` : ""}{s.metal} · {usd(s.price)}</span></div>
        <Link href={`/products/${s.handle}`}>Change</Link>
        <button type="button" onClick={() => { clearSetting(); setNote(""); }} aria-label="Remove setting">Remove</button>
      </div>
      {note && <p className="sbar2-note">{note}</p>}
    </div>
  );
}
