import Image from "next/image";
import Link from "next/link";
import { houseCodes } from "@/lib/data";

export default function HouseCodes() {
  return (
    <section className="sec" id="codes" aria-label="House codes">
      <div className="wrap">
        <div className="sec-head"><small className="eyebrow">House codes</small><h2 className="h2">How we do diamonds</h2></div>
        <div className="codes">
          {houseCodes.map(c => (
            <Link key={c.title} href={c.href} className="code">
              <div className="code-img"><Image src={c.img} alt={c.title} width={800} height={1000} sizes="(max-width:767px) 78vw, 380px" quality={75} /></div>
              <div className="code-txt"><i>{c.num}</i><h3>{c.title}</h3><p>{c.text}</p></div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
