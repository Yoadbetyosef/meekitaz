"use client";
import { useRouter } from "next/navigation";
import { chooseStone, type Stone } from "@/lib/setting";

export default function ChooseStone({ stone }: { stone: Stone }) {
  const router = useRouter();
  return <button type="button" className="pill dd-choose" onClick={() => chooseStone(stone, u => router.push(u))}>Choose this diamond</button>;
}
