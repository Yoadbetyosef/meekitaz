import Image from "next/image";
import { brand } from "@/brands";

/** "Our designers": the design houses the brand carries. Purely editorial — deliberately no links out. Hidden when the brand defines none. */
export default function Designers() {
  const d = brand.designers; if (!d) return null;
  return (
    <section className="sec dz" id="designers" aria-label={d.eyebrow}>
      <div className="wrap">
        <div className="sec-head"><small className="eyebrow">{d.eyebrow}</small><h2 className="h2">{d.title}</h2><p className="dz-intro">{d.intro}</p></div>
        <div className="dz-grid">
          {d.items.map(it => (
            <article key={it.name} className="dz-card">
              <div className="dz-img"><Image src={it.img} alt={it.alt} fill sizes="(max-width:767px) 92vw, 22vw" quality={78} /></div>
              <div className="dz-txt">
                <div className="dz-mark"><b>{it.name}</b><small>{it.tag}</small></div>
                <p>{it.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
