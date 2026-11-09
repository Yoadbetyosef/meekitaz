import Link from "next/link";
/* 404 (approved 2026-11-08): the olive on its pick, swaying — "This page fell into a martini." */
export default function NotFound() {
  return (
    <main className="mk-404">
      <i className="mk-x x1" aria-hidden="true" /><i className="mk-x x3" aria-hidden="true" />
      <div>
        <i className="mk-ic mk-blue mk-sway" aria-hidden="true" style={{ ["--src" as string]: "url(/media/icons/olive.png)", width: 98, height: 156 }} />
        <small>404</small>
        <h1>This page fell into a martini.</h1>
        <p className="mk-it">Let&rsquo;s fish you out.</p>
        <Link href="/" className="mk-404-btn">Back to the bar</Link>
      </div>
    </main>
  );
}
