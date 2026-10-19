import type { Metadata } from "next";

// The looks page: models wearing the jewelry, every piece priced and linked to its product page. Content arrives with the next batch of looks,
// so the page is kept out of search until then.
export const metadata: Metadata = { title: "The looks", robots: { index: false, follow: true } };

export default function LooksPage() {
  return (
    <main>
      <section className="sec looks-empty" aria-label="The looks">
        <div className="wrap">
          <small className="eyebrow">The looks</small>
          <h1 className="h2">Everything she&rsquo;s wearing</h1>
          <p className="looks-lead">New looks are on their way.</p>
        </div>
      </section>
    </main>
  );
}
