import Image from "next/image";
import Link from "next/link";
import { categories, hushCard } from "@/lib/data";
import { legalLinks } from "@/lib/legal";
import FooterFx from "./FooterFx";
import Logo from "./Logo";

/** The closing: an all-pink footer revealed under the page. She rises from behind the giant wordmark. */
export default function Footer() {
  return (
    <footer className="mkfoot" id="mkfoot">
      <div className="mkfoot-in" id="mkfoot-in">
        <div className="foot-mark" aria-hidden="true" />
        <div className="hush-ph"><Image src={hushCard.img} alt="A woman with a finger to her lips, wearing yellow cushion diamond studs, a tennis necklace and an oval diamond ring" fill sizes="(max-width:767px) 130vw, 40vw" quality={80} /></div>
        <section className="hush" aria-label="Quiet flex">
          <h2>Shhh.</h2>
          <p>Serious diamonds, worn lightly.</p>
          <Link href={hushCard.href} className="hush-cta">{hushCard.cta}</Link>
        </section>
        <div className="foot-giant" aria-hidden="true"><Logo className="foot-logo" /></div>
        <div className="mkf-under">
          <nav className="mkf-l" aria-label="Shop">{categories.map(c => <Link key={c.slug} href={`/${c.slug}`}>{c.nav}</Link>)}</nav>
          <p className="mkf-base">&copy; {new Date().getFullYear()} Meekitaz &middot; New York</p>
          <div className="mkf-r">
            <nav aria-label="House"><Link href="/#codes">House codes</Link><Link href="/#reviews">Reviews</Link><Link href="/#contact">Private clients</Link></nav>
            <nav aria-label="Contact"><a href="mailto:sales@meekitaz.com">sales@meekitaz.com</a><a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a></nav>
            <nav aria-label="Legal">{legalLinks.map(l => <Link key={l.href} href={l.href}>{l.label}</Link>)}</nav>
          </div>
        </div>
      </div>
      <FooterFx />
    </footer>
  );
}
