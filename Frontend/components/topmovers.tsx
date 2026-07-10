'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getMovers } from '@/service/movers';
import { Mover } from '@/types/movers';

interface MoversResponse {
  gainers: Mover[];
  losers: Mover[];
}

export default function TopMovers() {
  const [data, setData] = useState<MoversResponse>({
    gainers: [],
    losers: [],
  });

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const response = await getMovers();
      setData(response);
    } catch (error) {
      console.error('Failed to load movers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <section className="py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-2xl bg-zinc-900" />
          <div className="h-80 animate-pulse rounded-2xl bg-zinc-900" />
        </div>
      </section>
    );
  }

  return (
  <section className="py-6">

    <h2 className="mb-3 text-lg font-semibold text-white">
      Market Movers
    </h2>

    <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">

      {/* Gainers */}

      <div>

        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-green-400">
          Top Gainers
        </h3>

        {data.gainers.map((stock) => (

          <div
            key={stock.symbol}
            className="flex items-center justify-between py-1.5"
          >

            <span className="text-sm text-white">
              {stock.symbol}
            </span>

            <span className="text-sm font-medium text-green-400">
              +{stock.percent.toFixed(2)}%
            </span>

          </div>

        ))}

      </div>

      {/* Losers */}

      <div>

        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-red-400">
          Top Losers
        </h3>

        {data.losers.map((stock) => (

          <div
            key={stock.symbol}
            className="flex items-center justify-between py-1.5"
          >

            <span className="text-sm text-white">
              {stock.symbol}
            </span>

            <span className="text-sm font-medium text-red-400">
              {stock.percent.toFixed(2)}%
            </span>

          </div>

        ))}

      </div>

    </div>

  </section>
);
}