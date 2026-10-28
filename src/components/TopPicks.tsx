"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSetting, saveStone, diamondsUrl, type Setting, type Stone } from "@/lib/setting";
import { baseShape } from "@/lib/setting";

const usd = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
type Item = { id: string; vendor: number; stock: string; shape: string; carat: number; color: string | null; clarity: string | null; cut: string | null; lab: string; image: string; price: number; fancy: string | null; fancyColor?: string | null };

/** Engagement-ring page: Mia's three best-value 2–3 ct stones in the shape (and fancy colour) chosen on the page.
 *  Tap one → the setting and the stone are saved and the pair opens on the diamond page for review (not the bag). */
export default function TopPicks({ setting, color }: { setting: Setting; color?: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Item[] | null>(null);
  const shape = baseShape(setting.shape);
  useEffect(() => {
    let dead = false; setItems(null);
    const q = color
      ? `/api/fancy?${new URLSearchParams({ color, shapes: shape, caratFrom: "2", caratTo: "3", sort: "price_asc", page: "1" })}`
      : `/api/diamonds?${new URLSearchParams({ shapes: shape, caratFrom: "2", caratTo: "3", colorFrom: "D", colorTo: "F", clarityFrom: "FL", clarityTo: "VS1", sort: "price_asc", page: "1" })}`;
    fetch(q).then(r => r.json()).then(j => { if (!dead) setItems(((j && j.items) || []).slice(0, 3)); }).catch(() => { if (!dead) setItems([]); });
    return () => { dead = true; };
  }, [shape, color]);
  if (items && items.length === 0) return null;
  const pick = (d: Item) => {
    saveSetting(setting);
    const s: Stone = { vendor: d.vendor, stock: d.stock, shape: d.shape, carat: d.carat, color: d.color, clarity: d.clarity, cut: d.cut, lab: d.lab, image: d.image, price: d.price, fancy: d.fancy };
    saveStone(s); // review the pair first (diamond + setting), never straight into the bag
    router.push(`/diamonds/${d.vendor}-${encodeURIComponent(d.stock)}`);
  };
  return (
    <div className="tp">
      <div className="tp-h"><span className="tp-ai"><i /><i />Top AI picks</span><span className="tp-sub">2–3 ct {shape.toLowerCase()}{color ? ` · ${color.toLowerCase()}` : ""} · Mia&rsquo;s best value</span></div>
      <div className="tp-row">
        {(items || [null, null, null]).map((d, i) => d ? (
          <button key={d.id} type="button" className="tp-card" onClick={() => pick(d)}>
            <span className="tp-img"><img src={d.image} alt="" loading="lazy" /></span>
            <b>{d.carat.toFixed(2)} ct</b>
            <span>{[d.fancyColor || d.color, d.clarity].filter(Boolean).join(" · ")}{d.cut ? ` · ${d.cut.replace(/^Excellent$/i, "Ex")}` : ""}</span>
            <em>+{usd(d.price)}</em>
          </button>
        ) : <span key={i} className="tp-card tp-skel" aria-hidden="true" />)}
      </div>
      <button type="button" className="tp-more" onClick={() => { saveSetting(setting); router.push(diamondsUrl(setting.shape, color)); }}>View more {shape.toLowerCase()} diamonds →</button>
    </div>
  );
}
