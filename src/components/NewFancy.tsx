import Image from "next/image";
import Link from "next/link";
import { newFancy } from "@/lib/data";

/** "NEW" statement block between the categories and House codes: one portrait on the page's own blue, big type, one link to Fancy Colors. */
export default function NewFancy() {
  return (
    <section className="sec nf" id="new" aria-label="New: Fancy colors">
      <div className="wrap"><div className="nf-card">
        <div className="nf-txt">
          <h2 className="nf-h">Fancy<br />colors.</h2>
          <p className="nf-sub">One yellow stone. Zero apologies. Pink, blue, yellow and green lab-grown diamonds, IGI certified.</p>
          <Link href="/fancy-colors" className="pill nf-cta">Shop fancy colors</Link>
        </div>
        <div className="nf-img"><Image src={newFancy.img} alt="Fancy yellow cushion diamond ring" fill sizes="(max-width:767px) 92vw, 50vw" quality={82} /></div>
        <span className="nf-bug" aria-hidden="true">NEW</span>
      </div></div>
    </section>
  );
}
