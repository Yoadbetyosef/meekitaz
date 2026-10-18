import Link from "next/link";
export default function NotFound() {
  return <main className="sec" style={{ minHeight: "70vh", display: "grid", placeItems: "center", paddingTop: 140 }}><div style={{ textAlign: "center" }}><h1 className="h2">Nothing here.</h1><p style={{ marginTop: 16 }}><Link href="/">Back to Meekitaz</Link></p></div></main>;
}
