"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSetting, loadStone, diamondsUrl, type Setting, type Stone } from "@/lib/setting";

/** VRAI-style steps for the engagement-ring flow: 1. Setting · 2. Diamond · 3. Review. Quiet uppercase tabs, the current one underlined. */
/** onDiamond: on a setting page, step 2 does exactly what "Choose this setting" does (saves this setting and opens diamonds in its shape). */
export default function RingSteps({ step, onDiamond }: { step: 1 | 2 | 3; onDiamond?: () => void }) {
  const [setting, setSetting] = useState<Setting | null>(null);
  const [stone, setStone] = useState<Stone | null>(null);
  useEffect(() => {
    const read = () => { setSetting(loadSetting()); setStone(loadStone()); };
    read();
    window.addEventListener("mk-setting", read); window.addEventListener("mk-stone", read);
    return () => { window.removeEventListener("mk-setting", read); window.removeEventListener("mk-stone", read); };
  }, []);
  const items: { n: 1 | 2 | 3; label: string; href: string | null; done: boolean }[] = [
    { n: 1, label: "Setting", href: setting ? `/products/${setting.handle}` : "/engagement-rings", done: !!setting },
    { n: 2, label: "Diamond", href: setting ? diamondsUrl(setting.shape) : "/diamonds", done: !!stone },
    { n: 3, label: "Review", href: setting && stone ? "/build" : null, done: false },
  ];
  return (
    <nav className="rsteps" aria-label="Build your ring">
      {items.map(it => {
        const cls = it.n === step ? "on" : it.done ? "done" : "";
        const text = `${it.n}. ${it.label}`;
        if (it.n === 2 && onDiamond && step !== 2) return <button key={it.n} type="button" className={cls} onClick={onDiamond}>{text}</button>;
        return it.n === step || !it.href
          ? <span key={it.n} className={cls} aria-current={it.n === step ? "step" : undefined}>{text}</span>
          : <Link key={it.n} href={it.href} className={cls}>{text}</Link>;
      })}
    </nav>
  );
}
