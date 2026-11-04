"use client";
import Link from "next/link";
import { useState } from "react";

/* Home · Shop by category — "poster tiles" (approved 2026-11-04). One row that slides sideways, as before. Each tile is one of our
   editorial photos in black and white with the category name at the bottom; the tile that is "awake" (hover on computers, tap on
   phones; the first one to begin with) shows in colour with our line above the name, two small plus marks, "MEEKITAZ · …" vertical
   on the side, and a small Enter. */
const TILES = [
  { href: "/engagement-rings", title: "Engagement rings", sub: "One stone. The whole conversation.", lab: "The rings", img: "/media/cats/engagement-rings.webp" },
  { href: "/diamonds", title: "Diamonds", sub: "Loose stones, serious sizes.", lab: "The stones", img: "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261104_202102_c2afd35d-2395-4d43-bcc1-c6e2113deeb4.png", pos: "50% 50%" }, // the emerald in tweezers, colourised (Higgsfield, 2026-11-04),
  { href: "/earrings", title: "Earrings", sub: "A ball cap. Two carats.", lab: "The studs", img: "/media/cats/earrings.webp" },
  { href: "/necklaces", title: "Necklaces", sub: "Layered. Then layered again.", lab: "The neck", img: "/media/cats/necklaces.webp" },
  { href: "/bracelets", title: "Bracelets", sub: "Stacked for breakfast.", lab: "The wrist", img: "/media/cats/bracelets.webp" },
  { href: "/bands", title: "Bands", sub: "The one you never take off.", lab: "The bands", img: "/media/cats/bands.webp" },
  { href: "/fancy-colors", title: "Fancy colors", sub: "Pink is a neutral.", lab: "The colours", img: "/media/cats/fancy-colors.webp" },
  { href: "/one-of-one", title: "One of One", sub: "Made once. Never again.", lab: "Made once", img: "/media/cats/one-of-one.webp" },
];

export default function Categories() {
  const [on, setOn] = useState(-1); // the "awake" tile — none to begin with: every tile starts in black and white (2026-11-04)
  return (
    <section className="sec" id="shop" aria-label="Shop by category">
      <div className="wrap">
        <div className="sec-head"><small className="eyebrow">The collection</small><h2 className="h2">Shop by category</h2></div>
        <div className="ct-row">
          {TILES.map((t, i) => (
            <Link key={t.href} href={t.href} className={`ct pt${on === i ? " on" : ""}`}
              onMouseEnter={() => setOn(i)} onTouchStart={() => setOn(i)} onFocus={() => setOn(i)}>
              <img src={t.img} alt={t.title} loading={i < 4 ? "eager" : "lazy"} style={"pos" in t ? { objectPosition: (t as { pos: string }).pos } : undefined} />
              <span className="pt-ov" aria-hidden="true" />
              <i className="pt-plus p1" aria-hidden="true" /><i className="pt-plus p2" aria-hidden="true" />
              <span className="pt-vl" aria-hidden="true">Meekitaz &middot; {t.lab}</span>
              <span className="pt-s">{t.sub}</span>
              <b className="pt-t">{t.title}</b>
              <span className="pt-e" aria-hidden="true">Enter <span>&rarr;</span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
