import Image from "next/image";
import { cutFor } from "@/lib/cutouts";

/** A picker stone: its transparent cut-out, centred and sized by the cream-paper circle around it (the container supplies the circle and the paper).
 *  `base` is the circle's width in px, used to ask for a sharp enough file. Falls back to the original photo if a cut-out is missing. */
export default function StoneImg({ img, alt, base, quality = 75 }: { img: string; alt: string; base: number; quality?: number }) {
  const c = cutFor(img);
  if (!c) return <Image src={img} alt={alt} fill sizes={`${base}px`} quality={quality} />;
  return (
    <Image src={c.src} alt={alt} fill sizes={`${Math.ceil(base * c.s)}px`} quality={quality} className="stone-cut"
      style={{ "--s": c.s, "--tx": `${c.x}%`, "--ty": `${c.y}%` } as React.CSSProperties} />
  );
}
