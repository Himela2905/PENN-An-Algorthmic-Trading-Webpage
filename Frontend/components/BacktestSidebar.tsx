"use client";

import { useState } from "react";
/*import SymbolSearchInput from './SymbolSearchInput';*/

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
    <div className="rounded-2xl p-5 h-full"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <h2 className="text-xl font-semibold mb-5">Strategy Settings</h2>

      {/* Strategy Name */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">Strategy Name</label>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className="w-full rounded-xl px-4 py-3 outline-none"
style=    {{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EAF2' }}
        >
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Golden Cross</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>RSI</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Death Cross</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>EMA Cross</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Triple MA</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>EMA Ribbon</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>MACD Cross</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>MACD Zero Line</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Momentum Burst</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>ROC Strategy</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Price Breakout</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Donchian Breakout</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Bollinger Bands</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Bollinger Squeeze</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>VWAP Cross</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>VWAP Bounce</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>ATR Breakout</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Stochastic</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>ZScore Reversion</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>ADX Strategy</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>Volume Spike Breakout</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>SuperTrend</option>
            <option style={{ background: '#0A0E18', color: '#E6EAF2' }}>AI Ensemble</option>
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
          className="w-full rounded-xl px-4 py-3 outline-none"
style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EAF2' }}
        />
      </div>

      {/* Initial Capital */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">Initial Capital</label>
        <input
          type="number"
          value={capital}
          onChange={(e) => setCapital(Number(e.target.value))}
          className="w-full rounded-xl px-4 py-3 outline-none"
style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EAF2' }}
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
          className="w-full rounded-xl px-4 py-3 outline-none"
style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#E6EAF2' }}
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
        className="w-full transition rounded-xl py-3 font-medium disabled:opacity-50"
style={{ background: '#00FF88', color: '#05070D' }}
      >
        {loading ? "Running..." : "Run Strategy"}
      </button>
    </div>
  );
}