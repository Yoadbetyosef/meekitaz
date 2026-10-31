import Image from "next/image";

/* One of One page — the tennis-court photo (lying on the red clay in sunglasses, tennis bracelets) as an editorial tile
   inside the ring grid: one column wide, two rows tall on computers; full width on phones (layout "B", approved 2026-10-31). */
const SRC = "https://d8j0ntlcm91z4.cloudfront.net/user_3DSL63TGngiexHNYyHPnuPUiRZB/hf_20261019_024828_c7f5e352-cb14-4d30-ae23-e7a19ea500a8.png";

export default function OooPhoto() {
  return (
    <div className="op-tile">
      <Image src={SRC} alt="Lying on a red clay court in sunglasses, tennis bracelets on her wrist" fill sizes="(max-width:767px) 96vw, 400px" quality={80} />
      <div className="op-cap"><small>One of One</small><b>Made once.<br />Never again.</b></div>
    </div>
  );
}
