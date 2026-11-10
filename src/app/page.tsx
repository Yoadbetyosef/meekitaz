import Intro, { INTRO_GATE } from "@/components/Intro";
import HomeOpenPhone from "@/components/HomeOpenPhone";
import DailyPlanSection from "@/components/DailyPlanSection";
import Film from "@/components/Film";
import FloatingFilm from "@/components/FloatingFilm";
import Categories from "@/components/Categories";
import FeedReel from "@/components/FeedReel";
import NewFancy from "@/components/NewFancy";
import OneOfOne from "@/components/OneOfOne";
import RtsBike from "@/components/RtsBike";
import PressRow from "@/components/PressRow";
import Reviews from "@/components/Reviews";
import PrivateClients from "@/components/PrivateClients";

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main className="home-page">
      <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      <Intro />
      {/* (2026-11-08) the home opens on the dancer: the blue lifts and she is already dancing — the crouch/lift hero is retired */}
      <HomeOpenPhone><DailyPlanSection /></HomeOpenPhone>{/* (2026-11-09) the first screen everywhere: the film from the left, the hand from the right */}
      {/* (2026-11-08) the dancer's screen stays put; everything below rises over it */}
      <div className="over-fun">
      <Film />{/* phones */}
      <Categories />{/* (2026-11-09) Shop by category with the model photos again, everywhere */}
      <FeedReel />
      <FloatingFilm />
      {/* (2026-11-08) the feed reel lives in Shop by category now — not twice on the home page */}
      <NewFancy />
      <OneOfOne />
      <RtsBike />{/* (2026-11-09) Ready to ship: the arch window */}
      <PressRow />
      <Reviews />
      <PrivateClients />
      </div>
    </main>
  );
}
