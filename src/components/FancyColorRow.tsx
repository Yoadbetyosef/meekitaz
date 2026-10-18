import Link from "next/link";

const COLORS = [{ label: "Pink", tint: "#ef8fb0" }, { label: "Blue", tint: "#6fa3e6" }, { label: "Yellow", tint: "#e9c84a" }, { label: "Green", tint: "#8fcf9a" }];

/** Fancy Colors page: pick a stone colour; the settings grid below follows it. */
export default function FancyColorRow({ color }: { color: string }) {
  return (
    <section className="shapes" aria-label="Shop by color">
      <div className="wrap">
        <div className="sp-head"><small className="eyebrow">Shop by color</small><h2>Pick your color</h2></div>
        <div className={`sp-row n4${color ? " has-sel" : ""}`}>
          {COLORS.map(c => (
            <Link key={c.label} href={color === c.label ? "/fancy-colors" : `/fancy-colors?color=${c.label}`} className={`sp${color === c.label ? " on" : ""}`} aria-pressed={color === c.label}>
              <span className="sp-img" style={{ background: c.tint }} /><b>{c.label}</b>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
