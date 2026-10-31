/* Home · Floating collection (sits right under Shop by category): a film of the threaded marquise, same square as the photo it replaced, and copy set exactly like the film section above
   (same headline size, same italic text, same button), with a hand-drawn marker circle around "Only". */
export default function FloatingFilm() {
  return (
    <section className="mkfilm flip fl" aria-label="Floating collection">
      <div className="mkfilm-in">
        <div className="mkfilm-vid fl-img"><video src="/media/floating-diamond.mp4" poster="/media/floating-diamond-poster.webp" muted loop playsInline autoPlay preload="metadata" aria-label="A marquise diamond threaded onto a gold chain through a drilled channel, with no prongs" /></div>
        <div className="mkfilm-txt fl-txt">
          <span className="fl-note">
            Only at Meekitaz.
          </span>
          <h2>Light, all the way through.</h2>
          <p>&ldquo;Is it even set?&rdquo; Yes. Just not the way you&rsquo;re used to. Our floating setting threads each diamond onto the gold through a tiny drilled channel, so light comes in from every side.</p>
          <div className="fl-stat"><div><b>No</b><span>prongs</span></div><div><b>360&deg;</b><span>light</span></div><div><b>1</b><span>house method</span></div></div>
          <a href="/floating" className="pill fl-btn">Shop floating</a>
        </div>
      </div>
    </section>
  );
}
