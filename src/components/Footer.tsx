import Link from "next/link";
import { categories, hushCard } from "@/lib/data";
import { legalLinks } from "@/lib/legal";
import FooterFx from "./FooterFx";

/** The closing: an all-pink footer revealed under the page. She rises from behind the giant wordmark. */
export default function Footer() {
  return (
    <footer className="mkfoot" id="mkfoot">
      <div className="mkfoot-in" id="mkfoot-in">
        {/* (2026-11-09, approved G1) the Golden Couture banner — wide on computers, tall on phones — shown whole, never cropped */}
        <picture className="foot-art"><source media="(max-width:767px)" srcSet="/media/footer/couture-m-cream.webp" /><img src="/media/footer/couture-d-cream.webp" alt="Meekitaz — drawings of a pearl heel, a scooter with a pink gift, a monkey admiring a diamond, a martini, a heron with a pear earring, an oyster with a diamond, a cloche with an emerald-cut ring and cat-eye sunglasses" /></picture>
        <section className="hush" aria-label="Quiet flex">
          <h2>Shhh.</h2>
          <p>Serious diamonds, worn lightly.</p>
          <Link href={hushCard.href} className="hush-cta">{hushCard.cta}</Link>
        </section>
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
