/** A small circle showing the stone colour: a real stone photo when we have one, a plain tint otherwise. */
const TINT: Record<string, string> = { "": "#f1f1ef", White: "#f1f1ef", Yellow: "#e9c84a", Pink: "#ef8fb0", Blue: "#6fa3e6", Green: "#8fcf9a" };
export default function StoneSwatch({ color, src }: { color: string; src?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <span className="rp-sw">{src ? <img src={src} alt="" referrerPolicy="no-referrer" className="rp-sw-img" /> : <i style={{ background: TINT[color] || "#ddd" }} />}</span>;
}
