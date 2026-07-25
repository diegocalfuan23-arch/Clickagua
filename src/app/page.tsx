import { AtmosphericBackground } from "@/components/site/atmospheric-background";
import { Header } from "@/components/site/header";
import { Hero } from "@/components/site/hero";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <AtmosphericBackground />
      <Header />
      <main>
        <Hero />
      </main>
    </div>
  );
}
