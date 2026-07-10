import NavBar from "../components/NavBar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

import Ticker from '@/components/Ticker';
import MarketOverview from "../components/marketoverview";
import TopMovers from "../components/topmovers";
import FinancialNews from "@/components/financialnews";


export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen">
      <NavBar />


      {/* TICKER */}
            <Ticker />
      


      <Hero />
      <MarketOverview />
      <TopMovers />
      <FinancialNews />
      <Features />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}
