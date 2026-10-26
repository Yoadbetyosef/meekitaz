import Hero from "@/components/Hero";
import { DailyCurtain } from "@/components/DailyDemo";
import Film from "@/components/Film";
import Categories from "@/components/Categories";
import HouseCodes from "@/components/HouseCodes";
import NewFancy from "@/components/NewFancy";
import PressRow from "@/components/PressRow";
import LooksReel from "@/components/LooksReel";
import Reviews from "@/components/Reviews";
import PrivateClients from "@/components/PrivateClients";

export default function Home() {
  return (
    <main className="home-page">
      <Hero />
      <DailyCurtain />
      <Film />
      <Categories />
      <NewFancy />
      <HouseCodes />
      <PressRow />
      <LooksReel />
      <Reviews />
      <PrivateClients />
    </main>
  );
}
