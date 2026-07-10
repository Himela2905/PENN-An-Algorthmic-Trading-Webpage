import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Bot,
  ChevronDown, Search, ShieldCheck, Star, Wallet, X,
} from "lucide-react";

/* ── Design tokens ──────────────────────────────────────────────────────── */
const COLOR = {
  bg: "#090B0F", surface: "#111419", surfaceRaised: "#161A21",
  border: "#1C2028", borderSoft: "#242933", text: "#E7E9ED",
  textMuted: "#8A93A3", textFaint: "#565E6B", jade: "#2FAE84",
  amber: "#F0923B", buy: "#1FA75E", sell: "#E5484D",
};
const CURRENCY = "₹";

/* ── Types ──────────────────────────────────────────────────────────────── */
type Side       = "BUY" | "SELL";
type OrderType  = "market" | "limit";
type WidgetMode = "manual" | "algo";
type Tab        = "positions" | "orders" | "history" | "signals";
type Timeframe  = "1m" | "5m" | "15m" | "1H" | "4H" | "1D" | "1W";

interface Candle        { open: number; close: number; high: number; low: number; }
interface Position      { symbol: string; side: "LONG"|"SHORT"; qty: string; entry: number; mark: number; pnl: number; pnlPct: number; }
interface PendingOrder  { id: string; symbol: string; type: "LIMIT"|"STOP"; side: Side; qty: string; price: number; status: "Working"|"Partial"; }
interface TradeRecord   { id: string; symbol: string; side: Side; qty: string; price: number; total: number; time: string; }
interface WatchlistItem { symbol: string; name: string; price: number; changePct: number; }
interface AlgoSignal    { id: string; time: string; algorithm: string; symbol: string; signal: Side; confidence: number; price: number; status: "Executed"|"Skipped"|"Pending"; }
interface AlgoStats     { activeAlgos: number; winRatePct: number; tradesTotal: number; }
interface RunningEngine { symbol: string; strategy: string; }
interface SymbolInfo    { symbol: string; name: string; price: number; }
interface Algorithm     { id: string; name: string; desc: string; }

/* ── All 21 strategies ──────────────────────────────────────────────────── */
const ALGORITHMS: Algorithm[] = [
  { id: "Golden Cross",          name: "Golden Cross",          desc: "50/20 MA crossover — trend following" },
  { id: "Death Cross",           name: "Death Cross",           desc: "Bearish MA crossover — short bias" },
  { id: "EMA Cross",             name: "EMA Cross",             desc: "Fast/slow EMA crossover" },
  { id: "Triple MA",             name: "Triple MA",             desc: "Three MA alignment — stronger signal" },
  { id: "EMA Ribbon",            name: "EMA Ribbon",            desc: "Multiple EMA trend confirmation" },
  { id: "RSI",                   name: "RSI",                   desc: "Mean reversion on RSI extremes" },
  { id: "MACD Cross",            name: "MACD Cross",            desc: "MACD/signal line crossover" },
  { id: "MACD Zero Line",        name: "MACD Zero Line",        desc: "MACD zero-line momentum cross" },
  { id: "Bollinger Bands",       name: "Bollinger Bands",       desc: "Price touching outer bands" },
  { id: "Bollinger Squeeze",     name: "Bollinger Squeeze",     desc: "Volatility expansion breakout" },
  { id: "Stochastic",            name: "Stochastic",            desc: "Overbought/oversold oscillator" },
  { id: "ZScore Reversion",      name: "ZScore Reversion",      desc: "Statistical mean reversion" },
  { id: "ATR Breakout",          name: "ATR Breakout",          desc: "Volatility-based breakout" },
  { id: "Momentum Burst",        name: "Momentum Burst",        desc: "Short-term momentum surge" },
  { id: "ROC Strategy",          name: "ROC Strategy",          desc: "Rate of change momentum" },
  { id: "Price Breakout",        name: "Price Breakout",        desc: "20-day high/low breakout" },
  { id: "Donchian Breakout",     name: "Donchian Breakout",     desc: "Donchian channel breakout" },
  { id: "VWAP Cross",            name: "VWAP Cross",            desc: "Price crossing VWAP" },
  { id: "VWAP Bounce",           name: "VWAP Bounce",           desc: "Bounce off VWAP support/resistance" },
  { id: "Volume Spike Breakout", name: "Volume Spike Breakout", desc: "High volume price breakout" },
  { id: "SuperTrend",            name: "SuperTrend",            desc: "ATR-based trend direction" },
  { id: "ADX Strategy",          name: "ADX Strategy",          desc: "Trend strength directional index" },
  { id: "AI Ensemble",           name: "AI Ensemble",           desc: "Majority vote across 5 strategies" },
];

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];

/* ── Default watchlist (overridden by localStorage) ─────────────────────── */
const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", price: 0, changePct: 0 },
  { symbol: "TCS.NS",      name: "TCS",                 price: 0, changePct: 0 },
  { symbol: "INFY.NS",     name: "Infosys",             price: 0, changePct: 0 },
  { symbol: "TSLA",        name: "Tesla Inc.",           price: 0, changePct: 0 },
  { symbol: "AAPL",        name: "Apple Inc.",           price: 0, changePct: 0 },
];

const DEFAULT_MOVERS: WatchlistItem[] = [
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", price: 0, changePct: 0 },
  { symbol: "WIPRO.NS",    name: "Wipro",     price: 0, changePct: 0 },
  { symbol: "NVDA",        name: "NVIDIA",    price: 0, changePct: 0 },
];

const TICKER_TAPE = [
  { symbol: "SENSEX",      value: "72,500.10", changePct:  0.42 },
  { symbol: "NIFTY50",     value: "21,964.60", changePct:  0.38 },
  { symbol: "RELIANCE.NS", value: "2,934.50",  changePct:  0.62 },
  { symbol: "TCS.NS",      value: "3,821.00",  changePct: -0.12 },
  { symbol: "INFY.NS",     value: "1,478.90",  changePct:  0.85 },
  { symbol: "TSLA",        value: "231.50",    changePct: -1.94 },
  { symbol: "NVDA",        value: "121.90",    changePct: -1.35 },
  { symbol: "AAPL",        value: "196.87",    changePct:  0.85 },
];

