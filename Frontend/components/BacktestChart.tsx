export default function BacktestChart() {
  return (
    <div className="space-y-5">

      {/* Equity Curve */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

        <div className="flex justify-between items-center mb-4">

          <div>
            <h2 className="text-lg font-semibold">
              Equity Curve
            </h2>

            <p className="text-sm text-zinc-500">
              Portfolio growth over time
            </p>
          </div>

          <div className="text-green-400 text-sm font-medium">
            +12.8%
          </div>

        </div>

        {/* Fake Chart Placeholder */}
        <div className="h-[320px] rounded-xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 flex items-center justify-center relative overflow-hidden">

          {/* Grid */}
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-[size:40px_40px]" />

          {/* Dummy Curve */}
          <svg
            viewBox="0 0 500 200"
            className="w-full h-full absolute"
          >
            <path
              d="M0 180 C80 150 120 130 180 120 C240 110 280 80 340 90 C400 100 430 60 500 40"
              stroke="#3b82f6"
              strokeWidth="3"
              fill="none"
            />
          </svg>

          <div className="relative z-10 text-zinc-500 text-sm">
            Equity chart preview
          </div>

        </div>

      </div>

      {/* Strategy Activity */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

        <h2 className="text-lg font-semibold mb-4">
          Strategy Activity
        </h2>

        <div className="grid grid-cols-3 gap-4">

          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">
              Active Signals
            </p>

            <h3 className="text-2xl font-bold mt-2">
              03
            </h3>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">
              Buy Trades
            </p>

            <h3 className="text-2xl font-bold mt-2 text-green-400">
              12
            </h3>
          </div>

          <div className="bg-zinc-900 rounded-xl p-4">
            <p className="text-zinc-400 text-sm">
              Sell Trades
            </p>

            <h3 className="text-2xl font-bold mt-2 text-red-400">
              09
            </h3>
          </div>

        </div>

      </div>

    </div>
  );
}