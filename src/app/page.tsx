import Hero from "@/components/Hero";
import Film from "@/components/Film";
import Categories from "@/components/Categories";
import HouseCodes from "@/components/HouseCodes";
import Reviews from "@/components/Reviews";
import PrivateClients from "@/components/PrivateClients";

export default function Home() {
  return (
    <main>
      <Hero />
      <Film />
      <Categories />
      <HouseCodes />
      <Reviews />
      <PrivateClients />
    </main>
  );
}
