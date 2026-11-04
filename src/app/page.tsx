import Hero from "@/components/Hero";
import Film from "@/components/Film";
import YellowCurtain from "@/components/YellowCurtain";
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
      <YellowCurtain />
      <Hero />
      <div className="ycur-hold" aria-hidden="true" />{/* the first 75% of scrolling only lifts the yellow off the hero; then the page moves on as before */}
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
