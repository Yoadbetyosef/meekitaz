import Hero from "@/components/Hero";
import Film from "@/components/Film";
import Categories from "@/components/Categories";
import HouseCodes from "@/components/HouseCodes";
import NewFancy from "@/components/NewFancy";
import Designers from "@/components/Designers";
import PressRow from "@/components/PressRow";
import ShopLook from "@/components/ShopLook";
import Reviews from "@/components/Reviews";
import PrivateClients from "@/components/PrivateClients";

export default function Home() {
  return (
    <main>
      <Hero />
      <Film />
      <Categories />
      <NewFancy />
      <HouseCodes />
      <Designers />
      <PressRow />
      <ShopLook />
      <Reviews />
      <PrivateClients />
    </main>
  );
}
