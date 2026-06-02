export default function TradeHistory() {
  const trades = [
    {
      type: "BUY",
      price: 19250,
      date: "2025-05-01",
    },
    {
      type: "SELL",
      price: 19580,
      date: "2025-05-06",
    },
    {
      type: "BUY",
      price: 19320,
      date: "2025-05-10",
    },
  ];

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5">

      {/* Header */}
      <div className="flex justify-between items-center mb-5">

        <div>
          <h2 className="text-lg font-semibold">
            Trade History
          </h2>

          <p className="text-sm text-zinc-500">
            Executed strategy trades
          </p>
        </div>

        <div className="text-sm text-zinc-400">
          {trades.length} Trades
        </div>

      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        <table className="w-full text-sm">

          <thead>

            <tr className="text-zinc-400 border-b border-zinc-800">

              <th className="text-left py-3">
                Type
              </th>

              <th className="text-left py-3">
                Price
              </th>

              <th className="text-left py-3">
                Date
              </th>

              <th className="text-left py-3">
                Status
              </th>

            </tr>

          </thead>

          <tbody>

            {trades.map((trade, index) => (
              <tr
                key={index}
                className="border-b border-zinc-900 hover:bg-zinc-900 transition"
              >

                {/* BUY/SELL */}
                <td className="py-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      trade.type === "BUY"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {trade.type}
                  </span>

                </td>

                {/* Price */}
                <td className="py-4 font-medium">
                  ₹{trade.price}
                </td>

                {/* Date */}
                <td className="py-4 text-zinc-400">
                  {trade.date}
                </td>

                {/* Status */}
                <td className="py-4">

                  <span className="text-blue-400 text-xs">
                    Executed
                  </span>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}