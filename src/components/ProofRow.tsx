/* (approved 2026-11-14, "3" on Your ring and "1" in the bag) five stars with our clients' faces + the Meekitaz signature, "We promise." */
import Signature from "./Signature";

export default function ProofRow({ className = "" }: { className?: string }) {
  return (
    <div className={`df-proof ${className}`}>
      <div className="df-pr">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <span className="df-faces">{["maya", "david", "jess", "linda"].map(k => <img key={k} src={`/media/daily/faces/${k}.jpg`} alt="" />)}</span>
        <span className="df-sc"><b>5.0 <em aria-label="5 stars">★★★★★</em></b><small>Loved by our clients</small></span>
      </div>
      <div className="df-signed"><Signature on className="df-sig" /><small>We promise.</small></div>
    </div>
  );
}
