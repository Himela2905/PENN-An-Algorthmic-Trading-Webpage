interface Trade {
  action: string;
  price:  number;
  date:   string;
}

interface Props {
  trades:  Trade[];
  loading: boolean;
}

export default function TradeHistory({ trades, loading }: Props) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-semibold">Trade History</h2>
          <p className="text-sm text-zinc-500">Executed strategy trades</p>
        </div>
        <div className="text-sm text-zinc-400">{trades.length} Trades</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-zinc-400 border-b border-zinc-800">
              <th className="text-left py-3">Type</th>
              <th className="text-left py-3">Price</th>
              <th className="text-left py-3">Date</th>
              <th className="text-left py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-500">
                  Running backtest...
                </td>
              </tr>
            ) : trades.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-500">
                  No trades yet. Run a strategy.
                </td>
              </tr>
            ) : (
              trades.map((trade, index) => (
                <tr key={index} className="border-b border-zinc-900 hover:bg-zinc-900 transition">
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trade.action === "BUY"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {trade.action}
                    </span>
                  </td>
                  <td className="py-4 font-medium">₹{trade.price.toLocaleString()}</td>
                  <td className="py-4 text-zinc-400">{trade.date}</td>
                  <td className="py-4">
                    <span className="text-blue-400 text-xs">Executed</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}