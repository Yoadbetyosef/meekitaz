import type { Metadata } from "next";

export const metadata: Metadata = { title: "Warranty & Care", description: "Every Meekitaz piece has a free lifetime manufacturer warranty. Add 3-Year ($250) or Lifetime ($390) care." };

const PLANS = [
  { tag: "Included free", name: "Manufacturer Warranty", price: "Free", sub: "With every purchase · lifetime",
    yes: ["Manufacturing defects repaired or replaced at no cost, for life", "One free ring resize in the first year", "If an item is no longer made, a like-for-like replacement or a refund"],
    no: ["Normal wear & tear (prong wear, bent settings)", "Cleaning, polishing, rhodium re-plating", "Lost stones (repaired at cost)"] },
  { tag: "One-time payment", name: "3-Year Care", price: "$250", sub: "Everything included, plus for 3 years",
    yes: ["Free resizing", "Cleaning & inspection every 6 months", "Refinishing, polishing & rhodium plating", "Loose or fallen stone re-setting"],
    no: ["Lost stones (replaced at cost)"] },
  { tag: "Best value", name: "Lifetime Care", price: "$390", sub: "Everything, for the life of your piece", hi: true,
    yes: ["Free resizing for life", "Cleaning & inspection every 6 months", "Refinishing, polishing & rhodium plating", "Loose or fallen stone re-setting", "Lost side stones replaced, once a year", "Accidental damage & everyday wear"],
    no: ["Center stone loss (replaced at cost)"] },
];

export default function Page() {
  return (
    <main className="wr">
      <div className="wrap wr-in">
        <small className="eyebrow">Policies</small>
        <h1 className="wr-h1">Made to last.<br />Cared for, for life.</h1>
        <p className="wr-sub">Every piece is covered for life against manufacturing defects. For everyday wear and tear, add a care package on the product page or in your bag.</p>
        <div className="wr-cols">
          {PLANS.map(p => (
            <section key={p.name} className={`wr-plan${p.hi ? " hi" : ""}`}>
              <span className="wr-tag">{p.tag}</span>
              <h2>{p.name}</h2>
              <b className="wr-price">{p.price}</b>
              <small>{p.sub}</small>
              <ul>{p.yes.map(t => <li key={t}>{t}</li>)}{p.no.map(t => <li key={t} className="no">{t}</li>)}</ul>
            </section>
          ))}
        </div>
        <div className="wr-note"><b>Good to know</b>Each care package covers one item, is a one-time payment, final sale and non-transferable. A warranty is not insurance: loss or theft of the whole piece isn’t covered, so we recommend insuring your jewelry. You send your piece to us; with a care package we cover the return shipping. Additional resizes outside a package are $25 for gold and $50 for platinum. Eternity bands and some delicate styles can’t be resized and may need to be remade. To start a claim, email <a href="mailto:sales@meekitaz.com">sales@meekitaz.com</a>.</div>
      </div>
    </main>
  );
}
