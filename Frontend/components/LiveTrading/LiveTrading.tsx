import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  ChevronDown,
  Search,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Design tokens                                                     */
/* ------------------------------------------------------------------ */

const COLOR = {
  bg: "#090B0F",
  surface: "#111419",
  surfaceRaised: "#161A21",
  border: "#1C2028",
  borderSoft: "#242933",
  text: "#E7E9ED",
  textMuted: "#8A93A3",
  textFaint: "#565E6B",
  jade: "#2FAE84",
  amber: "#F0923B",
  buy: "#1FA75E",
  sell: "#E5484D",
};

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Side = "BUY" | "SELL";
type OrderType = "market" | "limit";
type WidgetMode = "manual" | "algo";
type Tab = "positions" | "orders" | "history" | "signals";
type Timeframe = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W";

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
}

interface Position {
  symbol: string;
  side: "LONG" | "SHORT";
  qty: string;
  entry: number;
  mark: number;
  pnl: number;
  pnlPct: number;
}

interface PendingOrder {
  id: string;
  symbol: string;
  type: "LIMIT" | "STOP";
  side: Side;
  qty: string;
  price: number;
  status: "Working" | "Partial";
}

interface TradeRecord {
  id: string;
  symbol: string;
  side: Side;
  qty: string;
  price: number;
  total: number;
  time: string;
}

interface WatchlistItem {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
}

interface AlgoSignal {
  id: string;
  time: string;
  algorithm: string;
  symbol: string;
  signal: Side;
  confidence: number;
  price: number;
  status: "Executed" | "Skipped" | "Pending";
}

interface AlgoStats {
  activeAlgos: number;
  winRatePct: number;
  tradesTotal: number;
}

interface ModeData {
  balanceLabel: string;
  balance: number;
  buyingPower: number;
  dayPnl: number;
  dayPnlPct: number;
  marginUsedPct: number;
  positions: Position[];
  pendingOrders: PendingOrder[];
  history: TradeRecord[];
  watchlist: WatchlistItem[];
  movers: WatchlistItem[];
  algoSignals: AlgoSignal[];
  algoStats: AlgoStats;
}

interface SymbolInfo {
  symbol: string;
  name: string;
  price: number;
}

