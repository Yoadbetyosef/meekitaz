import { Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { categories, hushCard as baseHush } from "@/lib/data";
import { brand } from "@/brands";
import Wordmark from "./Wordmark";

const hushCard = { ...baseHush, img: brand.hushImg || baseHush.img };

export default function Footer() {
  return (
    <footer className="mkfoot" id="mkfoot">
      <div className="foot-giant" aria-hidden="true"><Wordmark giant /></div>
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
            <div><h4>Contact</h4><a href={`mailto:${brand.email}`}>{brand.email}</a>{brand.phone && <a href={`tel:${brand.phone.tel}`}>{brand.phone.display}</a>}<a href="https://instagram.com" target="_blank" rel="noreferrer">Instagram</a><span>{brand.showroom.address.map((l, i) => <Fragment key={i}>{l}<br /></Fragment>)}By appointment</span></div>
          </div>
        </div>
        <div className="foot-base"><span>© {new Date().getFullYear()} {brand.name}. All rights reserved.</span><span>Lab-grown · IGI / GIA certified · 30-day returns · Lifetime warranty</span></div>
      </div>
    </footer>
  );
}
