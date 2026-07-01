interface Props {
  finalValue:    number;
  profitPercent: number;
  totalTrades:   number;
  winRatio:      number;
  maxDrawdown:   number;
  loading:       boolean;
}

export default function BacktestStats({
  finalValue,
  profitPercent,
  totalTrades,
  winRatio,
  maxDrawdown,
  loading,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
        <h2 className="text-lg font-semibold mb-4">Performance</h2>

        <div className="space-y-4">

          <div className="flex justify-between items-center rounded-xl px-4 py-3"
style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-zinc-400 text-sm">Final Value</span>
            <span className="font-semibold"
style={{ color: '#00FF88' }}>
              {loading ? "—" : `₹${finalValue.toLocaleString()}`}
            </span>
          </div>

          <div className="flex justify-between items-center rounded-xl px-4 py-3"
style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-zinc-400 text-sm">Profit / Loss</span>
            <span className={`font-semibold ${profitPercent >= 0 ? "text-green-400" : "text-red-400"}`}>
              {loading ? "—" : `${profitPercent >= 0 ? "+" : ""}${profitPercent}%`}
            </span>
          </div>

          <div className="flex justify-between items-center rounded-xl px-4 py-3"
style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-zinc-400 text-sm">Total Trades</span>
            <span className="font-semibold">
              {loading ? "—" : totalTrades}
            </span>
          </div>

          <div className="flex justify-between items-center rounded-xl px-4 py-3"
style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-zinc-400 text-sm">Win Ratio</span>
            <span className="font-semibold"
style={{ color: '#5AC8FA' }}>
              {loading ? "—" : `${winRatio}%`}
            </span>
          </div>

          <div className="flex justify-between items-center rounded-xl px-4 py-3"
style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-zinc-400 text-sm">Max Drawdown</span>
            <span className="font-semibold"
style={{ color: '#FF3B30' }}>
              {loading ? "—" : `${maxDrawdown}%`}
            </span>
          </div>

        </div>
      </div>

      {/* Strategy Status */}
      <div className="rounded-2xl p-5"
style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-lg font-semibold mb-4">Strategy Status</h2>
        <div className="flex items-center gap-3 bg-zinc-900 rounded-xl p-4">
          <div className={`w-3 h-3 rounded-full ${loading ? "bg-yellow-500 animate-pulse" : "bg-green-500"}`} />
          <div>
            <p className="font-medium">{loading ? "Running..." : "Ready"}</p>
            <p className="text-zinc-500 text-sm">
              {loading ? "Executing strategy" : "Waiting for execution"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}