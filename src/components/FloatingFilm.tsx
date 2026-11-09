/* Home · Floating collection (minimal "A", 2026-11-01: headline, one line, button; the white M at 22% cut off on the right edge, clear of the text) (sits right under Shop by category): a film of the threaded marquise, same square as the photo it replaced, and copy set exactly like the film section above
   (same headline size, same italic text, same button), with a hand-drawn marker circle around "Only". */
export default function FloatingFilm() {
  return (
    <section className="mkfilm flip fl fl-min" aria-label="Floating collection">
      <img className="fl-m" src="/brand/meekitaz-m-white.png" alt="" aria-hidden="true" loading="lazy" />{/* our M, 22%, on the right edge — never under the words */}
      <div className="mkfilm-in">
        <div className="mkfilm-vid fl-img"><video src="/media/floating-diamond-w.mp4" poster="/media/floating-diamond-w-poster.webp" muted loop playsInline autoPlay preload="metadata" aria-label="A marquise diamond threaded onto a gold chain through a drilled channel, with no prongs" /></div>
        <div className="mkfilm-txt fl-txt">
          <span className="fl-note">
            Only at Meekitaz.
          </span>
          <h2>Light, all the<br />way through.</h2>
          <p className="fl-one">No prongs. 360&deg; of light.</p>
          <a href="/floating" className="pill fl-btn">Shop floating</a>
        </div>
      </div>
    </section>
  );
}
