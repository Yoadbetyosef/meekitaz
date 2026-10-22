import Image from "next/image";
import Link from "next/link";
import { categories, hushCard } from "@/lib/data";
import { legalLinks } from "@/lib/legal";
import FooterFx from "./FooterFx";

/** The closing: an all-pink footer revealed under the page. She rises from behind the giant wordmark. */
export default function Footer() {
  return (
    <footer className="mkfoot" id="mkfoot">
      <div className="mkfoot-in" id="mkfoot-in">
        <div className="hush-ph"><Image src={hushCard.img} alt="A woman with a finger to her lips, wearing yellow cushion diamond studs, a tennis necklace and an oval diamond ring" fill sizes="(max-width:767px) 92vw, 40vw" quality={80} /></div>
        <section className="hush" aria-label="Quiet flex">
          <h2>Shhh.</h2>
          <p>Serious diamonds, worn lightly.</p>
          <Link href={hushCard.href} className="hush-cta">{hushCard.cta}</Link>
        </section>
        <div className="foot-giant" aria-hidden="true">MEEKITAZ<i>&copy;</i></div>
        <div className="mkf-under">
          <nav aria-label="Shop">{categories.map(c => <Link key={c.slug} href={`/${c.slug}`}>{c.nav}</Link>)}</nav>
          <nav aria-label="House"><Link href="/#codes">House codes</Link><Link href="/#reviews">Reviews</Link><Link href="/#contact">Private clients</Link><a href="mailto:hello@meekitaz.com">hello@meekitaz.com</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></nav>
          <nav aria-label="Legal">{legalLinks.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav>
          <p className="mkf-base">&copy; {new Date().getFullYear()} Meekitaz &middot; Fifth Avenue, New York, by appointment &middot; Lab-grown, IGI / GIA certified</p>
        </div>
      </div>
      <FooterFx />
    </footer>
  );
}
