"use client";
import { useRouter } from "next/navigation";
import { chooseStone, type Stone } from "@/lib/setting";
import { useCart } from "./CartProvider";
import { toast } from "./Toast";

export default function ChooseStone({ stone }: { stone: Stone }) {
  const router = useRouter();
  const { addRing } = useCart();
  return <button type="button" className="pill dd-choose" onClick={() => chooseStone(stone, { push: u => router.push(u), addRing, notify: toast })}>Choose this diamond</button>;
}
