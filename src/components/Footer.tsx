import Image from "next/image";
import Link from "next/link";
import { categories, hushCard } from "@/lib/data";
import { legalLinks } from "@/lib/legal";
import FooterFx from "./FooterFx";
import FooterSquares from "./FooterSquares";
import FooterBird from "./FooterBird";

/** The closing: an all-pink footer revealed under the page. She rises from behind the giant wordmark. */
export default function Footer() {
  return (
    <footer className="mkfoot fq" id="mkfoot">
      <div className="mkfoot-in" id="mkfoot-in">
        {/* (2026-11-15, approved "6") she is back: the soft pink band, her photograph melting into it, lime squares coming in from the far side with "Shhh." on them */}
        <div className="fq-band">
          <div className="fq-ph"><Image src={hushCard.img} alt="A woman with a finger to her lips, wearing yellow cushion diamond studs, a tennis necklace and an oval diamond ring" fill sizes="(max-width:767px) 90vw, 50vw" quality={78} /></div>
          <FooterSquares />
          {/* (2026-11-15, approved "2") the wordmark as a huge soft watermark along the bottom of the band, over the pink and the lime, below her face */}
          <div className="fq-wm" aria-hidden="true" />
          <section className="fq-say" aria-label="Quiet flex"><h2>Shhh.</h2><p>Serious diamonds, worn lightly.</p></section>
        </div>
        <FooterBird />
        <div className="fq-low"><Link href={hushCard.href} className="hush-cta">{hushCard.cta}</Link></div>
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
