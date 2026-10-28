"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import type { Setting, Stone } from "@/lib/setting";

/** The link in the "your bag" email: rebuilds the rings in this browser and opens the bag. */
export default function RestoreBag() {
  const { id } = useParams<{ id: string }>(); const router = useRouter(); const { addRing, setOpen } = useCart();
  const [state, setState] = useState<"loading" | "done" | "gone">("loading");
  useEffect(() => {
    let dead = false;
    fetch(`/api/bag?id=${encodeURIComponent(id)}`).then(r => r.json()).then(j => {
      if (dead) return;
      if (!j.bag) { setState("gone"); return; }
      (j.bag.rings as { setting: Setting; stone: Stone }[]).forEach(r => { if (r?.setting && r?.stone) addRing(r.setting, r.stone); });
      setState("done"); setOpen(true);
      setTimeout(() => router.replace("/"), 400);
    }).catch(() => { if (!dead) setState("gone"); });
    return () => { dead = true; };
  }, [id, addRing, setOpen, router]);
  return <main className="wrap" style={{ padding: "160px 20px 80px", textAlign: "center" }}>
    {state === "loading" && <p>Bringing your bag back…</p>}
    {state === "done" && <p>Welcome back — your bag is ready.</p>}
    {state === "gone" && <p>This bag link has expired. <a href="/engagement-rings">Start again →</a></p>}
  </main>;
}
