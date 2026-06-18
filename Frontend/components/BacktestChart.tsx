"use client";

interface EquityPoint {
  date:  string;
  value: number;
}

interface Props {
  equityCurve:   EquityPoint[];
  profitPercent: number;
  buyTrades:     number;
  sellTrades:    number;
  loading:       boolean;
}

export default function BacktestChart({
  equityCurve,
  profitPercent,
  buyTrades,
  sellTrades,
  loading,
}: Props) {
  // sample every 10th point
  const points = equityCurve.filter((_, i) => i % 10 === 0) || [];

  // build SVG path from data
  const buildPath = () => {
    if (points.length === 0) return "";
    const values = points.map((p) => p.value);
    const minV   = Math.min(...values);
    const maxV   = Math.max(...values);
    const range  = maxV - minV || 1;
    const W      = 500;
    const H      = 200;

    return points
      .map((p, i) => {
        const x = (i / (points.length - 1)) * W;
        const y = H - ((p.value - minV) / range) * H;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="space-y-5">

      {/* Equity Curve */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold">Equity Curve</h2>
            <p className="text-sm text-zinc-500">Portfolio growth over time</p>
          </div>
          <div className={`text-sm font-medium ${profitPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
            {profitPercent !== 0 ? `${profitPercent >= 0 ? "+" : ""}${profitPercent}%` : ""}
          </div>
        </div>

        <div className="h-[320px] rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center relative overflow-hidden">

          {/* Grid */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px]" />

          {loading ? (
            <p className="relative z-10 text-zinc-500 text-sm">Running backtest...</p>
          ) : points.length === 0 ? (
            <p className="relative z-10 text-zinc-500 text-sm">Equity chart preview</p>
          ) : (
            <svg viewBox="0 0 500 200" className="w-full h-full absolute px-4">
              <path
                d={buildPath()}
                stroke="#3b82f6"
                strokeWidth="2.5"
                fill="none"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Strategy Activity */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-4">Strategy Activity</h2>
        <div className="grid grid-cols-3 gap-4">

          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Active Signals</p>
            <h3 className="text-2xl font-bold mt-2">
              {buyTrades + sellTrades || "—"}
            </h3>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Buy Trades</p>
            <h3 className="text-2xl font-bold mt-2 text-green-400">
              {buyTrades || "—"}
            </h3>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">Sell Trades</p>
            <h3 className="text-2xl font-bold mt-2 text-red-400">
              {sellTrades || "—"}
            </h3>
          </div>

        </div>
      </div>

    </div>
  );
}