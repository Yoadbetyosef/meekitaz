import { DIAMOND } from "@/components/StoneSwatch";

/** The picture of a loose diamond in a given shape and colour, for the stone slide of a ring page.
 *  Round (and anything we have no shape picture for) falls back to the round brilliant of that colour. */
const SHAPES = ["Oval", "Cushion", "Emerald", "Pear", "Princess", "Radiant", "Marquise", "Asscher", "Heart"];
const COLOURS = ["white", "yellow", "pink", "blue", "green"];
export function stonePicture(shape?: string, color?: string): string {
  const c = (color || "White").toLowerCase();
  const sh = shape === "Elongated Cushion" ? "Cushion" : shape;
  if (sh && SHAPES.includes(sh) && COLOURS.includes(c)) return `/stones/${c}-${sh.toLowerCase()}.webp`; // transparent cut-outs, so they sit on the cream page with no white box
  return DIAMOND[color || ""] || DIAMOND.White;
}
