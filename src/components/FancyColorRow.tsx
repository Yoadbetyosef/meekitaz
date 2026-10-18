import Link from "next/link";
import StoneSwatch from "./StoneSwatch";
import { fancySwatches } from "@/lib/vdb";

const COLORS = ["Pink", "Blue", "Yellow", "Green"];

/** Fancy Colors page: pick a stone colour; the settings grid below follows it. */
export default async function FancyColorRow({ color }: { color: string }) {
  const sw = await fancySwatches();
  return (
    <section className="shapes sc" aria-label="Shop by color">
      <div className="wrap">
        <div className="sp-head"><small className="eyebrow">Shop by color</small><h2>Pick your color</h2></div>
        <div className="rp-metals sc-row">
          {COLORS.map(c => (
            <Link key={c} href={color === c ? "/fancy-colors" : `/fancy-colors?color=${c}`} className={`rp-mt${color === c ? " on" : ""}`} aria-pressed={color === c}>
              <StoneSwatch color={c} src={sw[c]} />{c}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
