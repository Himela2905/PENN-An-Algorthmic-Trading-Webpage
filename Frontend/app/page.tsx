import NavBar from "../components/NavBar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";
import CTA from "../components/CTA";
import Footer from "../components/Footer";

import Ticker from '@/components/Ticker';
import styles from './LiveTrading/page.module.css';
import StatCounter from '@/components/StatCounter';


export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen">
      <NavBar />


      {/* TICKER */}
            <Ticker />
      
            {/* STATS */}
            <section className={styles.statsSection}>
              <div className={styles.container}>
                <StatCounter />
              </div>
            </section>


      <Hero />
      <Features />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
}
