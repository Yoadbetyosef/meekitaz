import { frameStyle, places } from "@/lib/data";

/** The four little corner notes on a photo: coordinates top left and right, a number bottom left, the place bottom right.
 *  Draws nothing unless frameStyle is "coords" (data.ts). */
export default function Coords({ k }: { k: string }) {
  const p = places[k];
  if (frameStyle !== "coords" || !p) return null;
  return (
    <span className="fc" aria-hidden="true">
      <i className="fc-t a">{p[0]}</i><i className="fc-t b">{p[1]}</i><i className="fc-t c">{p[2]}</i><i className="fc-t d">{p[3]}</i>
    </span>
  );
}
