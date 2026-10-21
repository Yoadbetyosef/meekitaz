import Image from "next/image";
import { brand } from "@/brands";

/** The brand wordmark: an image when the brand has a logo file, otherwise the text mark with the © sign (Meekitaz). */
export default function Wordmark({ giant }: { giant?: boolean }) {
  if (brand.logo) return <Image src={brand.logo.src} alt={brand.logo.alt} width={brand.logo.width} height={brand.logo.height} priority={!giant} />;
  return <>{brand.wordmark}<i>©</i></>;
}
