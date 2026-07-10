'use client';

import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  name: string;
  price: number;
  change: number;
  percent: number;
}

export default function MarketCard({
  name,
  price,
  change,
  percent,
}: Props) {

  const positive = change >= 0;

  return (
  <div className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 transition-colors duration-200 hover:border-zinc-700 hover:bg-zinc-800/30">

    {/* Header */}
    <div className="flex items-center justify-between">
      <span className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500">
        {name}
      </span>

      <span
        className={`text-[11px] font-semibold ${
          positive ? "text-green-400" : "text-red-400"
        }`}
      >
        {positive ? "+" : ""}
        {percent.toFixed(2)}%
      </span>
    </div>

    {/* Price + Change */}
    <div className="mt-1 flex items-end justify-between">
      <span className="text-lg font-semibold text-white">
        {price.toLocaleString()}
      </span>

      <span
        className={`text-xs ${
          positive ? "text-green-400" : "text-red-400"
        }`}
      >
        {positive ? "+" : ""}
        {change.toFixed(2)}
      </span>
    </div>

  </div>
);
}