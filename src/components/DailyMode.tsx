"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { DAILY } from "@/lib/daily";

/* Turns the Daily preview on for this browser only: /?daily=<code> unlocks it, /?daily=off turns it off. Everyone else sees the normal site. */
const Ctx = createContext(false);
export const useDaily = () => useContext(Ctx);
export default function DailyMode({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get("daily");
    const read = () => setOn(document.cookie.split("; ").some(c => c === `${DAILY.cookie}=1`));
    if (q === "off") { document.cookie = `${DAILY.cookie}=; path=/; max-age=0`; read(); return; }
    if (q) { fetch(`/api/daily?code=${encodeURIComponent(q)}`).then(r => r.json()).then(j => { if (j.ok) document.cookie = `${DAILY.cookie}=1; path=/; max-age=${60 * 60 * 24 * 60}; samesite=lax`; read(); }).catch(read); return; }
    read();
  }, []);
  useEffect(() => { document.documentElement.classList.toggle("daily-on", on); }, [on]);
  return (
    <Ctx.Provider value={on}>
      {children}
      {on && <a className="daily-flag" href="/?daily=off" title="Turn the preview off">Preview · Meekitaz Daily ✕</a>}
    </Ctx.Provider>
  );
}
