import Link from "next/link";
import { categories } from "@/lib/data";

export default function Footer() {
  return (
    <footer className="mkfoot" id="mkfoot">
      <div className="foot-giant" aria-hidden="true">MEEKITAZ</div>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand"><div className="foot-logo">MEEKITAZ<span>.</span></div><p>Serious diamonds, worn lightly.</p></div>
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
