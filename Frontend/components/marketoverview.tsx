'use client';

import { useEffect, useState } from "react";
import { getMarketOverview } from "@/service/market";
import { MarketIndex } from "@/types/market";
import MarketCard from "./marketcard";

export default function MarketOverview() {

  const [data, setData] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const overview = await getMarketOverview();
    setData(overview);
    setLoading(false);
  }

  useEffect(() => {

    loadData();

    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);

  }, []);

  if (loading) {
    return (
      <section className="py-16">

        <h2 className="mb-8 text-3xl font-bold text-white">
          Market Overview
        </h2>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">

          {[...Array(5)].map((_, index) => (

            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl bg-zinc-800"
            />

          ))}

        </div>

      </section>
    );
  }

  return (
    <section className="py-16">

      <h2 className="mb-8 text-3xl font-bold text-white">
        Market Overview
      </h2>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">

        {data.map((item) => (

          <MarketCard
            key={item.name}
            {...item}
          />

        ))}

      </div>

    </section>
  );
}