import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function TradingTerminal() {
  return (
    <ProtectedRoute>
    <div className="bg-[#0b0e11] text-white min-h-screen flex overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-[80px] border-r border-[#1f2937] flex flex-col items-center py-6 bg-[#0f1319]">

        <div className="text-xl font-bold mb-10">
          TD
        </div>

        <div className="flex flex-col gap-4 text-sm text-gray-400 items-center">

          <button className="w-12 h-12 rounded-xl bg-[#1e2329] text-white flex items-center justify-center">
            ⌂
          </button>

          <button className="w-12 h-12 rounded-xl hover:bg-[#1e2329] transition">
            📈
          </button>

          <button className="w-12 h-12 rounded-xl hover:bg-[#1e2329] transition">
            ⚡
          </button>

          <button className="w-12 h-12 rounded-xl hover:bg-[#1e2329] transition">
            💼
          </button>

          <button className="w-12 h-12 rounded-xl hover:bg-[#1e2329] transition">
            ⚙
          </button>

        </div>

      </aside>


      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* TOPBAR */}
        <header className="h-16 border-b border-[#1f2937] flex items-center justify-between px-6 bg-[#0f1319]">

          <div>
            <h1 className="text-lg font-semibold tracking-wide">
              Team Diamonds Terminal
            </h1>
          </div>


          <div className="flex items-center gap-4 text-sm">

            <div className="px-4 py-2 rounded-lg bg-[#131722] border border-[#1f2937] text-green-400">
              Market Open
            </div>

            <div className="px-4 py-2 rounded-lg bg-[#131722] border border-[#1f2937]">
              Balance: ₹4,52,120
            </div>

          </div>

        </header>


        {/* TERMINAL CONTENT */}
        <div className="flex flex-1 overflow-hidden">


          {/* WATCHLIST */}
          <section className="w-[260px] border-r border-[#1f2937] bg-[#0f1319] overflow-y-auto">

            <div className="p-4 border-b border-[#1f2937]">
              <input
                type="text"
                placeholder="Search markets"
                className="w-full bg-[#131722] border border-[#1f2937] rounded-lg px-4 py-2 text-sm outline-none"
              />
            </div>


            <div className="p-3 text-sm">

              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-[#131722] cursor-pointer transition">
                <div>
                  <p className="font-medium">NIFTY 50</p>
                  <p className="text-gray-500 text-xs">NSE Index</p>
                </div>
                <div className="text-right">
                  <p>24,512</p>
                  <p className="text-green-400 text-xs">+1.82%</p>
                </div>
              </div>


              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-[#131722] cursor-pointer transition">
                <div>
                  <p className="font-medium">BANKNIFTY</p>
                  <p className="text-gray-500 text-xs">NSE Bank</p>
                </div>
                <div className="text-right">
                  <p>52,118</p>
                  <p className="text-red-400 text-xs">-0.24%</p>
                </div>
              </div>


              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-[#131722] cursor-pointer transition">
                <div>
                  <p className="font-medium">RELIANCE</p>
                  <p className="text-gray-500 text-xs">NSE Equity</p>
                </div>
                <div className="text-right">
                  <p>₹2,944</p>
                  <p className="text-green-400 text-xs">+2.12%</p>
                </div>
              </div>


              <div className="flex justify-between items-center p-3 rounded-lg hover:bg-[#131722] cursor-pointer transition">
                <div>
                  <p className="font-medium">TCS</p>
                  <p className="text-gray-500 text-xs">NSE Equity</p>
                </div>
                <div className="text-right">
                  <p>₹4,221</p>
                  <p className="text-green-400 text-xs">+0.84%</p>
                </div>
              </div>

            </div>

          </section>


          {/* CENTER CHART AREA */}
          <section className="flex-1 flex flex-col bg-[#0b0e11] overflow-hidden">

            {/* CHART HEADER */}
            <div className="h-16 border-b border-[#1f2937] flex items-center justify-between px-6 bg-[#0f1319]">

              <div>
                <h2 className="text-xl font-semibold">NIFTY 50</h2>
                <p className="text-green-400 text-sm mt-1">24,512 +1.82%</p>
              </div>


              <div className="flex items-center gap-2 text-sm">

                <button className="px-4 py-2 rounded-lg bg-[#1e2329]">
                  1m
                </button>

                <button className="px-4 py-2 rounded-lg hover:bg-[#1e2329] text-gray-400 transition">
                  5m
                </button>

                <button className="px-4 py-2 rounded-lg hover:bg-[#1e2329] text-gray-400 transition">
                  15m
                </button>

                <button className="px-4 py-2 rounded-lg hover:bg-[#1e2329] text-gray-400 transition">
                  1H
                </button>

                <button className="px-4 py-2 rounded-lg hover:bg-[#1e2329] text-gray-400 transition">
                  1D
                </button>

              </div>

            </div>


            {/* FAKE PROFESSIONAL CHART */}
            <div className="flex-1 relative bg-[#0b0e11] overflow-hidden">

              {/* GRID */}
              <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:70px_70px]"></div>


              {/* PRICE LINE */}
              <svg
                viewBox="0 0 1200 500"
                className="absolute inset-0 w-full h-full"
                preserveAspectRatio="none"
              >

                <path
                  d="M0 400 C100 380 150 300 250 320 C350 340 400 200 500 180 C650 150 700 240 800 160 C900 100 980 120 1200 40"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

              </svg>


              {/* VOLUME BARS */}
              <div className="absolute bottom-0 left-0 w-full flex items-end gap-[2px] h-28 px-4 opacity-40">

                <div className="bg-green-500 w-full h-10"></div>
                <div className="bg-green-500 w-full h-16"></div>
                <div className="bg-red-500 w-full h-8"></div>
                <div className="bg-green-500 w-full h-20"></div>
                <div className="bg-green-500 w-full h-14"></div>
                <div className="bg-red-500 w-full h-9"></div>
                <div className="bg-green-500 w-full h-24"></div>
                <div className="bg-green-500 w-full h-18"></div>
                <div className="bg-red-500 w-full h-12"></div>
                <div className="bg-green-500 w-full h-28"></div>
                <div className="bg-green-500 w-full h-16"></div>
                <div className="bg-red-500 w-full h-10"></div>
                <div className="bg-green-500 w-full h-20"></div>
                <div className="bg-green-500 w-full h-15"></div>

              </div>

            </div>


            {/* BOTTOM POSITIONS */}
            <div className="h-[180px] border-t border-[#1f2937] bg-[#0f1319] overflow-hidden">

              <div className="flex items-center gap-8 px-6 h-14 border-b border-[#1f2937] text-sm text-gray-400">
                <button className="text-white">Positions</button>
                <button>Orders</button>
                <button>History</button>
                <button>Strategy Logs</button>
              </div>


              <div className="p-6 text-sm overflow-x-auto">

                <table className="w-full">
                  <thead className="text-gray-500">
                    <tr className="text-left border-b border-[#1f2937]">
                      <th className="pb-4">Symbol</th>
                      <th className="pb-4">Qty</th>
                      <th className="pb-4">Avg Price</th>
                      <th className="pb-4">LTP</th>
                      <th className="pb-4">P&L</th>
                      <th className="pb-4">Status</th>
                    </tr>
                  </thead>

                  <tbody>

                    <tr className="border-b border-[#1f2937] text-gray-300">
                      <td className="py-4">RELIANCE</td>
                      <td>20</td>
                      <td>2910</td>
                      <td>2944</td>
                      <td className="text-green-400">+₹680</td>
                      <td>Open</td>
                    </tr>

                    <tr className="border-b border-[#1f2937] text-gray-300">
                      <td className="py-4">BANKNIFTY</td>
                      <td>5</td>
                      <td>52180</td>
                      <td>52118</td>
                      <td className="text-red-400">-₹310</td>
                      <td>Open</td>
                    </tr>

                  </tbody>
                </table>

              </div>

            </div>

          </section>


          {/* RIGHT EXECUTION PANEL */}
          <section className="w-[340px] border-l border-[#1f2937] bg-[#0f1319] overflow-y-auto">

            <div className="p-6 border-b border-[#1f2937]">

              <h2 className="text-lg font-semibold mb-6">
                Strategy Execution
              </h2>


              <div className="space-y-4">

                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Strategy Name
                  </label>

                  <input
                    type="text"
                    placeholder="Momentum Alpha"
                    className="w-full bg-[#131722] border border-[#1f2937] rounded-lg px-4 py-3 outline-none"
                  />
                </div>


                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Capital Allocation
                  </label>

                  <input
                    type="text"
                    placeholder="₹50,000"
                    className="w-full bg-[#131722] border border-[#1f2937] rounded-lg px-4 py-3 outline-none"
                  />
                </div>


                <div>
                  <label className="text-sm text-gray-400 block mb-2">
                    Risk Level
                  </label>

                  <select className="w-full bg-[#131722] border border-[#1f2937] rounded-lg px-4 py-3 outline-none">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>


                <button className="w-full bg-green-500 hover:bg-green-400 transition text-black py-3 rounded-lg font-semibold mt-4">
                  Deploy Strategy
                </button>

              </div>

            </div>


            {/* AI SIGNALS */}
            <div className="p-6 border-b border-[#1f2937]">

              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">AI Signals</h2>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              </div>


              <div className="space-y-4 text-sm">

                <div className="border border-[#1f2937] rounded-lg p-4 bg-[#131722]">
                  <div className="flex justify-between">
                    <p className="font-medium">RELIANCE</p>
                    <p className="text-green-400">BUY</p>
                  </div>

                  <p className="text-gray-500 text-xs mt-2">
                    Strong breakout detected above resistance zone.
                  </p>
                </div>


                <div className="border border-[#1f2937] rounded-lg p-4 bg-[#131722]">
                  <div className="flex justify-between">
                    <p className="font-medium">TCS</p>
                    <p className="text-green-400">BUY</p>
                  </div>

                  <p className="text-gray-500 text-xs mt-2">
                    Momentum continuation confirmed.
                  </p>
                </div>


                <div className="border border-[#1f2937] rounded-lg p-4 bg-[#131722]">
                  <div className="flex justify-between">
                    <p className="font-medium">BANKNIFTY</p>
                    <p className="text-red-400">SELL</p>
                  </div>

                  <p className="text-gray-500 text-xs mt-2">
                    Weakness detected near support breakdown.
                  </p>
                </div>

              </div>

            </div>


            {/* SYSTEM STATUS */}
            <div className="p-6">

              <h2 className="text-lg font-semibold mb-6">
                System Status
              </h2>

              <div className="space-y-4 text-sm">

                <div className="flex justify-between items-center">
                  <p className="text-gray-400">API Connection</p>
                  <p className="text-green-400">Connected</p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Broker Sync</p>
                  <p className="text-green-400">Active</p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Execution Engine</p>
                  <p className="text-green-400">Running</p>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-gray-400">Latency</p>
                  <p className="text-white">12ms</p>
                </div>

              </div>

            </div>

          </section>

        </div>

      </main>

    </div>
    </ProtectedRoute>
  );
}
