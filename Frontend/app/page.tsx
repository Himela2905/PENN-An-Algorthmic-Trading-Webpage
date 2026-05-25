import NavBar from "../components/NavBar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen">
      <NavBar />
      <Hero />
      <Features />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}
