import { pressLogos } from "@/lib/data";

/** "As seen in": the outlets' wordmarks as coloured lettering straight on the page. One row on desktop; a slow marquee on tablets and phones. */
export default function PressRow() {
  const logo = (l: (typeof pressLogos)[number], key: string) => (
    <i key={key} className="pr-lg" role="img" aria-label={l.name} style={{ ["--m" as string]: `url(/press/${l.k}.png)`, ["--w" as string]: l.w, ["--h" as string]: l.h }} />
  );
  return (
    <section className="pr" aria-label="As seen in">
      <div className="wrap">
        <small className="pr-lab">As seen in</small>
        <div className="pr-view">
          <div className="pr-track">
            {pressLogos.map(l => logo(l, l.k))}
            <span className="pr-dup" aria-hidden="true">{pressLogos.map(l => <i key={l.k} className="pr-lg" style={{ ["--m" as string]: `url(/press/${l.k}.png)`, ["--w" as string]: l.w, ["--h" as string]: l.h }} />)}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
