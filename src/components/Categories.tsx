import Image from "next/image";
import Link from "next/link";
import { categoryTiles } from "@/lib/data";
import Coords from "./Coords";

export default function Categories() {
  return (
    <section className="sec" id="shop" aria-label="Shop by category">
      <div className="wrap">
        <div className="sec-head"><small className="eyebrow">The collection</small><h2 className="h2">Shop by category</h2></div>
        <div className="ct-row">
          {categoryTiles.map(t => (
            <Link key={t.href} href={t.href} className="ct">
              <div className="ct-img"><Image src={t.img} alt={t.title} fill sizes="(max-width:767px) 72vw, 300px" quality={75} /><Coords k={`tile-${t.n}`} /></div>
              <div className="ct-txt"><i>{t.n}</i><b>{t.title}</b><small>{t.sub}</small></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
