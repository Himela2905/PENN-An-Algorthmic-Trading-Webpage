"use client";

import { useState } from "react";
import BacktestSidebar from "@/components/BacktestSidebar";
import BacktestChart   from "@/components/BacktestChart";
import BacktestStats   from "@/components/BacktestStats";
import TradeHistory    from "@/components/TradeHistory";
import { runBacktest } from "@/lib/liveApi";
import ProtectedRoute from "@/components/ProtectedRoute";

interface BacktestResult {
  final_value:    number;
  profit_percent: number;
  profit_loss:    number;
  total_trades:   number;
  win_ratio:      number;
  max_drawdown:   number;
  buy_trades:     number;
  sell_trades:    number;
  trades:         { action: string; price: number; date: string }[];
  equity_curve:   { date: string; value: number }[];
}

const defaultResult: BacktestResult = {
  final_value:    0,
  profit_percent: 0,
  profit_loss:    0,
  total_trades:   0,
  win_ratio:      0,
  max_drawdown:   0,
  buy_trades:     0,
  sell_trades:    0,
  trades:         [],
  equity_curve:   [],
};

export default function BacktestPage() {
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<BacktestResult>(defaultResult);
  const [error,   setError]   = useState("");

  const handleRun = async (payload: {
    symbol:          string;
    strategy:        string;
    period:          string;
    interval:        string;
    initial_balance: number;
  }) => {
    setLoading(true);
    setError("");

    try {
      const data = await runBacktest(payload);
      console.log("BACKTEST RESPONSE:", data);

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch {
      setError("Cannot connect to server. Is Flask running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
    <main className="min-h-screen bg-black text-white p-6">

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Backtest Terminal</h1>
          <p className="text-zinc-400 mt-1">Test and evaluate trading strategies</p>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>

      <div className="grid grid-cols-12 gap-5">

        <div className="col-span-3">
          <BacktestSidebar onRun={handleRun} loading={loading} />
        </div>

        <div className="col-span-6">
          <BacktestChart
            equityCurve={result.equity_curve}
            profitPercent={result.profit_percent}
            buyTrades={result.buy_trades}
            sellTrades={result.sell_trades}
            loading={loading}
          />
        </div>

        <div className="col-span-3">
          <BacktestStats
            finalValue={result.final_value}
            profitPercent={result.profit_percent}
            totalTrades={result.total_trades}
            winRatio={result.win_ratio}
            maxDrawdown={result.max_drawdown}
            loading={loading}
          />
        </div>

      </div>

      <div className="mt-5">
        <TradeHistory trades={result.trades} loading={loading} />
      </div>

    </main>
    </ProtectedRoute>
  );
}