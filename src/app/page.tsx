import Hero from "@/components/Hero";
import Film from "@/components/Film";
import FloatingFilm from "@/components/FloatingFilm";
import Categories from "@/components/Categories";
import HouseCodes from "@/components/HouseCodes";
import NewFancy from "@/components/NewFancy";
import OneOfOne from "@/components/OneOfOne";
import ReelStrip from "@/components/ReelStrip";
import PressRow from "@/components/PressRow";
import LooksReel from "@/components/LooksReel";
import Reviews from "@/components/Reviews";
import PrivateClients from "@/components/PrivateClients";

export default function Home() {
  return (
    <main className="home-page">
      <Hero />
      <Film />
      <Categories />
      <FloatingFilm />
      <NewFancy />
      <OneOfOne />
      <ReelStrip />
      <HouseCodes />
      <PressRow />
      <LooksReel />
      <Reviews />
      <PrivateClients />
    </main>
  );
}
