import Image from "next/image";

/** The stone colour icon: a real stone photo when we have one for this piece, otherwise a round diamond photographed in that colour
 *  (white, yellow, pink, blue, green), and a plain tint only for a colour we have no diamond for. */
const TINT: Record<string, string> = { "": "#f1f1ef", White: "#f1f1ef", Yellow: "#e9c84a", Pink: "#ef8fb0", Blue: "#6fa3e6", Green: "#8fcf9a" };
const B = "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/";
export const DIAMOND: Record<string, string> = {
  "": B + "hf_20261022_232437_a4c6cd38-7b58-4b94-a506-338ed9313621.png",
  White: B + "hf_20261022_232437_a4c6cd38-7b58-4b94-a506-338ed9313621.png",
  Yellow: B + "hf_20261022_232440_b24eb6cd-e3ce-470c-8f92-b33d82c51434.png",
  Pink: B + "hf_20261022_232443_72216e73-c355-4d58-9f86-730ddd93e203.png",
  Blue: B + "hf_20261022_232445_e33eca1f-0c20-4c70-ade2-2cc26c6d5b0f.png",
  Green: B + "hf_20261022_232448_65bcbf23-19af-4409-b536-89b78beed54d.png",
};
export default function StoneSwatch({ color, src }: { color: string; src?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className="rp-sw"><img src={src} alt="" referrerPolicy="no-referrer" className="rp-sw-img" /></span>;
  }
  const gem = DIAMOND[color];
  if (gem) return <span className="rp-sw rp-gem"><Image src={gem} alt="" width={120} height={120} sizes="64px" quality={82} /></span>;
  return <span className="rp-sw"><i style={{ background: TINT[color] || "#ddd" }} /></span>;
}
