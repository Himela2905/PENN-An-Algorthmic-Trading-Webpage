"use client";

import { useState } from "react";

interface Props {
  onRun: (payload: {
    symbol: string;
    strategy: string;
    period: string;
    interval: string;
    initial_balance: number;
  }) => void;
  loading: boolean;
}

const timeframeMap: Record<string, string> = {
  "1 Minute":  "1m",
  "5 Minute":  "5m",
  "15 Minute": "15m",
  "1 Hour":    "60m",
  "1 Day":     "1d",
};

export default function BacktestSidebar({ onRun, loading }: Props) {
  const [strategy,   setStrategy]   = useState("Golden Cross");
  const [symbol,     setSymbol]     = useState("");
  const [capital,    setCapital]    = useState(10000);
  const [startDate,  setStartDate]  = useState("");
  const [endDate,    setEndDate]    = useState("");
  const [timeframe,  setTimeframe]  = useState("1 Day");

  const handleRun = () => {
    // convert date range to period string yfinance understands
     console.log("BUTTON CLICKED, symbol:", symbol); 
    let period = "1y";
    if (startDate && endDate) {
      const days = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime())
        / (1000 * 60 * 60 * 24)
      );
      if (days <= 30)       period = "1mo";
      else if (days <= 90)  period = "3mo";
      else if (days <= 180) period = "6mo";
      else if (days <= 365) period = "1y";
      else                  period = "2y";
    }

    onRun({
      symbol:          symbol.toUpperCase().trim(),
      strategy:        strategy,
      period:          period,
      interval:        timeframeMap[timeframe],
      initial_balance: capital,
    });
  };

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full">
      <h2 className="text-xl font-semibold mb-5">Strategy Settings</h2>

      {/* Strategy Name */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">Strategy Name</label>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        >
          <option>Golden Cross</option>
          <option>RSI</option>
        </select>
      </div>

      {/* Symbol */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">Symbol</label>
        <input
          type="text"
          placeholder="e.g. TCS.NS"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Initial Capital */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">Initial Capital</label>
        <input
          type="number"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-sm text-zinc-400 block mb-2">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-sm text-zinc-400 block mb-2">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Timeframe */}
      <div className="mb-5">
        <label className="text-sm text-zinc-400 block mb-2">Timeframe</label>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        >
          <option>1 Minute</option>
          <option>5 Minute</option>
          <option>15 Minute</option>
          <option>1 Hour</option>
          <option>1 Day</option>
        </select>
      </div>

      <button
        onClick={handleRun}
        disabled={loading || !symbol}
        className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-xl py-3 font-medium disabled:opacity-50"
      >
        {loading ? "Running..." : "Run Strategy"}
      </button>
    </div>
  );
}