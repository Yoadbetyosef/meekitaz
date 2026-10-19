import Image from "next/image";
import Link from "next/link";
import { categories, hushCard } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="mkfoot" id="mkfoot">
      <div className="foot-giant" aria-hidden="true">MEEKITAZ</div>
      <section className="hush" aria-label="Quiet flex">
        <div className="hush-ph"><Image src={hushCard.img} alt="A woman with a finger to her lips, wearing yellow cushion diamond studs, a tennis necklace and an oval diamond ring" fill sizes="(max-width:767px) 100vw, 40vw" quality={80} /></div>
        <div className="hush-tx">
          <h2>Shhh.</h2>
          <p>Serious diamonds, worn lightly.</p>
          <Link href={hushCard.href} className="hush-cta">{hushCard.cta}</Link>
        </div>
      </section>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-cols">
            <div><h4>Shop</h4>{categories.map(c => <Link key={c.slug} href={`/${c.slug}`}>{c.nav}</Link>)}</div>
            <div><h4>House</h4><Link href="/#codes">House codes</Link><Link href="/#reviews">Reviews</Link><Link href="/#contact">Private clients</Link></div>
            <div><h4>Contact</h4><a href="mailto:hello@meekitaz.com">hello@meekitaz.com</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><span>Fifth Avenue, New York<br />By appointment</span></div>
          </div>
        </div>
        <div className="foot-base"><span>© {new Date().getFullYear()} Meekitaz. All rights reserved.</span><span>Lab-grown · IGI / GIA certified · 30-day returns · Lifetime warranty</span></div>
      </div>
    </footer>
  );
}