interface Algorithm {
  id: string;
  name: string;
  desc: string;
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const PAPER_DATA: ModeData = {
  balanceLabel: "Virtual USD",
  balance: 100000.0,
  buyingPower: 214300.55,
  dayPnl: 1842.3,
  dayPnlPct: 1.84,
  marginUsedPct: 22,
  positions: [
    { symbol: "AAPL", side: "LONG", qty: "500", entry: 189.32, mark: 196.87, pnl: 3775.0, pnlPct: 3.99 },
    { symbol: "TSLA", side: "LONG", qty: "220", entry: 244.1, mark: 231.5, pnl: -2772.0, pnlPct: -5.16 },
    { symbol: "BTC/USD", side: "LONG", qty: "3.5", entry: 61200, mark: 64850, pnl: 12775.0, pnlPct: 5.96 },
    { symbol: "NVDA", side: "SHORT", qty: "80", entry: 128.4, mark: 121.9, pnl: 520.0, pnlPct: 5.06 },
  ],
  pendingOrders: [
    { id: "P-10231", symbol: "MSFT", type: "LIMIT", side: "BUY", qty: "150", price: 418.0, status: "Working" },
    { id: "P-10244", symbol: "ETH/USD", type: "STOP", side: "SELL", qty: "12", price: 3050.0, status: "Working" },
    { id: "P-10259", symbol: "AMZN", type: "LIMIT", side: "BUY", qty: "60", price: 178.25, status: "Partial" },
  ],
  history: [
    { id: "H-88213", symbol: "AAPL", side: "BUY", qty: "500", price: 189.32, total: 94660.0, time: "09:34:12" },
    { id: "H-88220", symbol: "TSLA", side: "BUY", qty: "220", price: 244.1, total: 53702.0, time: "10:02:47" },
    { id: "H-88245", symbol: "BTC/USD", side: "BUY", qty: "3.5", price: 61200, total: 214200.0, time: "11:18:03" },
    { id: "H-88261", symbol: "NVDA", side: "SELL", qty: "80", price: 128.4, total: 10272.0, time: "13:47:29" },
  ],
  watchlist: [
    { symbol: "BTC/USD", name: "Bitcoin", price: 64850.2, changePct: 2.41 },
    { symbol: "AAPL", name: "Apple Inc.", price: 196.87, changePct: 0.85 },
    { symbol: "TSLA", name: "Tesla Inc.", price: 231.5, changePct: -1.94 },
    { symbol: "SPY", name: "S&P 500 ETF", price: 548.12, changePct: 0.32 },
    { symbol: "ETH/USD", name: "Ethereum", price: 3184.66, changePct: 1.12 },
  ],
  movers: [
    { symbol: "SMCI", name: "Super Micro", price: 812.4, changePct: 8.92 },
    { symbol: "COIN", name: "Coinbase", price: 244.1, changePct: 6.15 },
    { symbol: "PLTR", name: "Palantir", price: 27.83, changePct: -4.28 },
  ],
  algoSignals: [
    { id: "AS-5501", time: "09:32:10", algorithm: "Momentum Breakout", symbol: "AAPL", signal: "BUY", confidence: 82, price: 189.4, status: "Executed" },
    { id: "AS-5512", time: "10:14:55", algorithm: "EMA Crossover 9/21", symbol: "TSLA", signal: "SELL", confidence: 67, price: 238.1, status: "Executed" },
    { id: "AS-5528", time: "11:02:33", algorithm: "Mean Reversion (RSI)", symbol: "NVDA", signal: "BUY", confidence: 58, price: 124.8, status: "Skipped" },
    { id: "AS-5544", time: "12:47:19", algorithm: "Bollinger Squeeze", symbol: "BTC/USD", signal: "BUY", confidence: 74, price: 62100, status: "Executed" },
    { id: "AS-5561", time: "13:58:02", algorithm: "Momentum Breakout", symbol: "MSFT", signal: "SELL", confidence: 45, price: 421.2, status: "Skipped" },
  ],
  algoStats: { activeAlgos: 2, winRatePct: 63, tradesTotal: 48 },
};

const LIVE_DATA: ModeData = {
  balanceLabel: "USD · Live",
  balance: 2450.32,
  buyingPower: 3120.9,
  dayPnl: 12.4,
  dayPnlPct: 0.51,
  marginUsedPct: 8,
  positions: [
    { symbol: "AAPL", side: "LONG", qty: "3", entry: 191.1, mark: 196.87, pnl: 17.31, pnlPct: 3.02 },
    { symbol: "BTC/USD", side: "LONG", qty: "0.015", entry: 63100, mark: 64850.2, pnl: 26.25, pnlPct: 2.77 },
    { symbol: "SPY", side: "LONG", qty: "2", entry: 545.4, mark: 548.12, pnl: 5.44, pnlPct: 0.5 },
  ],
  pendingOrders: [
    { id: "L-40021", symbol: "ETH/USD", type: "LIMIT", side: "BUY", qty: "0.2", price: 3050.0, status: "Working" },
  ],
  history: [
    { id: "T-99031", symbol: "AAPL", side: "BUY", qty: "3", price: 191.1, total: 573.3, time: "09:41:02" },
    { id: "T-99048", symbol: "BTC/USD", side: "BUY", qty: "0.015", price: 63100, total: 946.5, time: "10:15:37" },
    { id: "T-99062", symbol: "SPY", side: "BUY", qty: "2", price: 545.4, total: 1090.8, time: "12:03:54" },
  ],
  watchlist: [
    { symbol: "BTC/USD", name: "Bitcoin", price: 64850.2, changePct: 2.41 },
    { symbol: "AAPL", name: "Apple Inc.", price: 196.87, changePct: 0.85 },
    { symbol: "SPY", name: "S&P 500 ETF", price: 548.12, changePct: 0.32 },
    { symbol: "ETH/USD", name: "Ethereum", price: 3184.66, changePct: 1.12 },
  ],
  movers: [
    { symbol: "COIN", name: "Coinbase", price: 244.1, changePct: 6.15 },
    { symbol: "PLTR", name: "Palantir", price: 27.83, changePct: -4.28 },
  ],
  algoSignals: [
    { id: "AS-9001", time: "09:40:02", algorithm: "Momentum Breakout", symbol: "AAPL", signal: "BUY", confidence: 79, price: 191.05, status: "Executed" },
    { id: "AS-9014", time: "11:58:41", algorithm: "Mean Reversion (RSI)", symbol: "SPY", signal: "SELL", confidence: 54, price: 547.2, status: "Pending" },
  ],
  algoStats: { activeAlgos: 1, winRatePct: 58, tradesTotal: 12 },
};

const TICKER_TAPE = [
  { symbol: "SPX", value: "5,487.03", changePct: 0.42 },
  { symbol: "NDX", value: "19,842.15", changePct: 0.61 },
  { symbol: "DJI", value: "39,150.33", changePct: -0.12 },
  { symbol: "BTC/USD", value: "64,850.20", changePct: 2.41 },
  { symbol: "ETH/USD", value: "3,184.66", changePct: 1.12 },
  { symbol: "AAPL", value: "196.87", changePct: 0.85 },
  { symbol: "TSLA", value: "231.50", changePct: -1.94 },
  { symbol: "NVDA", value: "121.90", changePct: -1.35 },
  { symbol: "EUR/USD", value: "1.0842", changePct: -0.08 },
  { symbol: "XAU/USD", value: "2,362.40", changePct: 0.29 },
];

const SYMBOL_DIRECTORY: SymbolInfo[] = [
  { symbol: "BTC/USD", name: "Bitcoin", price: 64850.2 },
  { symbol: "ETH/USD", name: "Ethereum", price: 3184.66 },
  { symbol: "AAPL", name: "Apple Inc.", price: 196.87 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 231.5 },
  { symbol: "MSFT", name: "Microsoft Corp.", price: 418.0 },
  { symbol: "GOOGL", name: "Alphabet Inc.", price: 172.35 },
  { symbol: "AMZN", name: "Amazon.com Inc.", price: 178.25 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 121.9 },
  { symbol: "META", name: "Meta Platforms", price: 502.1 },
  { symbol: "SPY", name: "S&P 500 ETF", price: 548.12 },
  { symbol: "COIN", name: "Coinbase Global", price: 244.1 },
  { symbol: "PLTR", name: "Palantir Technologies", price: 27.83 },
];

const ALGORITHMS: Algorithm[] = [
  { id: "momentum", name: "Momentum Breakout", desc: "Enters on volume-confirmed breakouts" },
  { id: "meanrev", name: "Mean Reversion (RSI)", desc: "Fades overbought / oversold extremes" },
  { id: "macross", name: "EMA Crossover 9/21", desc: "Trend-follows fast/slow EMA crosses" },
  { id: "bollinger", name: "Bollinger Squeeze", desc: "Trades volatility expansion breakouts" },
  { id: "grid", name: "Grid Trading", desc: "Layers orders across a price range" },
];

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

/* ------------------------------------------------------------------ */
/*  Deterministic generators (no Math.random → stable across renders) */
/* ------------------------------------------------------------------ */

function makeCandles(basePrice: number, volatility: number, count: number): Candle[] {
  const out: Candle[] = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const open = price;
    const drift = Math.sin(i * 0.7) * volatility + Math.cos(i * 1.35) * volatility * 0.45;
    const close = open + drift;
    const high = Math.max(open, close) + Math.abs(Math.sin(i * 2.05)) * volatility * 0.55;
    const low = Math.min(open, close) - Math.abs(Math.cos(i * 1.85)) * volatility * 0.55;
    out.push({ open, close, high, low });
    price = close;
  }
  return out;
}

