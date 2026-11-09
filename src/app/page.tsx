import Intro, { INTRO_GATE } from "@/components/Intro";
import FunSection from "@/components/FunSection";
import Film from "@/components/Film";
import FloatingFilm from "@/components/FloatingFilm";
import Categories from "@/components/Categories";
import CategoriesDrawn from "@/components/CategoriesDrawn";
import HouseCodes from "@/components/HouseCodes";
import NewFancy from "@/components/NewFancy";
import OneOfOne from "@/components/OneOfOne";
import ReelStrip from "@/components/ReelStrip";
import PressRow from "@/components/PressRow";
import BrandStories from "@/components/BrandStories";
import Reviews from "@/components/Reviews";
import PrivateClients from "@/components/PrivateClients";

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main className="home-page">
      <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      <Intro />
      {/* (2026-11-08) the home opens on the dancer: the blue lifts and she is already dancing — the crouch/lift hero is retired */}
      <FunSection />
      {/* (2026-11-08) the dancer's screen stays put; everything below rises over it */}
      <div className="over-fun">
      <Film />{/* phones */}
      <CategoriesDrawn />{/* computers */}
      <Categories />{/* phones */}
      <FloatingFilm />
      {/* (2026-11-08) the feed reel lives in Shop by category now — not twice on the home page */}
      <NewFancy />
      <OneOfOne />
      <ReelStrip />
      <HouseCodes />
      <PressRow />
      <BrandStories />
      <Reviews />
      <PrivateClients />
      </div>
    </main>
  );
}
