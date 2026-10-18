"use client";
import { useRouter } from "next/navigation";
import { chooseStone, type Stone } from "@/lib/setting";
import { useCart } from "./CartProvider";

export default function ChooseStone({ stone }: { stone: Stone }) {
  const router = useRouter();
  const { addRing, busy } = useCart();
  return <button type="button" className="pill dd-choose" disabled={busy} onClick={() => chooseStone(stone, { push: u => router.push(u), addRing })}>Choose this diamond</button>;
}
