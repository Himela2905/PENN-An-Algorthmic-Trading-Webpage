export default function BacktestStats() {
  return (
    <div className="space-y-5">

      {/* Performance Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

        <h2 className="text-lg font-semibold mb-4">
          Performance
        </h2>

        <div className="space-y-4">

          <div className="flex justify-between items-center bg-zinc-900 rounded-xl px-4 py-3">
            <span className="text-zinc-400 text-sm">
              Final Value
            </span>

            <span className="font-semibold text-green-400">
              ₹12,450
            </span>
          </div>

          <div className="flex justify-between items-center bg-zinc-900 rounded-xl px-4 py-3">
            <span className="text-zinc-400 text-sm">
              Profit / Loss
            </span>

            <span className="font-semibold text-green-400">
              +24.5%
            </span>
          </div>

          <div className="flex justify-between items-center bg-zinc-900 rounded-xl px-4 py-3">
            <span className="text-zinc-400 text-sm">
              Total Trades
            </span>

            <span className="font-semibold">
              21
            </span>
          </div>

          <div className="flex justify-between items-center bg-zinc-900 rounded-xl px-4 py-3">
            <span className="text-zinc-400 text-sm">
              Win Ratio
            </span>

            <span className="font-semibold text-blue-400">
              68%
            </span>
          </div>

          <div className="flex justify-between items-center bg-zinc-900 rounded-xl px-4 py-3">
            <span className="text-zinc-400 text-sm">
              Max Drawdown
            </span>

            <span className="font-semibold text-red-400">
              -8.2%
            </span>
          </div>

        </div>

      </div>

      {/* Strategy Status */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

        <h2 className="text-lg font-semibold mb-4">
          Strategy Status
        </h2>

        <div className="flex items-center gap-3 bg-zinc-900 rounded-xl p-4">

          <div className="w-3 h-3 rounded-full bg-green-500" />

          <div>
            <p className="font-medium">
              Ready
            </p>

            <p className="text-zinc-500 text-sm">
              Waiting for execution
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}