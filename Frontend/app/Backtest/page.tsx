import BacktestSidebar from "@/components/BacktestSidebar";
import BacktestChart from "@/components/BacktestChart";
import BacktestStats from "@/components/BacktestStats";
import TradeHistory from "@/components/TradeHistory";

export default function BacktestPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6">

      <div className="mb-6 flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold">
            Backtest Terminal
          </h1>

          <p className="text-zinc-400 mt-1">
            Test and evaluate trading strategies
          </p>
        </div>

        <button className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-xl font-medium">
          Run Backtest
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">

        <div className="col-span-3">
          <BacktestSidebar />
        </div>

        <div className="col-span-6">
          <BacktestChart />
        </div>

        <div className="col-span-3">
          <BacktestStats />
        </div>

      </div>

      <div className="mt-5">
        <TradeHistory />
      </div>

    </main>
  );
}