const SYMBOL_DIRECTORY: SymbolInfo[] = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", price: 2934 },
  { symbol: "TCS.NS",      name: "Tata Consultancy",    price: 3821 },
  { symbol: "INFY.NS",     name: "Infosys",             price: 1478 },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank",           price: 1612 },
  { symbol: "TSLA",        name: "Tesla Inc.",           price: 231  },
  { symbol: "AAPL",        name: "Apple Inc.",           price: 196  },
  { symbol: "NVDA",        name: "NVIDIA Corp.",         price: 121  },
  { symbol: "MSFT",        name: "Microsoft Corp.",      price: 418  },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const API = "http://localhost:5000";
const token = () => localStorage.getItem("access_token") ?? "";
const authHeaders = () => ({ "Authorization": `Bearer ${token()}`, "Content-Type": "application/json" });

const fmtN = (n: number, d = 2) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtSigned = (n: number, d = 2) => `${n >= 0 ? "+" : ""}${fmtN(n, d)}`;
const toYF = (s: string) => s.includes("/") ? s.replace("/", "-") : s;

function makeCandles(base: number, vol: number, count: number): Candle[] {
  const out: Candle[] = []; let price = base;
  for (let i = 0; i < count; i++) {
    const open  = price;
    const drift = Math.sin(i * 0.7) * vol + Math.cos(i * 1.35) * vol * 0.45;
    const close = open + drift;
    const high  = Math.max(open, close) + Math.abs(Math.sin(i * 2.05)) * vol * 0.55;
    const low   = Math.min(open, close) - Math.abs(Math.cos(i * 1.85)) * vol * 0.55;
    out.push({ open, close, high, low }); price = close;
  }
  return out;
}

function seed(s: string) { return s.split("").reduce((a, c) => a + c.charCodeAt(0), 0); }

interface BL { price: number; size: number; cumulative: number; }
function makeBook(base: number, tick: number, count: number, dir: 1|-1, sd: number): BL[] {
  let cum = 0;
  return Array.from({ length: count }, (_, i) => {
    const size = 0.4 + Math.abs(Math.sin((i + sd) * 1.7)) * 3.2;
    cum += size;
    return { price: base + dir * tick * (i + 1), size, cumulative: cum };
  });
}

