"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// The design lab is a private preview tool. Normal visitors only ever load this tiny gate; the lab itself loads only after ?lab=1.
const Lab = dynamic(() => import("./DesignLab"), { ssr: false });

export default function DesignLabGate() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const q = sp.get("lab") ?? sp.get("cta");
      if (q === "1") sessionStorage.setItem("designlab", "1");
      if (q === "0") { sessionStorage.removeItem("designlab"); sessionStorage.removeItem("designlab-s"); }
      setOn(sessionStorage.getItem("designlab") === "1");
    } catch { /* private mode: no lab */ }
  }, []);
  return on ? <Lab onClose={() => setOn(false)} /> : null;
}
