/* Home · Floating collection: the threaded marquise on the page itself, and copy set exactly like the film section above
   (same headline size, same italic text, same button), with a hand-drawn marker circle around "Only". */
export default function FloatingFilm() {
  return (
    <section className="mkfilm flip fl" aria-label="Floating collection">
      <div className="mkfilm-in">
        <div className="mkfilm-vid fl-img"><img src="/media/floating-diamond.webp" alt="A marquise diamond threaded onto a gold chain through a drilled channel, with no prongs" loading="lazy" /></div>
        <div className="mkfilm-txt fl-txt">
          <span className="fl-note">
            <span className="fl-circ">Only<svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true"><path d="M18,52 C20,18 120,6 176,26 C206,38 190,82 120,90 C60,96 10,84 14,50 C16,40 28,30 46,24" /></svg></span> at Meekitaz.
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