/* ── Symbol Search (calls real /search backend) ─────────────────────────── */
function SymbolSearch({ onSelect }: { onSelect: (s: string) => void }) {
  const [q, setQ]         = useState("");
  const [open, setOpen]   = useState(false);
  const [res, setRes]     = useState<SymbolInfo[]>([]);
  const [busy, setBusy]   = useState(false);
  const timer             = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q || q.length < 2) { setRes([]); return; }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await fetch(`${API}/search?q=${encodeURIComponent(q)}`,
          { headers: { Authorization: `Bearer ${token()}` } });
        const d = await r.json();
        setRes((d.results || []).slice(0, 6).map((x: any) => ({ symbol: x.symbol, name: x.name, price: 0 })));
        setOpen(true);
      } catch { setRes([]); } finally { setBusy(false); }
    }, 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);

  return (
    <div className="relative"
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <div className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5"
        style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}>
        <Search className="h-3.5 w-3.5 shrink-0" style={{ color: COLOR.textFaint }} />
        <input value={q} onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => res.length > 0 && setOpen(true)}
          placeholder="Search company or symbol…"
          className="bg-transparent outline-none text-[12px] w-28 sm:w-40"
          style={{ color: COLOR.text }} />
      </div>
      {open && (busy || res.length > 0) && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-md border overflow-hidden z-20 shadow-[0_8px_24px_rgba(0,0,0,0.45)]"
          style={{ borderColor: COLOR.border, backgroundColor: COLOR.surfaceRaised }}>
          {busy && <p className="px-3 py-2.5 text-[12px]" style={{ color: COLOR.textFaint }}>Searching...</p>}
          {!busy && res.length === 0 && <p className="px-3 py-2.5 text-[12px]" style={{ color: COLOR.textFaint }}>No matches</p>}
          {!busy && res.map(s => (
            <button key={s.symbol} type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(s.symbol); setQ(""); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white/[0.05] transition-colors">
              <div>
                <p className="text-[12.5px] font-semibold">{s.symbol}</p>
                <p className="text-[10.5px]" style={{ color: COLOR.textFaint }}>{s.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Algorithm dropdown ──────────────────────────────────────────────────── */
function AlgoSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const cur = ALGORITHMS.find(a => a.id === value) ?? ALGORITHMS[0];
  return (
    <div className="relative mb-3"
      onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <label className="text-[11px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>Algorithm</label>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-left"
        style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}>
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold truncate">{cur.name}</p>
          <p className="text-[10px] truncate" style={{ color: COLOR.textFaint }}>{cur.desc}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" style={{ color: COLOR.textFaint }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1.5 rounded-md border overflow-hidden z-20 shadow-[0_8px_24px_rgba(0,0,0,0.45)] max-h-64 overflow-y-auto"
          style={{ borderColor: COLOR.border, backgroundColor: COLOR.surfaceRaised }}>
          {ALGORITHMS.map(a => (
            <button key={a.id} type="button"
              onMouseDown={e => { e.preventDefault(); onChange(a.id); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-white/[0.05] transition-colors"
              style={a.id === value ? { backgroundColor: `${COLOR.jade}14` } : undefined}>
              <p className="text-[12px] font-semibold">{a.name}</p>
              <p className="text-[10px]" style={{ color: COLOR.textFaint }}>{a.desc}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Candlestick chart ───────────────────────────────────────────────────── */
function PriceChart({ candles }: { candles: Candle[] }) {
  const W = 800, pH = 216, vH = 44, gap = 8, total = pH + gap + vH, pad = 8;
  const highs = candles.map(c => c.high), lows = candles.map(c => c.low);
  const max = Math.max(...highs), min = Math.min(...lows), range = max - min || 1;
  const vols = candles.map(c => Math.abs(c.close - c.open) * 3.2 + 6);
  const maxV = Math.max(...vols);
  const sw = (W - pad * 2) / candles.length, bw = Math.max(sw * 0.5, 2);
  const yFor = (v: number) => pad + (1 - (v - min) / range) * (pH - pad * 2);
  const last = candles[candles.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${total}`} className="w-full h-[17rem]">
      {[0,1,2,3].map(i => (
        <line key={i} x1={0} x2={W}
          y1={pad + (i * (pH - pad * 2)) / 3} y2={pad + (i * (pH - pad * 2)) / 3}
          stroke={COLOR.border} strokeWidth={1} />
      ))}
      <line x1={0} x2={W} y1={yFor(last.close)} y2={yFor(last.close)}
        stroke={COLOR.textFaint} strokeWidth={1} strokeDasharray="3,4" />
      {candles.map((c, i) => {
        const x = pad + i * sw + sw / 2, up = c.close >= c.open, col = up ? COLOR.buy : COLOR.sell;
        const bt = yFor(Math.max(c.open, c.close)), bb = yFor(Math.min(c.open, c.close));
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yFor(c.high)} y2={yFor(c.low)} stroke={col} strokeWidth={1.3} />
            <rect x={x - bw / 2} y={bt} width={bw} height={Math.max(bb - bt, 1.4)} fill={col} rx={0.5} />
          </g>
        );
      })}
      <g transform={`translate(0,${pH + gap})`}>
        {candles.map((c, i) => {
          const x = pad + i * sw + sw / 2, up = c.close >= c.open, h = (vols[i] / maxV) * vH;
          return <rect key={i} x={x - bw / 2} y={vH - h} width={bw} height={h}
            fill={up ? COLOR.buy : COLOR.sell} opacity={0.35} />;
        })}
      </g>
    </svg>
  );
}

/* ── Order book ──────────────────────────────────────────────────────────── */
function OrderBook({ midPrice, symbol }: { midPrice: number; symbol: string }) {
  const sd   = seed(symbol);
  const tick = midPrice > 1000 ? 5 : midPrice > 10 ? 0.05 : 0.0005;
  const asks = useMemo(() => makeBook(midPrice, tick, 8, 1, sd).reverse(),    [midPrice, tick, sd]);
  const bids = useMemo(() => makeBook(midPrice, tick, 8, -1, sd + 7),         [midPrice, tick, sd]);
  const maxC = Math.max(asks[0]?.cumulative ?? 1, bids[bids.length - 1]?.cumulative ?? 1);
  const dec  = midPrice > 1000 ? 0 : midPrice > 10 ? 2 : 4;
  return (
    <div className="flex flex-col h-full text-[11px]">
      <div className="grid grid-cols-2 px-0.5 pb-1.5 uppercase tracking-[0.06em]" style={{ color: COLOR.textFaint }}>
        <span>Price</span><span className="text-right">Size</span>
      </div>
      <div className="flex-1 flex flex-col justify-end">
        {asks.map((l, i) => (
          <div key={`a${i}`} className="relative grid grid-cols-2 py-[3px]">
            <div className="absolute inset-y-0 right-0"
              style={{ width: `${(l.cumulative / maxC) * 100}%`, backgroundColor: `${COLOR.sell}14` }} />
            <span className="relative z-10 font-mono tabular-nums" style={{ color: COLOR.sell }}>{fmtN(l.price, dec)}</span>
            <span className="relative z-10 font-mono tabular-nums text-right" style={{ color: COLOR.textMuted }}>{l.size.toFixed(3)}</span>
          </div>
        ))}
      </div>
      <div className="my-1.5 flex items-center justify-center rounded-[4px] py-1 font-mono text-[12px] font-semibold tabular-nums"
        style={{ backgroundColor: COLOR.surfaceRaised, color: COLOR.text }}>{fmtN(midPrice, dec)}</div>
      <div>
        {bids.map((l, i) => (
          <div key={`b${i}`} className="relative grid grid-cols-2 py-[3px]">
            <div className="absolute inset-y-0 right-0"
              style={{ width: `${(l.cumulative / maxC) * 100}%`, backgroundColor: `${COLOR.buy}14` }} />
            <span className="relative z-10 font-mono tabular-nums" style={{ color: COLOR.buy }}>{fmtN(l.price, dec)}</span>
            <span className="relative z-10 font-mono tabular-nums text-right" style={{ color: COLOR.textMuted }}>{l.size.toFixed(3)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mode switch ─────────────────────────────────────────────────────────── */
function ModeSwitch({ isLive, onChange }: { isLive: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={isLive} onClick={() => onChange(!isLive)}
      className="relative flex h-9 w-56 items-center rounded-md border p-0.5 transition-colors duration-300 focus:outline-none"
      style={{ borderColor: isLive ? `${COLOR.amber}55` : `${COLOR.jade}55`, backgroundColor: COLOR.surface }}>
      <span className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-[5px] transition-all duration-300 ease-out"
        style={{ left: isLive ? "calc(50% + 1px)" : "2px", backgroundColor: isLive ? COLOR.amber : COLOR.jade }} />
      <span className="relative z-10 flex-1 text-center text-[10.5px] font-semibold uppercase tracking-wide transition-colors duration-300"
        style={{ color: !isLive ? "#090B0F" : COLOR.textMuted }}>Paper</span>
      <span className="relative z-10 flex-1 text-center text-[10.5px] font-semibold uppercase tracking-wide transition-colors duration-300"
        style={{ color: isLive ? "#090B0F" : COLOR.textMuted }}>Live</span>
    </button>
  );
}

function SH({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: COLOR.textFaint }}>{children}</h2>;
}

function KPI({ label, value, delta, accent }: { label: string; value: string; delta?: string; accent?: string }) {
  return (
    <div className="flex-1 min-w-[140px] rounded-lg border px-4 py-3"
      style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
      <p className="text-[10px] uppercase tracking-[0.08em] mb-1" style={{ color: COLOR.textFaint }}>{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="font-mono text-[16px] font-semibold tabular-nums">{value}</p>
        {delta && <p className="font-mono text-[11px] font-medium tabular-nums" style={{ color: accent }}>{delta}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function TradingDashboard() {
  /* ── UI state ─────────────────────────────────────────────────────────── */
  const [isLive,          setIsLive]          = useState(false);
  const [timeframe,       setTimeframe]       = useState<Timeframe>("1H");
  const [symbol,          setSymbol]          = useState("RELIANCE.NS");   // chart symbol
  const [algoSymbol,      setAlgoSymbol]      = useState("RELIANCE.NS");   // LOCKED when algo running
  const [widgetMode,      setWidgetMode]      = useState<WidgetMode>("manual");
  const [orderType,       setOrderType]       = useState<OrderType>("market");
  const [orderSide,       setOrderSide]       = useState<Side>("BUY");
  const [quantity,        setQuantity]        = useState("1");
  const [limitPrice,      setLimitPrice]      = useState("0.00");
  const [algoId,          setAlgoId]          = useState(ALGORITHMS[0].id);
  const [algoRunning,     setAlgoRunning]     = useState(false);
  const [positionSizePct, setPositionSizePct] = useState("5");
  const [stopLossPct,     setStopLossPct]     = useState("2.0");
  const [takeProfitPct,   setTakeProfitPct]   = useState("4.0");
  const [maxTrades,       setMaxTrades]       = useState("10");
  const [activeTab,       setActiveTab]       = useState<Tab>("positions");
  const [algoError,       setAlgoError]       = useState("");
  const [now,             setNow]             = useState(new Date());

  /* ── Virtual balance (editable) ───────────────────────────────────────── */
  const [virtualBalance,   setVirtualBalance]   = useState(100000);
  const [editingBalance,   setEditingBalance]   = useState(false);
  const [balanceInput,     setBalanceInput]     = useState("100000");

  /* ── Real data state ──────────────────────────────────────────────────── */
  const [realCandles,      setRealCandles]      = useState<Candle[]>([]);
  const [livePositions,    setLivePositions]    = useState<Position[]>([]);
  const [liveHistory,      setLiveHistory]      = useState<TradeRecord[]>([]);
  const [runningEngines,   setRunningEngines]   = useState<RunningEngine[]>([]);
  const [livePnl,          setLivePnl]          = useState<any>(null);
  const [watchlistPrices,  setWatchlistPrices]  = useState<Record<string,number>>({});
  const [watchlistChanges, setWatchlistChanges] = useState<Record<string,number>>({});

  /* ── Custom watchlist (persisted to localStorage) ─────────────────────── */
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    if (typeof window === "undefined") return DEFAULT_WATCHLIST;
    try {
      const saved = localStorage.getItem("wl");
      return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST;
    } catch { return DEFAULT_WATCHLIST; }
  });
  const [addSym, setAddSym] = useState("");

  function saveWatchlist(list: WatchlistItem[]) {
    setWatchlist(list);
    localStorage.setItem("wl", JSON.stringify(list));
  }
  function addToWatchlist() {
    const s = addSym.trim().toUpperCase();
    if (!s || watchlist.find(w => w.symbol === s)) { setAddSym(""); return; }
    saveWatchlist([...watchlist, { symbol: s, name: s, price: 0, changePct: 0 }]);
    setAddSym("");
  }
  function removeFromWatchlist(sym: string) {
    saveWatchlist(watchlist.filter(w => w.symbol !== sym));
  }

  const accent = isLive ? COLOR.amber : COLOR.jade;

  /* ── Clock ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Real candles from backend ────────────────────────────────────────── */
  useEffect(() => {
    async function load() {
      const tfMap: Record<string,string> = {
        "1m":"1m","5m":"5m","15m":"15m","1H":"1h","4H":"4h","1D":"1D","1W":"1D"
      };
      try {
        const r = await fetch(
          `${API}/market/candles/${toYF(symbol)}?tf=${tfMap[timeframe] || "15m"}`,
          { headers: { Authorization: `Bearer ${token()}` } }
        );
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (d.candles?.length > 0)
          setRealCandles(d.candles.map((c: any) => ({ open: c.open, high: c.high, low: c.low, close: c.close })));
        else setRealCandles([]);
      } catch { setRealCandles([]); }
    }
    load();
  }, [symbol, timeframe]);

  /* ── WebSocket: real-time price tick ─────────────────────────────────── */
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`ws://localhost:5001/ws/price/${toYF(symbol)}`);
      ws.onmessage = e => {
        try {
          const q = JSON.parse(e.data);
          if (q.price)
            setRealCandles(prev => {
              if (!prev.length) return prev;
              const upd = [...prev];
              upd[upd.length - 1] = { ...upd[upd.length - 1], close: q.price,
                high: Math.max(upd[upd.length-1].high, q.price),
                low:  Math.min(upd[upd.length-1].low,  q.price) };
              return upd;
            });
        } catch {}
      };
      ws.onerror = () => {};
    } catch {}
    return () => { ws?.close(); };
  }, [symbol]);

  /* ── WebSocket: trade signals ─────────────────────────────────────────── */
  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket("ws://localhost:5001/ws/signals");
      ws.onmessage = e => {
        try {
          const sig = JSON.parse(e.data);
          if (sig.type === "TRADE")
            setLiveHistory(prev => [{
              id: `T-${Date.now()}`, symbol: sig.symbol, side: sig.side,
              qty: String(sig.qty), price: sig.price,
              total: sig.price * sig.qty, time: sig.time,
            }, ...prev]);
        } catch {}
      };
      ws.onerror = () => {};
    } catch {}
    return () => { ws?.close(); };
  }, []);

  /* ── Poll: backend status + P&L ──────────────────────────────────────── */
  useEffect(() => {
    async function poll() {
      try {
        const [sr, pr] = await Promise.all([
          fetch(`${API}/live/status`, { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(`${API}/live/pnl`,    { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        const sd = await sr.json(), pd = await pr.json();
        setRunningEngines(sd.engines || []);
        setAlgoRunning(sd.running || false);
        setLivePnl(pd);
      } catch {}
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  /* ── Poll: positions + trades ─────────────────────────────────────────── */
  useEffect(() => {
    async function poll() {
      try {
        const [pr, tr] = await Promise.all([
          fetch(`${API}/live/positions`, { headers: { Authorization: `Bearer ${token()}` } }),
          fetch(`${API}/live/trades`,    { headers: { Authorization: `Bearer ${token()}` } }),
        ]);
        const pd = await pr.json(), td = await tr.json();
        if (pd.positions?.length > 0)
          setLivePositions(pd.positions.map((p: any) => ({
            symbol: p.symbol, side: p.side === "BUY" ? "LONG" : "SHORT",
            qty: String(p.qty),
            entry: p.avgEntry    || p.entry_price    || 0,
            mark:  p.currentPrice || p.current_price  || 0,
            pnl:    p.pnl     || 0,
            pnlPct: p.pnl_pct || 0,
          })));
        if (td.trades?.length > 0)
          setLiveHistory(td.trades.map((t: any, i: number) => ({
            id: `T-${i}`, symbol: t.symbol, side: t.side as Side,
            qty: String(t.qty), price: t.price,
            total: t.price * t.qty, time: t.time || "",
          })));
      } catch {}
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  /* ── Poll: watchlist + mover prices ──────────────────────────────────── */
  useEffect(() => {
    async function poll() {
      const all = [
        ...watchlist.map(w => toYF(w.symbol)),
        ...DEFAULT_MOVERS.map(m => toYF(m.symbol)),
      ];
      try {
        const r = await fetch(`${API}/market/watchlist`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ symbols: all }),
        });
        const d = await r.json();
        const prices: Record<string,number>  = {};
        const changes: Record<string,number> = {};
        d.quotes?.forEach((q: any) => { prices[q.symbol] = q.price; changes[q.symbol] = q.changePct ?? 0; });
        setWatchlistPrices(prices);
        setWatchlistChanges(changes);
      } catch {}
    }
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [watchlist]);

  /* ── Derived values ───────────────────────────────────────────────────── */
  const symbolInfo = useMemo(
    () => SYMBOL_DIRECTORY.find(s => s.symbol === symbol) ?? SYMBOL_DIRECTORY[0],
    [symbol]
  );

  const candles = useMemo(() =>
    realCandles.length > 0 ? realCandles : makeCandles(symbolInfo.price, symbolInfo.price * 0.014, 40),
    [realCandles, symbolInfo]
  );

  useEffect(() => {
    setLimitPrice(symbolInfo.price.toFixed(symbolInfo.price > 10 ? 2 : 4));
  }, [symbolInfo]);

  const last  = candles[candles.length - 1];
  const first = candles[0];
  const priceChange    = last.close - first.open;
  const priceChangePct = (priceChange / first.open) * 100;

  const stats = useMemo(() => {
    const highs = candles.map(c => c.high), lows = candles.map(c => c.low);
    const vol   = candles.reduce((s, c) => s + Math.abs(c.close - c.open) * 42 + 180, 0);
    return { open: first.open, high: Math.max(...highs), low: Math.min(...lows), vol };
  }, [candles, first]);

  const positions    = livePositions.length > 0 ? livePositions : [];
  const history      = liveHistory;
  const openPnl      = positions.reduce((s, p) => s + p.pnl, 0);
  const totalEquity  = livePnl?.total_equity ?? virtualBalance;
  const clock        = now.toLocaleTimeString("en-IN", { hour12: false });

  /* ── Algo start / stop ────────────────────────────────────────────────── */
  async function handleAlgoToggle() {
    setAlgoError("");
    try {
      if (algoRunning) {
        await fetch(`${API}/live/stop`, {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({ symbol: toYF(algoSymbol), strategy: algoId }),
        });
        setAlgoRunning(false);
      } else {
        const yfSym = toYF(symbol);
        setAlgoSymbol(symbol);          // lock the symbol at start time
        await fetch(`${API}/live/start`, {
          method: "POST", headers: authHeaders(),
          body: JSON.stringify({ symbol: yfSym, strategy: algoId, qty: parseInt(positionSizePct) || 1 }),
        });
        setAlgoRunning(true);
      }
    } catch { setAlgoError("Failed to connect to backend"); }
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                                */
  /* ══════════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen w-full font-sans antialiased"
      style={{ backgroundColor: COLOR.bg, color: COLOR.text }}>
      <style>{`
        @keyframes ticker-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-track { animation: ticker-scroll 38s linear infinite; }
      `}</style>

      {/* ── Ticker tape ─────────────────────────────────────────────────── */}
      <div className="overflow-hidden border-b" style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
        <div className="flex w-max whitespace-nowrap ticker-track">
          {[0, 1].map(dup => (
            <div key={dup} className="flex items-center">
              {TICKER_TAPE.map((t, i) => (
                <div key={`${dup}-${i}`} className="flex items-center gap-1.5 px-4 py-1.5 text-[11px]">
                  <span className="font-semibold" style={{ color: COLOR.textMuted }}>{t.symbol}</span>
                  <span className="font-mono tabular-nums">{t.value}</span>
                  <span className="font-mono tabular-nums" style={{ color: t.changePct >= 0 ? COLOR.buy : COLOR.sell }}>
                    {fmtSigned(t.changePct)}%
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="h-[2px] w-full transition-colors duration-300" style={{ backgroundColor: accent }} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b backdrop-blur"
        style={{ borderColor: COLOR.border, backgroundColor: `${COLOR.bg}F2` }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-7 min-w-0">
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="h-8 w-8 rounded-md border flex items-center justify-center font-mono text-[13px] font-bold"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.surfaceRaised, color: accent }}>M</div>
                <div className="hidden sm:block leading-tight">
                  <p className="font-semibold text-[14px] tracking-tight">Penn</p>
                  <p className="text-[10px] uppercase tracking-[0.12em]" style={{ color: COLOR.textFaint }}>Algo Markets Terminal</p>
                </div>
              </div>
              <nav className="hidden lg:flex items-center gap-6 text-[13px]">
                {["Dashboard","Markets","Algorithms","History"].map((item, i) => (
                  <a key={item} className="pb-[19px]" style={{
                    color: i === 0 ? COLOR.text : COLOR.textMuted,
                    ...(i === 0 ? { borderBottom: `2px solid ${accent}` } : {}),
                  }}>{item}</a>
                ))}
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
              {/* Editable virtual balance */}
              <div className="hidden md:flex items-center gap-2.5 rounded-md border px-3 py-1.5"
                style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
                <Wallet className="h-3.5 w-3.5" style={{ color: COLOR.textFaint }} />
                <div className="text-right leading-tight">
                  <p className="text-[9px] uppercase tracking-[0.1em]" style={{ color: COLOR.textFaint }}>
                    {isLive ? "Live ₹" : "Virtual ₹"}
                  </p>
                  {editingBalance && !isLive ? (
                    <input autoFocus type="number" value={balanceInput}
                      onChange={e => setBalanceInput(e.target.value)}
                      onBlur={() => { setVirtualBalance(parseFloat(balanceInput) || 100000); setEditingBalance(false); }}
                      onKeyDown={e => { if (e.key === "Enter") { setVirtualBalance(parseFloat(balanceInput) || 100000); setEditingBalance(false); } }}
                      className="font-mono text-[13px] font-semibold w-28 bg-transparent outline-none border-b tabular-nums"
                      style={{ color: COLOR.text, borderColor: accent }} />
                  ) : (
                    <p className="font-mono text-[13px] font-semibold tabular-nums cursor-pointer"
                      title={isLive ? "" : "Click to edit"}
                      onClick={() => { if (!isLive) { setBalanceInput(String(virtualBalance)); setEditingBalance(true); } }}>
                      {CURRENCY}{fmtN(totalEquity)}
                    </p>
                  )}
                </div>
              </div>
              <ModeSwitch isLive={isLive} onChange={setIsLive} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mode banner ─────────────────────────────────────────────────── */}
      <div className="border-b transition-colors duration-300"
        style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface, borderLeftWidth: 3, borderLeftColor: accent }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2 flex flex-col gap-1 text-[12px]">
          <div className="flex items-center gap-2.5">
            {isLive ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75" style={{ backgroundColor: COLOR.sell }} />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: COLOR.sell }} />
                </span>
                <span className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 font-semibold uppercase tracking-[0.06em] text-[11px]"
                  style={{ backgroundColor: `${COLOR.amber}1F`, color: COLOR.amber }}>
                  <AlertTriangle className="h-3 w-3" />Real Money Live
                </span>
              </>
            ) : (
              <span className="flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 font-semibold uppercase tracking-[0.06em] text-[11px]"
                style={{ backgroundColor: `${COLOR.jade}1F`, color: COLOR.jade }}>
                <ShieldCheck className="h-3 w-3" />Demo / Virtual Mode
              </span>
            )}
            <span className="hidden sm:inline" style={{ color: COLOR.textMuted }}>
              {isLive
                ? "Fyers API authentication required for live orders."
                : "Simulated fills on a virtual balance — no real capital is at risk."}
            </span>
          </div>
          {/* Running engines summary */}
          {runningEngines.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {runningEngines.map(e => (
                <span key={`${e.symbol}_${e.strategy}`}
                  className="rounded-[4px] px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: `${COLOR.jade}1F`, color: COLOR.jade }}>
                  ● {e.strategy} on {e.symbol}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 space-y-4">

        {/* KPI strip */}
        <div className="flex flex-wrap gap-3">
          <KPI label="Total Equity"       value={`${CURRENCY}${fmtN(totalEquity)}`} />
          <KPI label="Day P&L"            value={fmtSigned(livePnl?.day_pnl ?? 0)}
            delta={`${fmtSigned(livePnl?.day_pnl_pct ?? 0)}%`}
            accent={(livePnl?.day_pnl ?? 0) >= 0 ? COLOR.buy : COLOR.sell} />
          <KPI label="Open P&L"           value={fmtSigned(openPnl)}
            delta={`${positions.length} positions`}
            accent={openPnl >= 0 ? COLOR.buy : COLOR.sell} />
          <KPI label="Buying Power"       value={`${CURRENCY}${fmtN(virtualBalance * 2)}`} />
          <KPI label="Active Algorithms"  value={`${runningEngines.length} Running`}
            delta={runningEngines.map(e => e.strategy).join(", ")} accent={accent} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ── Chart ─────────────────────────────────────────────────── */}
          <section className="lg:col-span-5 rounded-lg border p-4"
            style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight">{symbol}</h2>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono text-[21px] font-semibold tabular-nums">{CURRENCY}{fmtN(last.close)}</span>
                  <span className="flex items-center gap-0.5 text-[12px] font-medium font-mono tabular-nums"
                    style={{ color: priceChange >= 0 ? COLOR.buy : COLOR.sell }}>
                    {priceChange >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {fmtSigned(priceChange)} ({fmtSigned(priceChangePct)}%)
                  </span>
                </div>
              </div>
              <SymbolSearch onSelect={setSymbol} />
            </div>
            <div className="grid grid-cols-4 gap-2 mb-3 rounded-md border px-3 py-2"
              style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}>
              {[
                { label: "Open", value: `${CURRENCY}${fmtN(stats.open)}`  },
                { label: "High", value: `${CURRENCY}${fmtN(stats.high)}`  },
                { label: "Low",  value: `${CURRENCY}${fmtN(stats.low)}`   },
                { label: "Vol",  value: stats.vol.toLocaleString("en-IN", { maximumFractionDigits: 0 }) },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-[9.5px] uppercase tracking-[0.06em]" style={{ color: COLOR.textFaint }}>{s.label}</p>
                  <p className="font-mono text-[12px] tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
            <PriceChart candles={candles} />
            <div className="flex gap-1 mt-3 flex-wrap border-t pt-3" style={{ borderColor: COLOR.border }}>
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className="px-2.5 py-1 rounded-[4px] text-[11px] font-semibold font-mono transition-colors"
                  style={timeframe === tf ? { backgroundColor: accent, color: "#090B0F" } : { color: COLOR.textMuted }}>
                  {tf}
                </button>
              ))}
            </div>
          </section>

          {/* ── Order book ────────────────────────────────────────────── */}
          <section className="lg:col-span-2 rounded-lg border p-3.5"
            style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
            <SH>Order Book</SH>
            <div className="mt-2.5"><OrderBook midPrice={last.close} symbol={symbol} /></div>
          </section>

          {/* ── Order / Algo widget ───────────────────────────────────── */}
          <section className="lg:col-span-3 rounded-lg border p-4 flex flex-col"
            style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
            <div className="flex items-center justify-between mb-3">
              <SH>{widgetMode === "algo" ? "Algorithm Control" : "Place Order"}</SH>
              <span className="font-mono text-[11px]" style={{ color: COLOR.textFaint }}>{symbol}</span>
            </div>

            {/* Manual / Algo tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-md p-1 mb-3"
              style={{ backgroundColor: COLOR.bg, border: `1px solid ${COLOR.border}` }}>
              {(["manual","algo"] as const).map(m => (
                <button key={m} onClick={() => setWidgetMode(m)}
                  className="flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-wide transition-colors"
                  style={widgetMode === m ? { backgroundColor: COLOR.surfaceRaised, color: COLOR.text } : { color: COLOR.textFaint }}>
                  {m === "algo" && <Bot className="h-3 w-3 inline mr-1 -mt-0.5" />}
                  {m === "manual" ? "Manual" : "Algorithmic"}
                </button>
              ))}
            </div>

            {widgetMode === "manual" ? (
              <>
                <div className="grid grid-cols-2 gap-1 rounded-md p-1 mb-3"
                  style={{ backgroundColor: COLOR.bg, border: `1px solid ${COLOR.border}` }}>
                  {(["market","limit"] as const).map(t => (
                    <button key={t} onClick={() => setOrderType(t)}
                      className="py-1.5 rounded-[4px] text-[11px] font-semibold uppercase tracking-wide transition-colors"
                      style={orderType === t ? { backgroundColor: COLOR.surfaceRaised, color: COLOR.text } : { color: COLOR.textFaint }}>
                      {t}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(["BUY","SELL"] as const).map(s => (
                    <button key={s} onClick={() => setOrderSide(s)}
                      className="py-2 rounded-md text-[12px] font-bold uppercase tracking-wide border transition-colors"
                      style={orderSide === s
                        ? { backgroundColor: s === "BUY" ? COLOR.buy : COLOR.sell, borderColor: s === "BUY" ? COLOR.buy : COLOR.sell, color: s === "BUY" ? "#08150F" : "#1A0808" }
                        : { borderColor: COLOR.border, color: COLOR.textMuted }}>
                      {s}
                    </button>
                  ))}
                </div>
                <label className="text-[11px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>Quantity</label>
                <input type="text" value={quantity} onChange={e => setQuantity(e.target.value)}
                  className="w-full rounded-md border px-3 py-2 font-mono text-[13px] mb-3 outline-none tabular-nums"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.text }} placeholder="0" />
                {orderType === "limit" && (
                  <>
                    <label className="text-[11px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>Limit Price</label>
                    <input type="text" value={limitPrice} onChange={e => setLimitPrice(e.target.value)}
                      className="w-full rounded-md border px-3 py-2 font-mono text-[13px] mb-3 outline-none tabular-nums"
                      style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: COLOR.text }} placeholder="0.00" />
                  </>
                )}
                <div className="rounded-md border px-3 py-2 mb-4 text-[11px] space-y-1.5"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}>
                  <div className="flex justify-between">
                    <span style={{ color: COLOR.textFaint }}>Est. total</span>
                    <span className="font-mono tabular-nums" style={{ color: COLOR.text }}>
                      {CURRENCY}{fmtN((parseFloat(quantity || "0") || 0) * (orderType === "limit" ? parseFloat(limitPrice || "0") || 0 : last.close))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLOR.textFaint }}>Available</span>
                    <span className="font-mono tabular-nums" style={{ color: COLOR.text }}>{CURRENCY}{fmtN(virtualBalance * 2)}</span>
                  </div>
                </div>
                <button className="mt-auto w-full rounded-md py-3 text-[12px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90"
                  style={{ backgroundColor: orderSide === "BUY" ? COLOR.buy : COLOR.sell, color: orderSide === "BUY" ? "#08150F" : "#1A0808" }}>
                  {orderSide} {symbol} · {isLive ? "Real Funds" : "Paper"}
                </button>
              </>
            ) : (
              <>
                <AlgoSelect value={algoId} onChange={setAlgoId} />
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { label: "Position Size (%)", val: positionSizePct, set: setPositionSizePct, col: COLOR.text },
                    { label: "Max Trades / Day",  val: maxTrades,       set: setMaxTrades,       col: COLOR.text },
                    { label: "Stop Loss (%)",      val: stopLossPct,    set: setStopLossPct,    col: COLOR.sell },
                    { label: "Take Profit (%)",    val: takeProfitPct,  set: setTakeProfitPct,  col: COLOR.buy  },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="text-[10.5px] font-medium mb-1 block" style={{ color: COLOR.textFaint }}>{f.label}</label>
                      <input type="text" value={f.val} onChange={e => f.set(e.target.value)}
                        className="w-full rounded-md border px-2.5 py-1.5 font-mono text-[12.5px] outline-none tabular-nums"
                        style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg, color: f.col }} />
                    </div>
                  ))}
                </div>
                <div className="rounded-md border px-3 py-2 mb-4 text-[11px] space-y-1.5"
                  style={{ borderColor: COLOR.border, backgroundColor: COLOR.bg }}>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: algoRunning ? COLOR.buy : COLOR.textFaint }} />
                    <span className="font-medium" style={{ color: algoRunning ? COLOR.buy : COLOR.textFaint }}>
                      {algoRunning ? `Running — scanning ${algoSymbol}` : "Stopped"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: COLOR.textFaint }}>Strategy</span>
                    <span style={{ color: COLOR.text }}>{algoId}</span>
                  </div>
                  {algoError && <p className="text-[11px]" style={{ color: COLOR.sell }}>{algoError}</p>}
                </div>
                <button onClick={handleAlgoToggle}
                  className="mt-auto w-full rounded-md py-3 text-[12px] font-bold uppercase tracking-wide transition-opacity hover:opacity-90"
                  style={{ backgroundColor: algoRunning ? COLOR.sell : COLOR.buy, color: algoRunning ? "#1A0808" : "#08150F" }}>
                  {algoRunning ? "Stop Algorithm" : "Start Algorithm"}
                </button>
              </>
            )}
          </section>

          {/* ── Watchlist + Movers ────────────────────────────────────── */}
          <section className="lg:col-span-2 flex flex-col gap-4">

            {/* Watchlist */}
            <div className="rounded-lg border p-3.5" style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
              <div className="flex items-center gap-1.5 mb-2"><Star className="h-3 w-3" style={{ color: COLOR.textFaint }} /><SH>Watchlist</SH></div>
              {/* Add symbol input */}
              <div className="flex gap-1 mb-2">
                <input value={addSym} onChange={e => setAddSym(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && addToWatchlist()}
                  placeholder="Add symbol…"
                  className="flex-1 rounded px-2 py-1 text-[11px] outline-none"
                  style={{ background: COLOR.bg, border: `1px solid ${COLOR.border}`, color: COLOR.text }} />
                <button onClick={addToWatchlist}
                  className="px-2 py-1 rounded text-[11px] font-semibold"
                  style={{ background: COLOR.jade, color: "#090B0F" }}>+</button>
              </div>
              <ul>
                {watchlist.map(w => {
                  const ys = toYF(w.symbol);
                  const price  = watchlistPrices[ys]  ?? watchlistPrices[w.symbol]  ?? w.price;
                  const change = watchlistChanges[ys] ?? watchlistChanges[w.symbol] ?? w.changePct;
                  return (
                    <li key={w.symbol}
                      className="group flex items-center justify-between gap-2 py-1.5 border-t first:border-t-0 cursor-pointer"
                      style={{ borderColor: COLOR.border }} onClick={() => setSymbol(w.symbol)}>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold leading-tight">{w.symbol}</p>
                        <p className="text-[10px] truncate" style={{ color: COLOR.textFaint }}>{w.name}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="text-right shrink-0">
                          <p className="font-mono text-[12.5px] tabular-nums">{CURRENCY}{fmtN(price)}</p>
                          <p className="text-[10.5px] font-medium font-mono tabular-nums"
                            style={{ color: change >= 0 ? COLOR.buy : COLOR.sell }}>
                            {fmtSigned(change)}%
                          </p>
                        </div>
                        <button onClick={e => { e.stopPropagation(); removeFromWatchlist(w.symbol); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                          style={{ color: COLOR.sell }}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Market movers */}
            <div className="rounded-lg border p-3.5" style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
              <SH>Market Movers</SH>
              <ul>
                {DEFAULT_MOVERS.map(m => {
                  const ys = toYF(m.symbol);
                  const price  = watchlistPrices[ys]  ?? 0;
                  const change = watchlistChanges[ys] ?? 0;
                  return (
                    <li key={m.symbol}
                      className="flex items-center justify-between gap-2 py-1.5 border-t mt-2.5 cursor-pointer"
                      style={{ borderColor: COLOR.border }} onClick={() => setSymbol(m.symbol)}>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold leading-tight">{m.symbol}</p>
                        <p className="text-[10px] truncate" style={{ color: COLOR.textFaint }}>{m.name}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-[12.5px] tabular-nums">{CURRENCY}{fmtN(price)}</p>
                        <p className="text-[10.5px] font-medium font-mono tabular-nums"
                          style={{ color: change >= 0 ? COLOR.buy : COLOR.sell }}>
                          {fmtSigned(change)}%
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        </div>

        {/* ── Bottom tabs ───────────────────────────────────────────────── */}
        <section className="rounded-lg border overflow-hidden"
          style={{ borderColor: COLOR.border, backgroundColor: COLOR.surface }}>
          <div className="flex items-center gap-5 border-b px-4 sm:px-5 overflow-x-auto" style={{ borderColor: COLOR.border }}>
            {[
              { id: "positions" as Tab, label: `Open Positions (${positions.length})` },
              { id: "orders"    as Tab, label: "Pending Orders (0)" },
              { id: "history"   as Tab, label: `Trade History (${history.length})` },
              { id: "signals"   as Tab, label: `Algo Signals` },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap"
                style={activeTab === t.id ? { borderColor: accent, color: COLOR.text } : { borderColor: "transparent", color: COLOR.textFaint }}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">

            {/* Positions */}
            {activeTab === "positions" && (
              <table className="w-full text-[12.5px] min-w-[640px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.08em] border-b"
                    style={{ color: COLOR.textFaint, borderColor: COLOR.border }}>
                    {["Symbol","Side","Qty","Entry","Mark","P&L"].map(h => (
                      <th key={h} className="px-4 sm:px-5 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 ? (
                    <tr><td colSpan={6} className="px-5 py-8 text-center" style={{ color: COLOR.textFaint }}>
                      No open positions. Start an algorithm to begin paper trading.
                    </td></tr>
                  ) : positions.map(p => (
                    <tr key={`${p.symbol}-${p.side}`}
                      className="border-b last:border-b-0 hover:bg-white/[0.02] transition-colors"
                      style={{ borderColor: COLOR.border }}>
                      <td className="px-4 sm:px-5 py-2 font-semibold">{p.symbol}</td>
                      <td className="px-4 py-2">
                        <span className="px-1.5 py-0.5 rounded-[3px] text-[10px] font-semibold uppercase"
                          style={p.side === "LONG"
                            ? { backgroundColor: `${COLOR.buy}1F`, color: COLOR.buy }
                            : { backgroundColor: `${COLOR.sell}1F`, color: COLOR.sell }}>
                          {p.side}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">{p.qty}</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">{CURRENCY}{fmtN(p.entry)}</td>
                      <td className="px-4 py-2 font-mono text-right tabular-nums">{CURRENCY}{fmtN(p.mark)}</td>
                      <td className="px-4 sm:px-5 py-2 font-mono text-right tabular-nums font-medium"
                        style={{ color: p.pnl >= 0 ? COLOR.buy : COLOR.sell }}>
                        {fmtSigned(p.pnl)} ({fmtSigned(p.pnlPct)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pending orders */}
            {activeTab === "orders" && (
              <div className="px-5 py-8 text-center" style={{ color: COLOR.textFaint }}>
                Manual orders require Fyers API authentication. Use Algorithmic mode for paper trading.
              </div>
            )}

            {/* Trade history */}
            {activeTab === "history" && (
              <table className="w-full text-[12.5px] min-w-[640px]">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-[0.08em] border-b"
                    style={{ color: COLOR.textFaint, borderColor: COLOR.border }}>
                    {["Trade ID","Symbol","Side","Qty","Price","Total","Time"].map(h => (
                      <th key={h} className="px-4 py-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan={7} className="px-5 py-8 text-center" style={{ color: COLOR.textFaint }}>
                      No trades yet. Start an algorithm to see trade history.
                    </td></tr>
                  ) : history.map(h => (
                    <tr key={h.id} className="border-b last:border-b-0 hover:bg-white/[0.02]"
                      style={{ borderColor: COLOR.border }}>
                      <td className="px-4 sm:px-5 py-2 font-mono" style={{ color: COLOR.textMuted }}>{h.id}</td>
                      <td className="px-4 py-2 font-semibold">{h.symbol}</td>
                      <td className="px-4 py-2 font-semibold" style={{ color: h.side === "BUY" ? COLOR.buy : COLOR.sell }}>{h.side}</td>
                      <td className="px-4 py-2 font-mono text-right">{h.qty}</td>
                      <td className="px-4 py-2 font-mono text-right">{CURRENCY}{fmtN(h.price)}</td>
                      <td className="px-4 py-2 font-mono text-right">{CURRENCY}{fmtN(h.total)}</td>
                      <td className="px-4 sm:px-5 py-2 text-right font-mono" style={{ color: COLOR.textFaint }}>{h.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Algo signals */}
            {activeTab === "signals" && (
              <div className="px-5 py-8 text-center" style={{ color: COLOR.textFaint }}>
                {algoRunning
                  ? `Algorithm running on ${algoSymbol} — signals will appear here when trades are executed.`
                  : "Start an algorithm to see live signals."}
              </div>
            )}

          </div>
        </section>
      </main>
    </div>
  );
}