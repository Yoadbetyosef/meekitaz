import Image from "next/image";
import { brand } from "@/brands";

/** The brand wordmark: a logo image when the brand has one (painted in brand.logo.color via a CSS mask when set), otherwise the text mark with the © sign (Meekitaz). */
export default function Wordmark({ giant }: { giant?: boolean }) {
  const l = brand.logo;
  if (l && l.color) return <span className="logo-mask" role="img" aria-label={l.alt} style={{ color: l.color, aspectRatio: `${l.width}/${l.height}`, WebkitMaskImage: `url(${l.src})`, maskImage: `url(${l.src})` }} />;
  if (l) return <Image src={l.src} alt={l.alt} width={l.width} height={l.height} priority={!giant} />;
  return <>{brand.wordmark}<i>©</i></>;
}