function seedFromString(s: string): number {
  return s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

interface BookLevel {
  price: number;
  size: number;
  cumulative: number;
}

function makeBookLevels(base: number, tick: number, count: number, direction: 1 | -1, seed: number): BookLevel[] {
  let cumulative = 0;
  const levels: BookLevel[] = [];
  for (let i = 0; i < count; i++) {
    const size = 0.4 + Math.abs(Math.sin((i + seed) * 1.7)) * 3.2;
    cumulative += size;
    levels.push({ price: base + direction * tick * (i + 1), size, cumulative });
  }
  return levels;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */

const fmtUSD = (n: number, decimals = 2) =>
  n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtSigned = (n: number, decimals = 2) => `${n >= 0 ? "+" : ""}${fmtUSD(n, decimals)}`;

/* ------------------------------------------------------------------ */
/*  Symbol search combobox                                            */
/* ------------------------------------------------------------------ */

function SymbolSearch({ onSelect }: { onSelect: (symbol: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = (
    query.trim()
      ? SYMBOL_DIRECTORY.filter(
          (s) =>
            s.symbol.toLowerCase().includes(query.toLowerCase()) ||
            s.name.toLowerCase().includes(query.toLowerCase())
        )
      : SYMBOL_DIRECTORY
  ).slice(0, 6);

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <div
        className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5"
        style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}
      >
        <Search className="h-3.5 w-3.5 shrink-0" style={{ color: COLOR.textFaint }} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search AAPL, TSLA…"
          className="bg-transparent outline-none text-[12px] w-28 sm:w-40"
          style={{ color: COLOR.text }}
        />
      </div>
      {open && (
        <div
          className="absolute right-0 mt-1.5 w-64 rounded-md border overflow-hidden z-20 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          style={{ borderColor: COLOR.border, backgroundColor: COLOR.surfaceRaised }}
        >
          {filtered.length === 0 && (
            <p className="px-3 py-2.5 text-[12px]" style={{ color: COLOR.textFaint }}>
              No matches
            </p>
          )}
          {filtered.map((s) => (
            <button
              key={s.symbol}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s.symbol);
                setQuery("");
                setOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.05] transition-colors"
            >
              <div>
                <p className="text-[12.5px] font-semibold">{s.symbol}</p>
                <p className="text-[10.5px]" style={{ color: COLOR.textFaint }}>
                  {s.name}
                </p>
              </div>
              <span className="font-mono text-[11.5px] tabular-nums" style={{ color: COLOR.textMuted }}>
                ${fmtUSD(s.price)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Algorithm select combobox                                         */
/* ------------------------------------------------------------------ */

function AlgoSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = ALGORITHMS.find((a) => a.id === value) ?? ALGORITHMS[0];

  return (
    <div
      className="relative mb-3"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <label className="text-[11px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>
        Algorithm
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left"
        style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}
      >
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold truncate">{current.name}</p>
          <p className="text-[10px] truncate" style={{ color: COLOR.textFaint }}>
            {current.desc}
          </p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: COLOR.textFaint }} />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-md border overflow-hidden z-20 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          style={{ borderColor: COLOR.border, backgroundColor: COLOR.surfaceRaised }}
        >
          {ALGORITHMS.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(a.id);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors"
              style={a.id === value ? { backgroundColor: `${COLOR.jade}14` } : undefined}
            >
              <p className="text-[12px] font-semibold">{a.name}</p>
              <p className="text-[10px]" style={{ color: COLOR.textFaint }}>
                {a.desc}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sparkline                                                          */
/* ------------------------------------------------------------------ */

function Sparkline({ symbol, up }: { symbol: string; up: boolean }) {
  const seed = seedFromString(symbol);
  const points = Array.from({ length: 14 }, (_, i) => {
    const trend = up ? i * 1.3 : -i * 1.3;
    return 50 + Math.sin((i + seed) * 0.85) * 16 + Math.cos((i + seed) * 0.5) * 8 + trend;
  });
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const coords = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 56;
      const y = 18 - ((v - min) / range) * 16 - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 56 18" className="h-[18px] w-14 shrink-0">
      <polyline
        points={coords}
        fill="none"
        stroke={up ? COLOR.buy : COLOR.sell}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Candlestick chart with volume subplot                            */
/* ------------------------------------------------------------------ */

function PriceChart({ candles }: { candles: Candle[] }) {
  const width = 800;
  const priceHeight = 216;
  const volHeight = 44;
  const gap = 8;
  const totalHeight = priceHeight + gap + volHeight;
  const padding = 8;

  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || 1;

  const volumes = candles.map((c) => Math.abs(c.close - c.open) * 3.2 + 6);
  const maxVol = Math.max(...volumes);

  const slotWidth = (width - padding * 2) / candles.length;
  const bodyWidth = Math.max(slotWidth * 0.5, 2);

  const yFor = (v: number) => padding + (1 - (v - min) / range) * (priceHeight - padding * 2);
  const lastClose = candles[candles.length - 1].close;
  const lastY = yFor(lastClose);

  return (
    <svg viewBox={`0 0 ${width} ${totalHeight}`} className="w-full h-[17rem]">
      {[0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={0}
          x2={width}
          y1={padding + (i * (priceHeight - padding * 2)) / 3}
          y2={padding + (i * (priceHeight - padding * 2)) / 3}
          stroke={COLOR.border}
          strokeWidth={1}
        />
      ))}

      <line x1={0} x2={width} y1={lastY} y2={lastY} stroke={COLOR.textFaint} strokeWidth={1} strokeDasharray="3,4" />

      {candles.map((c, i) => {
        const x = padding + i * slotWidth + slotWidth / 2;
        const up = c.close >= c.open;
        const color = up ? COLOR.buy : COLOR.sell;
        const bodyTop = yFor(Math.max(c.open, c.close));
        const bodyBottom = yFor(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yFor(c.high)} y2={yFor(c.low)} stroke={color} strokeWidth={1.3} />
            <rect
              x={x - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={Math.max(bodyBottom - bodyTop, 1.4)}
              fill={color}
              rx={0.5}
            />
          </g>
        );
      })}

      <g transform={`translate(0, ${priceHeight + gap})`}>
        {candles.map((c, i) => {
          const x = padding + i * slotWidth + slotWidth / 2;
          const up = c.close >= c.open;
          const h = (volumes[i] / maxVol) * volHeight;
          return (
            <rect
              key={i}
              x={x - bodyWidth / 2}
              y={volHeight - h}
              width={bodyWidth}
              height={h}
              fill={up ? COLOR.buy : COLOR.sell}
              opacity={0.35}
            />
          );
        })}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Order book depth ladder                                           */
/* ------------------------------------------------------------------ */

function OrderBook({ midPrice, symbol }: { midPrice: number; symbol: string }) {
  const seed = seedFromString(symbol);
  const tick = midPrice > 1000 ? 5 : midPrice > 10 ? 0.05 : 0.0005;
  const asks = useMemo(() => makeBookLevels(midPrice, tick, 8, 1, seed).reverse(), [midPrice, tick, seed]);
  const bids = useMemo(() => makeBookLevels(midPrice, tick, 8, -1, seed + 7), [midPrice, tick, seed]);
  const maxCum = Math.max(asks[0]?.cumulative ?? 1, bids[bids.length - 1]?.cumulative ?? 1);

  const decimals = midPrice > 1000 ? 0 : midPrice > 10 ? 2 : 4;

  return (
    <div className="flex flex-col h-full text-[11px]">
      <div className="grid grid-cols-2 px-0.5 pb-1.5 uppercase tracking-[0.06em]" style={{ color: COLOR.textFaint }}>
        <span>Price</span>
        <span className="text-right">Size</span>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        {asks.map((l, i) => (
          <div key={`a${i}`} className="relative grid grid-cols-2 py-[3px]">
            <div
              className="absolute inset-y-0 right-0"
              style={{ width: `${(l.cumulative / maxCum) * 100}%`, backgroundColor: `${COLOR.sell}14` }}
            />
            <span className="relative z-10 font-mono tabular-nums" style={{ color: COLOR.sell }}>
              {fmtUSD(l.price, decimals)}
            </span>
            <span className="relative z-10 font-mono tabular-nums text-right" style={{ color: COLOR.textMuted }}>
              {l.size.toFixed(3)}
            </span>
          </div>
        ))}
      </div>

      <div
        className="my-1.5 flex items-center justify-center rounded-[4px] py-1 font-mono text-[12px] font-semibold tabular-nums"
        style={{ backgroundColor: COLOR.surfaceRaised, color: COLOR.text }}
      >
        {fmtUSD(midPrice, decimals)}
      </div>

      <div>
        {bids.map((l, i) => (
          <div key={`b${i}`} className="relative grid grid-cols-2 py-[3px]">
            <div
              className="absolute inset-y-0 right-0"
              style={{ width: `${(l.cumulative / maxCum) * 100}%`, backgroundColor: `${COLOR.buy}14` }}
            />
            <span className="relative z-10 font-mono tabular-nums" style={{ color: COLOR.buy }}>
              {fmtUSD(l.price, decimals)}
            </span>
            <span className="relative z-10 font-mono tabular-nums text-right" style={{ color: COLOR.textMuted }}>
              {l.size.toFixed(3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mode switch (signature control)                                   */
/* ------------------------------------------------------------------ */

function ModeSwitch({ isLive, onChange }: { isLive: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLive}
      onClick={() => onChange(!isLive)}
      className="relative flex h-9 w-56 items-center rounded-md border p-0.5 transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2"
      style={{
        borderColor: isLive ? `${COLOR.amber}55` : `${COLOR.jade}55`,
        backgroundColor: COLOR.surface,
      }}
    >
      <span
        className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-[5px] transition-all duration-300 ease-out"
        style={{
          left: isLive ? "calc(50% + 1px)" : "2px",
          backgroundColor: isLive ? COLOR.amber : COLOR.jade,
        }}
      />
      <span
        className="relative z-10 flex-1 text-center text-[10.5px] font-semibold uppercase tracking-wide transition-colors duration-300"
        style={{ color: !isLive ? "#090B0F" : COLOR.textMuted }}
      >
        Paper
      </span>
      <span
        className="relative z-10 flex-1 text-center text-[10.5px] font-semibold uppercase tracking-wide transition-colors duration-300"
        style={{ color: isLive ? "#090B0F" : COLOR.textMuted }}
      >
        Live
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: COLOR.textFaint }}>
      {children}
    </h2>
  );
}

function KpiTile({
  label,
  value,
  delta,
  accentColor,
}: {
  label: string;
  value: string;
  delta?: string;
  accentColor?: string;
}) {
  return (
    <div
      className="flex-1 min-w-[140px] rounded-lg border px-4 py-3"
      style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
    >
      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: COLOR.textFaint }}>
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-[16px] font-semibold tabular-nums">{value}</p>
        {delta && (
          <p className="font-mono text-[11px] font-medium tabular-nums" style={{ color: accentColor }}>
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function TradingDashboard() {
  const [isLiveTrading, setIsLiveTrading] = useState<boolean>(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("1H");
  const [symbol, setSymbol] = useState<string>("BTC/USD");
  const [widgetMode, setWidgetMode] = useState<WidgetMode>("manual");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [orderSide, setOrderSide] = useState<Side>("BUY");
  const [quantity, setQuantity] = useState<string>("0.10");
  const [limitPrice, setLimitPrice] = useState<string>("64500.00");
  const [algoId, setAlgoId] = useState<string>(ALGORITHMS[0].id);
  const [isAlgoRunning, setIsAlgoRunning] = useState<boolean>(false);
  const [positionSizePct, setPositionSizePct] = useState<string>("5");
  const [stopLossPct, setStopLossPct] = useState<string>("2.0");
  const [takeProfitPct, setTakeProfitPct] = useState<string>("4.0");
  const [maxTradesPerDay, setMaxTradesPerDay] = useState<string>("10");
  const [activeTab, setActiveTab] = useState<Tab>("positions");
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const data = isLiveTrading ? LIVE_DATA : PAPER_DATA;
  const accent = isLiveTrading ? COLOR.amber : COLOR.jade;
  const currentAlgo = ALGORITHMS.find((a) => a.id === algoId) ?? ALGORITHMS[0];

  const symbolInfo = useMemo(
    () => SYMBOL_DIRECTORY.find((s) => s.symbol === symbol) ?? SYMBOL_DIRECTORY[0],
    [symbol]
  );

  const candles = useMemo(
    () =>
      makeCandles(
        symbolInfo.price,
        symbolInfo.price * (isLiveTrading ? 0.01 : 0.014),
        40
      ),
    [symbolInfo, isLiveTrading]
  );

  useEffect(() => {
    setLimitPrice(symbolInfo.price.toFixed(symbolInfo.price > 10 ? 2 : 4));
  }, [symbolInfo]);

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const priceChange = lastCandle.close - firstCandle.open;
  const priceChangePct = (priceChange / firstCandle.open) * 100;

  const stats = useMemo(() => {
    const highs = candles.map((c) => c.high);
    const lows = candles.map((c) => c.low);
    const volume = candles.reduce((sum, c) => sum + Math.abs(c.close - c.open) * 42 + 180, 0);
    return {
      open: firstCandle.open,
      high: Math.max(...highs),
      low: Math.min(...lows),
      volume,
    };
  }, [candles, firstCandle]);

  const openPnl = useMemo(() => data.positions.reduce((sum, p) => sum + p.pnl, 0), [data.positions]);

  const clock = now.toLocaleTimeString("en-US", { hour12: false });

  return (
    <div
      className="min-h-screen w-full font-sans antialiased"
      style={{ backgroundColor: COLOR.bg, color: COLOR.text }}
    >
      <style>{`
        @keyframes ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 38s linear infinite;
        }
      `}</style>

      {/* Scrolling ticker tape */}
      <div className="overflow-hidden border-b" style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
        <div className="flex w-max whitespace-nowrap ticker-track">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex items-center">
              {TICKER_TAPE.map((t, i) => (
                <div key={`${dup}-${i}`} className="flex items-center gap-1.5 px-4 py-1.5 text-[11px]">
                  <span className="font-semibold" style={{ color: COLOR.textMuted }}>
                    {t.symbol}
                  </span>
                  <span className="font-mono tabular-nums">{t.value}</span>
                  <span
                    className="font-mono tabular-nums"
                    style={{ color: t.changePct >= 0 ? COLOR.buy : COLOR.sell }}
                  >
                    {fmtSigned(t.changePct)}%
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* top accent bar — quiet signature of current mode */}
      <div className="h-[2px] w-full transition-colors duration-300" style={{ backgroundColor: accent }} />

      {/* -------------------------------------------------------- */}
      {/* Header                                                   */}
      {/* -------------------------------------------------------- */}
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{ borderColor: COLOR.border, backgroundColor: `${COLOR.bg}F2` }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-7 min-w-0">
              <div className="flex items-center gap-2.5 shrink-0">
                <div
                  className="h-8 w-8 rounded-md border flex items-center justify-center font-mono text-[13px] font-bold"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.surfaceRaised, color: accent }}
                >
                  M
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="font-semibold text-[14px] tracking-tight">Penn</p>
                  <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: COLOR.textFaint }}>
                    Algo Markets Terminal
                  </p>
                </div>
              </div>
              <nav className="hidden lg:flex items-center gap-6 text-[13px]">
                <a className="font-medium relative pb-[19px]" style={{ color: COLOR.text }}>
                  Dashboard
                  <span
                    className="absolute -bottom-[1px] left-0 right-0 h-[2px] rounded-full"
                    style={{ backgroundColor: accent }}
                  />
                </a>
                <a className="pb-[19px]" style={{ color: COLOR.textMuted }}>
                  Markets
                </a>
                <a className="pb-[19px]" style={{ color: COLOR.textMuted }}>
                  Algorithms
                </a>
                <a className="pb-[19px]" style={{ color: COLOR.textMuted }}>
                  History
                </a>
              </nav>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              <div className="hidden md:flex items-center gap-1.5 text-[11px]" style={{ color: COLOR.textFaint }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full" style={{ backgroundColor: COLOR.buy }} />
                </span>
                <span style={{ color: COLOR.textMuted }}>Markets Open</span>
                <span className="font-mono tabular-nums">{clock}</span>
              </div>
              <div
                className="hidden md:flex items-center gap-2.5 rounded-md border px-3 py-1.5"
                style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
              >
                <Wallet className="h-3.5 w-3.5" style={{ color: COLOR.textFaint }} />
                <div className="text-right leading-tight">
                  <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: COLOR.textFaint }}>
                    {data.balanceLabel}
                  </p>
                  <p className="font-mono text-[13px] font-semibold tabular-nums">${fmtUSD(data.balance)}</p>
                </div>
              </div>
              <ModeSwitch isLive={isLiveTrading} onChange={setIsLiveTrading} />
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------- */}
      {/* Mode banner / badge                                       */}
      {/* -------------------------------------------------------- */}
      <div
        className="border-b transition-colors duration-300"
        style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface, borderLeftWidth: 3, borderLeftColor: accent }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2.5 text-[12px]">
          {isLiveTrading ? (
            <>
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75"
                  style={{ backgroundColor: COLOR.sell }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: COLOR.sell }} />
              </span>
              <span
                className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 font-semibold uppercase tracking-[0.06em] text-[11px]"
                style={{ backgroundColor: `${COLOR.amber}1F`, color: COLOR.amber }}
              >
                <AlertTriangle className="h-3 w-3" />
                Real Money Live
              </span>
              <span className="hidden sm:inline" style={{ color: COLOR.textMuted }}>
                Orders and algorithms route to your funded brokerage account — review parameters before starting.
              </span>
            </>
          ) : (
            <>
              <span
                className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 font-semibold uppercase tracking-[0.06em] text-[11px]"
                style={{ backgroundColor: `${COLOR.jade}1F`, color: COLOR.jade }}
              >
                <ShieldCheck className="h-3 w-3" />
                Demo / Virtual Mode
              </span>
              <span className="hidden sm:inline" style={{ color: COLOR.textMuted }}>
                Simulated fills on a virtual balance — no real capital is at risk.
              </span>
            </>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* Main content                                              */}
      {/* -------------------------------------------------------- */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-4">
        {/* Account summary strip */}
        <div className="flex flex-wrap gap-3">
          <KpiTile label="Total Equity" value={`$${fmtUSD(data.balance)}`} />
          <KpiTile
            label="Day P&L"
            value={`${fmtSigned(data.dayPnl)}`}
            delta={`${fmtSigned(data.dayPnlPct)}%`}
            accentColor={data.dayPnl >= 0 ? COLOR.buy : COLOR.sell}
          />
          <KpiTile
            label="Open P&L"
            value={`${fmtSigned(openPnl)}`}
            delta={`${data.positions.length} positions`}
            accentColor={openPnl >= 0 ? COLOR.buy : COLOR.sell}
          />
          <KpiTile label="Buying Power" value={`$${fmtUSD(data.buyingPower)}`} />
          <KpiTile
            label="Active Algorithms"
            value={`${data.algoStats.activeAlgos} Running`}
            delta={`${data.algoStats.winRatePct}% win rate`}
            accentColor={accent}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* ---------------------------------------------------- */}
          {/* Chart                                                 */}
          {/* ---------------------------------------------------- */}
          <section
            className="lg:col-span-5 rounded-lg border p-4"
            style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">{symbol}</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-[21px] font-semibold tabular-nums">
                    ${fmtUSD(lastCandle.close)}
                  </span>
                  <span
                    className="flex items-center gap-0.5 text-[12px] font-medium font-mono tabular-nums"
                    style={{ color: priceChange >= 0 ? COLOR.buy : COLOR.sell }}
                  >
                    {priceChange >= 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    )}
                    {fmtSigned(priceChange)} ({fmtSigned(priceChangePct)}%)
                  </span>
                </div>
              </div>
              <SymbolSearch onSelect={setSymbol} />
            </div>

            <div
              className="grid grid-cols-4 gap-2 mb-3 rounded-md border px-3 py-2"
              style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}
            >
              {[
                { label: "Open", value: `$${fmtUSD(stats.open)}` },
                { label: "High", value: `$${fmtUSD(stats.high)}` },
                { label: "Low", value: `$${fmtUSD(stats.low)}` },
                { label: "Vol", value: stats.volume.toLocaleString("en-US", { maximumFractionDigits: 0 }) },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[9.5px] uppercase tracking-[0.06em]" style={{ color: COLOR.textFaint }}>
                    {s.label}
                  </p>
                  <p className="font-mono text-[12px] tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>

            <PriceChart candles={candles} />

            <div className="flex gap-1 mt-3 flex-wrap border-t pt-3" style={{ borderColor: COLOR.border }}>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className="px-2.5 py-1 rounded-[4px] text-[11px] font-semibold font-mono transition-colors"
                  style={timeframe === tf ? { backgroundColor: accent, color: "#090B0F" } : { color: COLOR.textMuted }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </section>

          {/* ---------------------------------------------------- */}
          {/* Order book                                            */}
          {/* ---------------------------------------------------- */}
          <section
            className="lg:col-span-2 rounded-lg border p-3.5"
            style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
          >
            <SectionHeading>Order Book</SectionHeading>
            <div className="mt-2.5">
              <OrderBook midPrice={lastCandle.close} symbol={symbol} />
            </div>
          </section>

          {/* ---------------------------------------------------- */}
          {/* Order / Algorithm widget                              */}
          {/* ---------------------------------------------------- */}
          <section
            className="lg:col-span-3 rounded-lg border p-4 flex flex-col"
            style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
          >
            <div className="flex items-center justify-between mb-3">
              <SectionHeading>{widgetMode === "algo" ? "Algorithm Control" : "Place Order"}</SectionHeading>
              <span className="font-mono text-[11px]" style={{ color: COLOR.textFaint }}>
                {symbol}
              </span>
            </div>

            <div
              className="grid grid-cols-2 gap-1 rounded-md p-1 mb-3"
              style={{ backgroundColor: COLOR.bg, border: `1px solid ${COLOR.border}` }}
            >
              <button
                onClick={() => setWidgetMode("manual")}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-wide transition-colors"
                style={
                  widgetMode === "manual"
                    ? { backgroundColor: COLOR.surfaceRaised, color: COLOR.text }
                    : { color: COLOR.textFaint }
                }
              >
                Manual
              </button>
              <button
                onClick={() => setWidgetMode("algo")}
                className="flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-wide transition-colors"
                style={
                  widgetMode === "algo"
                    ? { backgroundColor: COLOR.surfaceRaised, color: COLOR.text }
                    : { color: COLOR.textFaint }
                }
              >
                <Bot className="h-3 w-3 inline mr-1 -mt-0.5" />
                Algorithmic
              </button>
            </div>

            {widgetMode === "manual" ? (
              <>
                <div
                  className="grid grid-cols-2 gap-1 rounded-md p-1 mb-3"
                  style={{ backgroundColor: COLOR.bg, border: `1px solid ${COLOR.border}` }}
                >
                  {(["market", "limit"] as OrderType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderType(t)}
                      className="py-1.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-wide transition-colors"
                      style={
                        orderType === t
                          ? { backgroundColor: COLOR.surfaceRaised, color: COLOR.text }
                          : { color: COLOR.textFaint }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    onClick={() => setOrderSide("BUY")}
                    className="py-2 rounded-md text-[12px] font-bold uppercase tracking-wide border transition-colors"
                    style={
                      orderSide === "BUY"
                        ? { backgroundColor: COLOR.buy, borderColor: COLOR.buy, color: "#08150F" }
                        : { borderColor: COLOR.border, color: COLOR.textMuted }
                    }
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setOrderSide("SELL")}
                    className="py-2 rounded-md text-[12px] font-bold uppercase tracking-wide border transition-colors"
                    style={
                      orderSide === "SELL"
                        ? { backgroundColor: COLOR.sell, borderColor: COLOR.sell, color: "#1A0808" }
                        : { borderColor: COLOR.border, color: COLOR.textMuted }
                    }
                  >
                    Sell
                  </button>
                </div>

                <label className="text-[11px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>
                  Quantity
                </label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 font-mono text-[13px] mb-3 outline-none tabular-nums"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.text }}
                  placeholder="0.00"
                />

                {orderType === "limit" && (
                  <>
                    <label className="text-[11px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>
                      Limit Price (USD)
                    </label>
                    <input
                      type="text"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 font-mono text-[13px] mb-3 outline-none tabular-nums"
                      style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.text }}
                      placeholder="0.00"
                    />
                  </>
                )}

                <div
                  className="rounded-md border px-3 py-2 mb-4 text-[11px] space-y-1.5"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}
                >
                  <div className="flex justify-between">
                    <span style={{ color: COLOR.textFaint }}>Est. total</span>
                    <span className="font-mono tabular-nums" style={{ color: COLOR.text }}>
                      $
                      {fmtUSD(
                        (parseFloat(quantity || "0") || 0) *
                          (orderType === "limit" ? parseFloat(limitPrice || "0") || 0 : lastCandle.close)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLOR.textFaint }}>Available</span>
                    <span className="font-mono tabular-nums" style={{ color: COLOR.text }}>
                      ${fmtUSD(data.buyingPower)}
                    </span>
                  </div>
                </div>

                <button
                  className="mt-auto w-full rounded-md py-3 text-[12px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: orderSide === "BUY" ? COLOR.buy : COLOR.sell,
                    color: orderSide === "BUY" ? "#08150F" : "#1A0808",
                  }}
                >
                  {orderSide === "BUY" ? "Buy" : "Sell"} {symbol} · {isLiveTrading ? "Real Funds" : "Paper"}
                </button>
              </>
            ) : (
              <>
                <AlgoSelect value={algoId} onChange={setAlgoId} />

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-[10.5px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>
                      Position Size (%)
                    </label>
                    <input
                      type="text"
                      value={positionSizePct}
                      onChange={(e) => setPositionSizePct(e.target.value)}
                      className="w-full rounded-md border px-2.5 py-1.5 font-mono text-[12.5px] outline-none tabular-nums"
                      style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.text }}
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>
                      Max Trades / Day
                    </label>
                    <input
                      type="text"
                      value={maxTradesPerDay}
                      onChange={(e) => setMaxTradesPerDay(e.target.value)}
                      className="w-full rounded-md border px-2.5 py-1.5 font-mono text-[12.5px] outline-none tabular-nums"
                      style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.text }}
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>
                      Stop Loss (%)
                    </label>
                    <input
                      type="text"
                      value={stopLossPct}
                      onChange={(e) => setStopLossPct(e.target.value)}
                      className="w-full rounded-md border px-2.5 py-1.5 font-mono text-[12.5px] outline-none tabular-nums"
                      style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.sell }}
                    />
                  </div>
                  <div>
                    <label className="text-[10.5px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>
                      Take Profit (%)
                    </label>
                    <input
                      type="text"
                      value={takeProfitPct}
                      onChange={(e) => setTakeProfitPct(e.target.value)}
                      className="w-full rounded-md border px-2.5 py-1.5 font-mono text-[12.5px] outline-none tabular-nums"
                      style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.buy }}
                    />
                  </div>
                </div>

                <div
                  className="rounded-md border px-3 py-2 mb-4 text-[11px] space-y-1.5"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: isAlgoRunning ? COLOR.buy : COLOR.textFaint }}
                    />
                    <span className="font-medium" style={{ color: isAlgoRunning ? COLOR.buy : COLOR.textFaint }}>
                      {isAlgoRunning ? `Running — scanning ${symbol}` : "Stopped"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLOR.textFaint }}>Strategy</span>
                    <span style={{ color: COLOR.text }}>{currentAlgo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLOR.textFaint }}>Last signal</span>
                    <span className="font-mono tabular-nums" style={{ color: COLOR.text }}>
                      BUY {symbol} @ ${fmtUSD(lastCandle.close)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsAlgoRunning((r) => !r)}
                  className="mt-auto w-full rounded-md py-3 text-[12px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: isAlgoRunning ? COLOR.sell : COLOR.buy,
                    color: isAlgoRunning ? "#1A0808" : "#08150F",
                  }}
                >
                  {isAlgoRunning ? "Stop Algorithm" : "Start Algorithm"}
                </button>
              </>
            )}
          </section>

          {/* ---------------------------------------------------- */}
          {/* Watchlist & movers                                    */}
          {/* ---------------------------------------------------- */}
          <section className="lg:col-span-2 flex flex-col gap-4">
            <div
              className="rounded-lg border p-3.5"
              style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <Star className="h-3 w-3" style={{ color: COLOR.textFaint }} />
                <SectionHeading>Watchlist</SectionHeading>
              </div>
              <ul>
                {data.watchlist.map((w) => (
                  <li
                    key={w.symbol}
                    className="flex items-center justify-between gap-2 py-1.5 border-t first:border-t-0 cursor-pointer"
                    style={{ borderColor: COLOR.border }}
                    onClick={() => setSymbol(w.symbol)}
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold leading-tight">{w.symbol}</p>
                      <p className="text-[10px] truncate" style={{ color: COLOR.textFaint }}>
                        {w.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[12.5px] tabular-nums">${fmtUSD(w.price)}</p>
                      <p
                        className="text-[10.5px] font-medium font-mono tabular-nums"
                        style={{ color: w.changePct >= 0 ? COLOR.buy : COLOR.sell }}
                      >
                        {fmtSigned(w.changePct)}%
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className="rounded-lg border p-3.5"
              style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
            >
              <SectionHeading>Market Movers</SectionHeading>
              <ul>
                {data.movers.map((m) => (
                  <li
                    key={m.symbol}
                    className="flex items-center justify-between gap-2 py-1.5 border-t mt-2.5 cursor-pointer"
                    style={{ borderColor: COLOR.border }}
                    onClick={() => setSymbol(m.symbol)}
                  >
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold leading-tight">{m.symbol}</p>
                      <p className="text-[10px] truncate" style={{ color: COLOR.textFaint }}>
                        {m.name}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-[12.5px] tabular-nums">${fmtUSD(m.price)}</p>
                      <p
                        className="text-[10.5px] font-medium font-mono tabular-nums"
                        style={{ color: m.changePct >= 0 ? COLOR.buy : COLOR.sell }}
                      >
                        {fmtSigned(m.changePct)}%
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* ---------------------------------------------------------- */}
        {/* Positions / Orders / History / Algo Signals                 */}
        {/* ---------------------------------------------------------- */}
        <section
          className="rounded-lg border overflow-hidden"
          style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}
        >
          <div className="flex items-center gap-5 border-b px-4 sm:px-5 overflow-x-auto" style={{ borderColor: COLOR.border }}>
            {[
              { id: "positions" as Tab, label: `Open Positions (${data.positions.length})` },
              { id: "orders" as Tab, label: `Pending Orders (${data.pendingOrders.length})` },
              { id: "history" as Tab, label: "Trade History" },
              { id: "signals" as Tab, label: `Algo Signals (${data.algoSignals.length})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
                style={
                  activeTab === t.id
                    ? { borderColor: accent, color: COLOR.text }
                    : { borderColor: "transparent", color: COLOR.textFaint }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {activeTab === "positions" && (
              <table className="w-full text-[12.5px] min-w-[640px]">
                <thead>
                  <tr
                    className="text-left text-[10px] uppercase tracking-[0.08em] border-b"
                    style={{ color: COLOR.textFaint, borderColor: COLOR.border }}
                  >
                    <th className="px-4 sm:px-5 py-2 font-medium">Symbol</th>
                    <th className="px-4 py-2 font-medium">Side</th>
                    <th className="px-4 py-2 font-medium text-right">Qty</th>
                    <th className="px-4 py-2 font-medium text-right">Entry</th>
                    <th className="px-4 py-2 font-medium text-right">Mark</th>
                    <th className="px-4 sm:px-5 py-2 font-medium text-right">P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.positions.map((p) => (
                    <tr
                      key={p.symbol}
                      className="border-b last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: COLOR.border }}
                    >
                      <td className="px-4 sm:px-5 py-2 font-semibold">{p.symbol}</td>
                      <td className="px-4 py-2">
                        <span
                          className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wide"
                          style={
                            p.side === "LONG"
                              ? { backgroundColor: `${COLOR.buy}1F`, color: COLOR.buy }
                              : { backgroundColor: `${COLOR.sell}1F`, color: COLOR.sell }
                          }
                        >
                          {p.side}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">{p.qty}</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">${fmtUSD(p.entry)}</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">${fmtUSD(p.mark)}</td>
                      <td
                        className="px-4 sm:px-5 py-2 font-mono text-right tabular-nums font-medium"
                        style={{ color: p.pnl >= 0 ? COLOR.buy : COLOR.sell }}
                      >
                        {fmtSigned(p.pnl)} ({fmtSigned(p.pnlPct)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "orders" && (
              <table className="w-full text-[12.5px] min-w-[640px]">
                <thead>
                  <tr
                    className="text-left text-[10px] uppercase tracking-[0.08em] border-b"
                    style={{ color: COLOR.textFaint, borderColor: COLOR.border }}
                  >
                    <th className="px-4 sm:px-5 py-2 font-medium">Order ID</th>
                    <th className="px-4 py-2 font-medium">Symbol</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Side</th>
                    <th className="px-4 py-2 font-medium text-right">Qty</th>
                    <th className="px-4 py-2 font-medium text-right">Price</th>
                    <th className="px-4 sm:px-5 py-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pendingOrders.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: COLOR.border }}
                    >
                      <td className="px-4 sm:px-5 py-2 font-mono" style={{ color: COLOR.textMuted }}>
                        {o.id}
                      </td>
                      <td className="px-4 py-2 font-semibold">{o.symbol}</td>
                      <td className="px-4 py-2" style={{ color: COLOR.textMuted }}>
                        {o.type}
                      </td>
                      <td className="px-4 py-2 font-semibold" style={{ color: o.side === "BUY" ? COLOR.buy : COLOR.sell }}>
                        {o.side}
                      </td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">{o.qty}</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">${fmtUSD(o.price)}</td>
                      <td className="px-4 sm:px-5 py-2 text-right">
                        <span
                          className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wide"
                          style={{ backgroundColor: COLOR.surfaceRaised, color: COLOR.textMuted }}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.pendingOrders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 sm:px-5 py-6 text-center" style={{ color: COLOR.textFaint }}>
                        No pending orders.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "history" && (
              <table className="w-full text-[12.5px] min-w-[640px]">
                <thead>
                  <tr
                    className="text-left text-[10px] uppercase tracking-[0.08em] border-b"
                    style={{ color: COLOR.textFaint, borderColor: COLOR.border }}
                  >
                    <th className="px-4 sm:px-5 py-2 font-medium">Trade ID</th>
                    <th className="px-4 py-2 font-medium">Symbol</th>
                    <th className="px-4 py-2 font-medium">Side</th>
                    <th className="px-4 py-2 font-medium text-right">Qty</th>
                    <th className="px-4 py-2 font-medium text-right">Price</th>
                    <th className="px-4 py-2 font-medium text-right">Total</th>
                    <th className="px-4 sm:px-5 py-2 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((h) => (
                    <tr
                      key={h.id}
                      className="border-b last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: COLOR.border }}
                    >
                      <td className="px-4 sm:px-5 py-2 font-mono" style={{ color: COLOR.textMuted }}>
                        {h.id}
                      </td>
                      <td className="px-4 py-2 font-semibold">{h.symbol}</td>
                      <td className="px-4 py-2 font-semibold" style={{ color: h.side === "BUY" ? COLOR.buy : COLOR.sell }}>
                        {h.side}
                      </td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">{h.qty}</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">${fmtUSD(h.price)}</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">${fmtUSD(h.total)}</td>
                      <td className="px-4 sm:px-5 py-2 text-right font-mono tabular-nums" style={{ color: COLOR.textFaint }}>
                        {h.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "signals" && (
              <table className="w-full text-[12.5px] min-w-[720px]">
                <thead>
                  <tr
                    className="text-left text-[10px] uppercase tracking-[0.08em] border-b"
                    style={{ color: COLOR.textFaint, borderColor: COLOR.border }}
                  >
                    <th className="px-4 sm:px-5 py-2 font-medium">Signal ID</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                    <th className="px-4 py-2 font-medium">Algorithm</th>
                    <th className="px-4 py-2 font-medium">Symbol</th>
                    <th className="px-4 py-2 font-medium">Signal</th>
                    <th className="px-4 py-2 font-medium text-right">Confidence</th>
                    <th className="px-4 py-2 font-medium text-right">Price</th>
                    <th className="px-4 sm:px-5 py-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.algoSignals.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: COLOR.border }}
                    >
                      <td className="px-4 sm:px-5 py-2 font-mono" style={{ color: COLOR.textMuted }}>
                        {s.id}
                      </td>
                      <td className="px-4 py-2 font-mono tabular-nums" style={{ color: COLOR.textFaint }}>
                        {s.time}
                      </td>
                      <td className="px-4 py-2">{s.algorithm}</td>
                      <td className="px-4 py-2 font-semibold">{s.symbol}</td>
                      <td className="px-4 py-2 font-semibold" style={{ color: s.signal === "BUY" ? COLOR.buy : COLOR.sell }}>
                        {s.signal}
                      </td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">{s.confidence}%</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">${fmtUSD(s.price)}</td>
                      <td className="px-4 sm:px-5 py-2 text-right">
                        <span
                          className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase tracking-wide"
                          style={
                            s.status === "Executed"
                              ? { backgroundColor: `${COLOR.buy}1F`, color: COLOR.buy }
                              : s.status === "Pending"
                              ? { backgroundColor: `${COLOR.amber}1F`, color: COLOR.amber }
                              : { backgroundColor: COLOR.surfaceRaised, color: COLOR.textMuted }
                          }
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}