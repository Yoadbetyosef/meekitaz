"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { loadSetting, loadStone, diamondsUrl, type Setting, type Stone } from "@/lib/setting";

/** VRAI-style steps for the engagement-ring flow: 1. Setting · 2. Diamond · 3. Review. Quiet uppercase tabs, the current one underlined. */
export default function RingSteps({ step }: { step: 1 | 2 | 3 }) {
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
        return it.n === step || !it.href
          ? <span key={it.n} className={cls} aria-current={it.n === step ? "step" : undefined}>{text}</span>
          : <Link key={it.n} href={it.href} className={cls}>{text}</Link>;
      })}
    </nav>
  );
}
