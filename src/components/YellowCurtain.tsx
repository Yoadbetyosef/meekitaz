import Logo from "./Logo";

/* Home, straight after the hero (approved 2026-11-03): a butter-yellow curtain, three-quarters of the screen, with a huge white Meekitaz
   watermark and no words. As you scroll it lifts away and uncovers the photo waiting underneath (the photo stays put — sticky). */
export default function YellowCurtain() {
  return (
    <section className="ycur" aria-label="Meekitaz">
      <div className="ycur-photo">
        <picture>
          <source media="(max-width:767px)" srcSet="/media/hero/lav-m.webp" />
          <img src="/media/hero/lav-d.webp" alt="Laughing in a burgundy silk headscarf and cat-eye sunglasses, reaching out with a pear diamond ring" loading="lazy" />
        </picture>
        <a className="ycur-cta" href="/engagement-rings">Shop the collection <span aria-hidden="true">&rarr;</span></a>
      </div>
      <div className="ycur-panel" aria-hidden="true"><div className="ycur-wm"><Logo /></div></div>
    </section>
  );
}
