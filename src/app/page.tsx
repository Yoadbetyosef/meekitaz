import Hero from "@/components/Hero";
import Film from "@/components/Film";
import Categories from "@/components/Categories";
import HouseCodes from "@/components/HouseCodes";
import NewFancy from "@/components/NewFancy";
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
      <Reviews />
      <PrivateClients />
    </main>
  );
}
