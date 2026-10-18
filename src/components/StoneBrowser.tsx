"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DiamondsBrowser from "./DiamondsBrowser";
import FancyBrowser from "./FancyBrowser";
import StoneSwatch from "./StoneSwatch";

const COLORS = [{ label: "White", key: "" }, { label: "Yellow", key: "Yellow" }, { label: "Pink", key: "Pink" }, { label: "Blue", key: "Blue" }, { label: "Green", key: "Green" }];

/** The diamonds page: one stone-colour row on top; white diamonds get the 4C filters, a fancy colour gets the intensity filters. */
export default function StoneBrowser({ swatches = {} }: { swatches?: Record<string, string> }) {
  const sp = useSearchParams(), router = useRouter(), path = usePathname();
  const color = COLORS.some(c => c.key && c.key === sp.get("color")) ? (sp.get("color") as string) : "";
  const pick = (k: string) => {
    const q = new URLSearchParams(window.location.search);
    if (k) q.set("color", k); else q.delete("color");
    // the two browsers keep different filters in the address bar; clear them when the colour changes
    ["c", "p", "int", "sh", "sort", "col", "cl", "cut"].forEach(x => q.delete(x));
    router.replace(q.toString() ? `${path}?${q}` : path, { scroll: false });
  };
  return (
    <>
      <section className="shapes sc" aria-label="Stone colour">
        <div className="wrap">
          <div className="sp-head"><small className="eyebrow">Stone colour</small><h2>White, or fancy colour</h2></div>
          <div className="rp-metals sc-row">{COLORS.map(c => (
            <button key={c.key} type="button" className={`rp-mt${color === c.key ? " on" : ""}`} aria-pressed={color === c.key} onClick={() => pick(c.key)}>
              <StoneSwatch color={c.key} src={swatches[c.key]} />{c.label}</button>))}</div>
        </div>
      </section>
      {color ? <FancyBrowser embedded /> : <DiamondsBrowser />}
    </>
  );
}
