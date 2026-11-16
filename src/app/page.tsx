import Intro, { INTRO_GATE } from "@/components/Intro";
import HomeOpenPhone from "@/components/HomeOpenPhone";
import { DailyCoinSection } from "@/components/DailyPlanSection";
import Film from "@/components/Film";
import FloatingFilm from "@/components/FloatingFilm";
import Categories from "@/components/Categories";
import { MidiNumber, MidiHeadline } from "@/components/MidiTrial";
import PhoneStory from "@/components/PhoneStory";
import NewFancy from "@/components/NewFancy";
import OneOfOne from "@/components/OneOfOne";
import RtsBike from "@/components/RtsBike";
import { RTS_ON } from "@/lib/flags";
import PressRow from "@/components/PressRow";
import Reviews from "@/components/Reviews";
import FeedBand from "@/components/FeedBand";
import PrivateClients from "@/components/PrivateClients";
import { BoldPromises, BoldStatement, BoldDays } from "@/components/BoldBits";

export const metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main className="home-page">
      <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
      <Intro />
      {/* (2026-11-08) the home opens on the dancer: the blue lifts and she is already dancing — the crouch/lift hero is retired */}
      <HomeOpenPhone><PhoneStory /><DailyCoinSection /></HomeOpenPhone>{/* (2026-11-09) the first screen everywhere: the film from the left, the hand from the right */}
      {/* (2026-11-08) the dancer's screen stays put; everything below rises over it */}
      <div className="over-fun">
      <Film />{/* phones */}
      <BoldPromises />{/* (2026-11-14) "Bold" trial sections — shown only with the private switch on */}
      <MidiNumber />{/* (2026-11-15) trial, shown only with the private FX switch on "added" */}
      <Categories />{/* (2026-11-09) Shop by category with the model photos again, everywhere */}
      {/* (2026-11-14) the tall feed reel is off the home page for now — FeedReel.tsx is kept; archived as design/home-feed-reel-under-categories */}
      <FloatingFilm />
      {/* (2026-11-08) the feed reel lives in Shop by category now — not twice on the home page */}
      <NewFancy />
      <BoldStatement />
      <MidiHeadline />{/* (2026-11-15) trial, as above */}
      <OneOfOne />
      <BoldDays />
      {RTS_ON && <RtsBike />}{/* (2026-11-09) Ready to ship: the arch window */}
      <PressRow />
      <Reviews />
      <FeedBand />{/* (2026-11-14) the feed reel, small, as one dark moment before Private clients */}
      <PrivateClients />
      </div>
    </main>
  );
}
