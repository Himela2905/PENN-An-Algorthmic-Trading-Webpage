export default function BacktestSidebar() {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-full">

      <h2 className="text-xl font-semibold mb-5">
        Strategy Settings
      </h2>

      {/* Strategy Name */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">
          Strategy Name
        </label>

        <input
          type="text"
          placeholder="EMA Crossover"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Symbol */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">
          Symbol
        </label>

        <input
          type="text"
          placeholder="NIFTY50"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Initial Capital */}
      <div className="mb-4">
        <label className="text-sm text-zinc-400 block mb-2">
          Initial Capital
        </label>

        <input
          type="number"
          placeholder="10000"
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-3 mb-4">

        <div>
          <label className="text-sm text-zinc-400 block mb-2">
            Start Date
          </label>

          <input
            type="date"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-sm text-zinc-400 block mb-2">
            End Date
          </label>

          <input
            type="date"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 outline-none focus:border-blue-500"
          />
        </div>

      </div>

      {/* Timeframe */}
      <div className="mb-5">
        <label className="text-sm text-zinc-400 block mb-2">
          Timeframe
        </label>

        <select
          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        >
          <option>1 Minute</option>
          <option>5 Minute</option>
          <option>15 Minute</option>
          <option>1 Hour</option>
          <option>1 Day</option>
        </select>
      </div>

      {/* Run Button */}
      <button
        className="w-full bg-blue-600 hover:bg-blue-500 transition rounded-xl py-3 font-medium"
      >
        Run Strategy
      </button>

    </div>
  );
}