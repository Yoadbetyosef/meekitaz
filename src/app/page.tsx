import Hero from "@/components/Hero";
import Intro, { INTRO_GATE } from "@/components/Intro";
import DailyFun from "@/components/DailyFun";
import Film from "@/components/Film";
import YellowCurtain from "@/components/YellowCurtain";
import FloatingFilm from "@/components/FloatingFilm";
import FeedStrip from "@/components/FeedStrip";
import Categories from "@/components/Categories";
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
      {/* On phones this wrapper is its own scroll "page" (like a Reel): the first swipe lifts the yellow and stops on its own at the end;
          the next swipe moves the page on. On computers it is transparent (display:contents) and the page scrolls as before. */}
      <div className="ycur-stage" id="ycur-stage">
        <YellowCurtain />
        <Hero />
        <div className="ycur-hold" aria-hidden="true" />{/* return mode only: the first 75% of scrolling lifts the curtain off the hero */}
      </div>
      <DailyFun />
      <Film />{/* phones */}
      <Categories />
      <FloatingFilm />
      <FeedStrip />
      <NewFancy />
      <OneOfOne />
      <ReelStrip />
      <HouseCodes />
      <PressRow />
      <BrandStories />
      <Reviews />
      <PrivateClients />
    </main>
  );
}
