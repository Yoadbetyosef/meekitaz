/* Home · Floating collection (option C): the threaded marquise, cut out so it sits on the page itself, in the same frame size as the film
   above; the copy explains the house floating setting. */
export default function FloatingFilm() {
  return (
    <section className="mkfilm flip fl" aria-label="Floating collection">
      <div className="mkfilm-in">
        <div className="mkfilm-vid fl-img"><img src="/media/floating-diamond.webp" alt="A marquise diamond threaded onto a gold chain through a drilled channel, with no prongs" loading="lazy" /></div>
        <div className="mkfilm-txt fl-txt">
          <p className="fl-eye"><i />Floating collection</p>
          <h2>Light, all the way through.</h2>
          <p className="fl-quote">&ldquo;Is it even set?&rdquo; Yes. Just not the way you&rsquo;re used to.</p>
          <p className="fl-body">Our floating setting threads each diamond onto the gold through a tiny drilled channel. With no metal around it, the stone takes in light from above, below and behind, and throws it back as fire you notice from across the room.</p>
          <div className="fl-stat"><div><b>No</b><span>prongs</span></div><div><b>360&deg;</b><span>light</span></div><div><b>1</b><span>house method</span></div></div>
        </div>
      </div>
    </section>
  );
}
