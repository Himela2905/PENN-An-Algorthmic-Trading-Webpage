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
    <div className="rounded-2xl p-5"
style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
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
            <tr className="border-b"
style={{ color: '#8A93A8', borderColor: 'rgba(255,255,255,0.08)' }}>
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
                <tr key={index} className="border-b transition"
style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                  <td className="py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium"
style={{
  background: trade.action === "BUY" ? 'rgba(0,255,136,0.1)' : 'rgba(255,59,48,0.1)',
  color: trade.action === "BUY" ? '#00FF88' : '#FF3B30',
}}>
                      {trade.action}
                    </span>
                  </td>
                  <td className="py-4 font-medium">₹{trade.price.toLocaleString()}</td>
                  <td className="py-4 text-zinc-400">{trade.date}</td>
                  <td className="py-4">
                    <span className="text-xs"
style={{ color: '#5AC8FA' }}>Executed</span>
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