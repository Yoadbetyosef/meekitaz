export default function Stars() {
  const p = "M10 1.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L1.3 7.8l6.1-.7z";
  return <span className="stars" aria-label="5 stars">{[0,1,2,3,4].map(i => <svg key={i} viewBox="0 0 20 20"><path d={p} /></svg>)}</span>;
}
