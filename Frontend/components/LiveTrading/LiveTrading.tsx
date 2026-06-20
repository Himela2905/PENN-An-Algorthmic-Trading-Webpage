'use client';

import LiveChart from './LiveChart';
import { useEffect, useState } from 'react';
import {
  startLive,
  stopLive,
  getStatus,
  getPositions,
  getTrades,
  getPnl,
} from '../../lib/liveApi';

export default function LiveTrading() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [strategy, setStrategy] = useState('Golden Cross');
  const [qty, setQty] = useState(1);

  const [status, setStatus] = useState<any>({});
  const [positions, setPositions] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [pnl, setPnl] = useState<any>({ total: 0 });

  async function loadData() {
    try {
      const statusData = await getStatus();
      const positionsData = await getPositions();
      const tradesData = await getTrades();
      const pnlData = await getPnl();

      setStatus(statusData);
      setPositions(positionsData.positions || []);
      setTrades(tradesData.trades || []);
      setPnl(pnlData);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStart() {
    try {
      await startLive({
        symbol,
        strategy,
        qty,
      });

      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStop() {
    try {
      await stopLive();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadData();

    const interval = setInterval(() => {
      loadData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">

      <h1 className="text-4xl font-bold mb-6">
        Live Trading
      </h1>

      {/* Top Section */}

      <div className="grid grid-cols-4 gap-6 mb-8">

        {/* Controls */}

        <div className="bg-zinc-900 p-5 rounded-xl">

          <h2 className="text-xl mb-4 font-semibold">
            Strategy Control
          </h2>

          <input
            className="w-full p-2 rounded bg-zinc-800 mb-3"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Symbol"
          />

          <select
            className="w-full p-2 rounded bg-zinc-800 mb-3"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            <option>Golden Cross</option>
            <option>RSI</option>
            <option>EMA Cross</option>
            <option>MACD Cross</option>
            <option>SuperTrend</option>
          </select>

          <input
            type="number"
            className="w-full p-2 rounded bg-zinc-800 mb-4"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />

          <button
            onClick={handleStart}
            className="bg-green-600 px-4 py-2 rounded mr-3"
          >
            Start
          </button>

          <button
            onClick={handleStop}
            className="bg-red-600 px-4 py-2 rounded"
          >
            Stop
          </button>
        </div>


        <div className="col-span-3 bg-zinc-900 rounded-xl p-4">

            <LiveChart symbol={symbol} />

        </div>

        {/* Status */}

        <div className="bg-zinc-900 p-5 rounded-xl">

          <h2 className="text-xl mb-4 font-semibold">
            Live Status
          </h2>

          <p>
            Running:
            <span className="ml-2 font-bold">
              {status.running ? 'YES' : 'NO'}
            </span>
          </p>

          <p className="mt-2">
            Symbol:
            <span className="ml-2">
              {status.symbol || '-'}
            </span>
          </p>

          <p className="mt-2">
            Strategy:
            <span className="ml-2">
              {status.strategy || '-'}
            </span>
          </p>

          <p className="mt-2">
            Quantity:
            <span className="ml-2">
              {status.qty || 0}
            </span>
          </p>

        </div>

        {/* PnL */}

        <div className="bg-zinc-900 p-5 rounded-xl">

          <h2 className="text-xl mb-4 font-semibold">
            Portfolio PnL
          </h2>

          <div className="text-4xl font-bold text-green-400">
            ₹ {pnl.total || 0}
          </div>

        </div>

      </div>

      {/* Positions */}

      <div className="bg-zinc-900 p-5 rounded-xl mb-8">

        <h2 className="text-2xl font-semibold mb-4">
          Positions
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left border-b border-zinc-700">
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Entry</th>
              <th>Current</th>
              <th>PnL</th>
            </tr>
          </thead>

          <tbody>

            {positions.map((p, index) => (
              <tr
                key={index}
                className="border-b border-zinc-800"
              >
                <td>{p.symbol}</td>
                <td>{p.side}</td>
                <td>{p.qty}</td>
                <td>{p.avgEntry}</td>
                <td>{p.currentPrice}</td>
                <td>{p.pnl}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* Trades */}

      <div className="bg-zinc-900 p-5 rounded-xl">

        <h2 className="text-2xl font-semibold mb-4">
          Trade History
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left border-b border-zinc-700">
              <th>Time</th>
              <th>Symbol</th>
              <th>Side</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>

          <tbody>

            {trades.map((trade, index) => (
              <tr
                key={index}
                className="border-b border-zinc-800"
              >
                <td>{trade.time}</td>
                <td>{trade.symbol}</td>
                <td>{trade.side}</td>
                <td>{trade.qty}</td>
                <td>{trade.price}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  );
}