"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Signature from "@/components/Signature";

/* One of One page — the tennis-court photo (her lying upside down on the red clay, sunglasses; formerly a home hero slide),
   placed after the first two rows of rings. Four layouts to choose from; the page shows one only when ?photo=a|b|c|d is given. */
const D = "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261019_203645_0354ff6c-12f4-4fb5-9690-4d6d26b8a8ec.png";
const M = "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261019_024828_c7f5e352-cb14-4d30-ae23-e7a19ea500a8.png";

const Pic = ({ posD = "50% 40%", posM = "50% 50%" }: { posD?: string; posM?: string }) => (
  <>
    <Image className="op-d" src={D} alt="Lying on a red clay court in sunglasses, wearing Meekitaz" fill sizes="(max-width:767px) 1px, 1200px" quality={80} style={{ objectPosition: posD }} />
    <Image className="op-m" src={M} alt="Lying on a red clay court in sunglasses, wearing Meekitaz" fill sizes="(max-width:767px) 100vw, 1px" quality={80} style={{ objectPosition: posM }} />
  </>
);

export default function OooPhoto({ v }: { v: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: .5 });
    io.observe(el); return () => io.disconnect();
  }, []);

  if (v === "a") return ( // A — full row, wide editorial frame, a small caption on the photo
    <div className="op op-a" ref={ref}><Pic />
      <div className="op-cap"><small>One of One</small><b>Made once. Never again.</b></div>
    </div>
  );
  if (v === "b") return ( // B — photo across two columns, a quiet text panel in the third
    <div className="op op-b" ref={ref}>
      <div className="op-img"><Pic posD="40% 45%" /></div>
      <div className="op-txt"><small>One of One</small><h3>Made once.<br /><em>Never again.</em></h3>
        <p>One stone, one setting, one ring. When it’s claimed, it’s gone — and there is no second.</p>
        <Link href="#results" className="op-link">Keep looking ↓</Link></div>
    </div>
  );
  if (v === "c") return ( // C — a vintage print: cream border, slight tilt, the handwritten signature under it
    <div className="op op-c" ref={ref}>
      <div className="op-print"><div className="op-img"><Pic posD="50% 42%" /></div></div>
      <div className="op-sign"><Signature on={on} className="ink" /><small>One stone. One setting. Never again.</small></div>
    </div>
  );
  return ( // D — the window opens as it reaches the middle of the screen, the white signature writes on it
    <div className="op op-dd" ref={ref}>
      <div className={`op-win${on ? " on" : ""}`}><Pic /><div className="op-shade" />
        <div className="op-over"><Signature on={on} /><small>One of One · Made once</small></div></div>
    </div>
  );
}
