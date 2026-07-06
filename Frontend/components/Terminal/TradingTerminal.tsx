'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import s from './Terminal.module.css';
import { ALGORITHMS, MOCK_ORDERS, MOCK_POSITIONS, SEED_SIGNALS } from './mockData';
import type { Algorithm, Order, Position, SignalLog, BotStatus, OrderSide, OrderType } from './types';

// REPLACE WITH:
import {
  Market, Orders, recommend, Bot, FyersAuth,runBacktest as apiRunBacktest,
  connectPriceWS, connectSignalWS,
  type Candle, type QuoteData, type OrderData, type PositionData,
} from '@/lib/liveApi';


// ── Watchlist symbols ───────────────────────────────────────────────────────
const WATCHLIST_SYMBOLS = ['AAPL','NVDA','TSLA','MSFT','AMZN','GOOGL','META'];

// ── Chart drawing (unchanged from original) ─────────────────────────────────
function drawChart(
  canvas: HTMLCanvasElement,
  candlesAll: Candle[],
  showEma: boolean, showBb: boolean, showVwap: boolean
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  canvas.width = W; canvas.height = H;
  if (!W || !H || candlesAll.length === 0) return;

  const candles = candlesAll.slice(-80);
  const prices  = candles.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const range = (maxP - minP) || 1;
  const padT = H * 0.05, padB = H * 0.18;
  const cH = H - padT - padB, cW = W - 64;
  const bw  = cW / candles.length;
  const py  = (p: number) => padT + ((maxP - p) / range) * cH;

  ctx.clearRect(0, 0, W, H);

  // Grid
  for (let i = 0; i <= 5; i++) {
    const y = padT + (cH / 5) * i;
    const p = maxP - (range / 5) * i;
    ctx.beginPath(); ctx.strokeStyle = 'rgba(30,45,74,0.6)';
    ctx.lineWidth = 1; ctx.setLineDash([3, 7]);
    ctx.moveTo(0, y); ctx.lineTo(W - 60, y); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(90,106,138,0.7)';
    ctx.font = "10px 'JetBrains Mono',monospace"; ctx.textAlign = 'right';
    ctx.fillText(p.toFixed(2), W - 4, y - 2);
  }

  // EMA
  if (showEma) {
    [12, 26].forEach((period, pi) => {
      const k = 2 / (period + 1); const ema: number[] = [];
      candles.forEach((c, i) => ema.push(i === 0 ? c.close : c.close * k + ema[i-1] * (1-k)));
      ctx.beginPath();
      ctx.strokeStyle = pi === 0 ? 'rgba(0,255,136,0.5)' : 'rgba(255,149,0,0.5)';
      ctx.lineWidth = 1.2;
      ema.forEach((v, i) => { const x = 4 + i * bw + bw/2; i === 0 ? ctx.moveTo(x, py(v)) : ctx.lineTo(x, py(v)); });
      ctx.stroke();
    });
  }

  // Bollinger Bands
  if (showBb) {
    const p = 20; const bbU: number[] = [], bbL: number[] = [];
    candles.forEach((_, i) => {
      if (i < p-1) { bbU.push(NaN); bbL.push(NaN); return; }
      const sl = candles.slice(i-p+1, i+1).map(c => c.close);
      const mean = sl.reduce((a,b) => a+b, 0) / p;
      const std  = Math.sqrt(sl.reduce((a,b) => a+(b-mean)**2, 0) / p);
      bbU.push(mean + 2*std); bbL.push(mean - 2*std);
    });
    [bbU, bbL].forEach(band => {
      ctx.beginPath();
      candles.forEach((_, i) => { if (isNaN(band[i])) return; const x = 4+i*bw+bw/2; i===0||isNaN(band[i-1]) ? ctx.moveTo(x,py(band[i])) : ctx.lineTo(x,py(band[i])); });
      ctx.strokeStyle = 'rgba(10,132,255,0.4)'; ctx.lineWidth = 1; ctx.stroke();
    });
  }

  // VWAP
  if (showVwap) {
    let cumPV = 0, cumV = 0;
    ctx.beginPath(); ctx.strokeStyle = 'rgba(175,82,222,0.7)'; ctx.lineWidth = 1.5;
    candles.forEach((c, i) => {
      cumPV += ((c.high+c.low+c.close)/3) * c.volume; cumV += c.volume;
      const vwap = cumPV / cumV; const x = 4+i*bw+bw/2;
      i === 0 ? ctx.moveTo(x, py(vwap)) : ctx.lineTo(x, py(vwap));
    });
    ctx.stroke();
  }

  // Candles
  candles.forEach((c, i) => {
    const x = 4+i*bw, cx = x+bw/2, isGreen = c.close >= c.open;
    const color = isGreen ? '#00FF88' : '#FF3B30';
    const bodyTop = py(Math.max(c.open, c.close)), bodyBot = py(Math.min(c.open, c.close));
    const bodyH = Math.max(bodyBot - bodyTop, 1);
    ctx.globalAlpha = 0.6; ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, py(c.high)); ctx.lineTo(cx, py(c.low)); ctx.stroke();
    ctx.globalAlpha = isGreen ? 0.85 : 0.75;
    ctx.fillStyle = isGreen ? 'rgba(0,255,136,0.12)' : 'rgba(255,59,48,0.12)';
    ctx.fillRect(x+0.5, bodyTop, bw-2, bodyH);
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.strokeRect(x+0.5, bodyTop, bw-2, bodyH);
    ctx.globalAlpha = 1;
  });

  // Volume bars
  const maxVol = Math.max(...candles.map(c => c.volume));
  const volH = padB * 0.6;
  candles.forEach((c, i) => {
    const x = 4+i*bw, vh = (c.volume/maxVol)*volH;
    ctx.fillStyle = c.close >= c.open ? 'rgba(0,255,136,0.18)' : 'rgba(255,59,48,0.18)';
    ctx.fillRect(x+0.5, H-vh-4, bw-2, vh);
  });

  // Last price line
  const last = candles[candles.length-1], lastY = py(last.close);
  ctx.beginPath(); ctx.strokeStyle = 'rgba(0,255,136,0.5)'; ctx.lineWidth = 1;
  ctx.setLineDash([3,5]); ctx.moveTo(0, lastY); ctx.lineTo(W-64, lastY); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(0,255,136,0.15)'; ctx.strokeStyle = '#00FF88'; ctx.lineWidth = 1;
  ctx.fillRect(W-62, lastY-9, 60, 18); ctx.strokeRect(W-62, lastY-9, 60, 18);
  ctx.fillStyle = '#00FF88'; ctx.font = "bold 10px 'JetBrains Mono',monospace";
  ctx.textAlign = 'center'; ctx.fillText(last.close.toFixed(2), W-32, lastY+4);
}

// ── Score color helper ─────────────────────────────────────────────────────
function scoreColor(score: number, st: Record<string,string>): string {
  if (score >= 75) return st.scoreHigh;
  if (score >= 50) return st.scoreMid;
  return st.scoreLow;
}
function catClass(cat: string, st: Record<string,string>): string {
  const key = `cat${cat.charAt(0).toUpperCase()}${cat.slice(1).replace(/_([a-z])/g, (_,c) => c.toUpperCase())}`;
  return st[key] ?? '';
}

// ══════════════════════════════════════════════════════════════════════════════
export default function TradingTerminal() {
  // ── Symbol & price ─────────────────────────────────────────────────────────
  const [activeSym, setActiveSym]     = useState('AAPL');
  const [quotes, setQuotes]           = useState<Record<string, QuoteData>>({});
  const [symDropOpen, setSymDropOpen] = useState(false);
  const [symSearch, setSymSearch]     = useState('');

  // ── Chart ──────────────────────────────────────────────────────────────────
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const frameRef   = useRef<number>(0);
  const [candles, setCandles]     = useState<Candle[]>([]);
  const [tf, setTf]               = useState('15m');
  const [showEma, setShowEma]     = useState(true);
  const [showBb,  setShowBb]      = useState(false);
  const [showVwap,setShowVwap]    = useState(false);
  const [chartLoading, setChartLoading] = useState(false);

  // ── Sub-panel ──────────────────────────────────────────────────────────────
  const [subTab, setSubTab]   = useState<'orders'|'positions'|'log'>('orders');
  const [orders, setOrders]   = useState<OrderData[]>(MOCK_ORDERS as unknown as OrderData[]);
  const [positions, setPositions] = useState<PositionData[]>(MOCK_POSITIONS as unknown as PositionData[]);

  // ── Right panel ────────────────────────────────────────────────────────────
  const [rightTab, setRightTab] = useState<'ticket'|'algos'|'backtest'|'signals'>('algos');
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [orderQty,  setOrderQty]  = useState('100');
  const [orderLimitPrice, setOrderLimitPrice] = useState('');
  const [orderLoading, setOrderLoading] = useState(false);

  // ── Bot ────────────────────────────────────────────────────────────────────
  const [botStatus, setBotStatus]   = useState<string>('STOPPED');
  const [botPnl,    setBotPnl]      = useState(0);
  const [botTrades, setBotTrades]   = useState(0);
  const [botAlgo,   setBotAlgo]     = useState('');

  // ── Algorithms ─────────────────────────────────────────────────────────────
  const [algos, setAlgos]               = useState<(Algorithm & { score?: number; rank?: number })[]>(ALGORITHMS);
  const [selectedAlgo, setSelectedAlgo] = useState<Algorithm | null>(null);
  const [aiRunning,    setAiRunning]    = useState(false);
  const [aiDone,       setAiDone]       = useState(false);

  // ── Backtest ───────────────────────────────────────────────────────────────
  const [btRunning,  setBtRunning]  = useState(false);
  const [btProgress, setBtProgress] = useState(0);
  const [btResult,   setBtResult]   = useState<Record<string,unknown> | null>(null);

  // ── Signals ────────────────────────────────────────────────────────────────
  const [signals, setSignals] = useState<SignalLog[]>(SEED_SIGNALS);

  // ── Fyers auth ─────────────────────────────────────────────────────────────
  const [fyersAuthed, setFyersAuthed] = useState(false);
  const [fyersProfile, setFyersProfile] = useState<Record<string,string> | null>(null);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{msg:string;color:string}|null>(null);

  // ── Clock ──────────────────────────────────────────────────────────────────
  const [clock, setClock] = useState('');

  const showToast = useCallback((msg: string, color = '#00FF88') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const pushSignal = useCallback((sig: Omit<SignalLog, 'id'>) => {
    setSignals(prev => [{ ...sig, id: String(Date.now()) }, ...prev.slice(0, 99)]);
  }, []);

  // ── Clock tick ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);

  // ── Check Fyers auth on mount ──────────────────────────────────────────────
  useEffect(() => {
    FyersAuth.status().then(r => {
      setFyersAuthed(r.authenticated);
      if (r.profile) setFyersProfile(r.profile as Record<string,any>);
    }).catch(() => {});

    // Check if we just came back from Fyers OAuth
    const params = new URLSearchParams(window.location.search);
    if (params.get('fyers_auth') === 'success') {
      showToast('Fyers account connected!', '#00FF88');
      setFyersAuthed(true);
      window.history.replaceState({}, '', '/terminal');
    }
    if (params.get('fyers_error')) {
      showToast(`Fyers auth failed: ${params.get('fyers_error')}`, '#FF3B30');
      window.history.replaceState({}, '', '/terminal');
    }
  }, [showToast]);

  // ── Batch watchlist quotes ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = () => {
      Market.watchlist(WATCHLIST_SYMBOLS).then(r => {
        const map: Record<string, QuoteData> = {};
        r.quotes.forEach((q: QuoteData) => { map[q.symbol] = q; });
        setQuotes(map);
      }).catch(() => {});
    };
    fetchAll();
    const id = setInterval(fetchAll, 10000);
    return () => clearInterval(id);
  }, []);

  // ── Live price WebSocket ───────────────────────────────────────────────────
  useEffect(() => {
    const ws = connectPriceWS(activeSym, (data) => {
      setQuotes(prev => ({ ...prev, [data.symbol]: data }));
    });
    return () => ws.close();
  }, [activeSym]);

  // ── Signal WebSocket ───────────────────────────────────────────────────────
  useEffect(() => {
    const ws = connectSignalWS((sig) => {
      pushSignal(sig as SignalLog);
      // Update bot pnl from engine signals
      if (sig.type === 'SELL' && sig.message.includes('P&L:')) {
        const match = sig.message.match(/P&L:\s*([+-]?\d+\.?\d*)/);
        if (match) setBotPnl(p => p + parseFloat(match[1]));
      }
    });
    return () => ws.close();
  }, [pushSignal]);

  // ── Fetch candles when symbol or tf changes ────────────────────────────────
  useEffect(() => {
    setChartLoading(true);
    Market.candles(activeSym, tf)
      .then(r => setCandles(r.candles))
      .catch(() => {})
      .finally(() => setChartLoading(false));
  }, [activeSym, tf]);

  // ── Draw chart ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    drawChart(canvas, candles, showEma, showBb, showVwap);
  }, [candles, showEma, showBb, showVwap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      if (candles.length) drawChart(canvas, candles, showEma, showBb, showVwap);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [candles, showEma, showBb, showVwap]);

  // ── Poll bot status ────────────────────────────────────────────────────────
  useEffect(() => {
    const poll = () => {
      Bot.status().then(st => {
        setBotStatus(st.status);
        setBotPnl(st.pnl_today);
        setBotTrades(st.trades_today);
        setBotAlgo(st.algo_name ?? '');
      }).catch(() => {});
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch orders + positions ───────────────────────────────────────────────
  useEffect(() => {
    if (!fyersAuthed) return;
    Orders.list().then(r => setOrders(r.orders)).catch(() => {});
    Orders.positions().then(r => setPositions(r.positions)).catch(() => {});
    const id = setInterval(() => {
      Orders.list().then(r => setOrders(r.orders)).catch(() => {});
      Orders.positions().then(r => setPositions(r.positions)).catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [fyersAuthed]);

  // ── Place order ────────────────────────────────────────────────────────────
  const submitOrder = useCallback(async () => {
    setOrderLoading(true);
    try {
      const result = await Orders.place({
        symbol:    activeSym,
        side:      orderSide,
        qty:       parseInt(orderQty) || 1,
        orderType: orderType,
        limitPrice: orderType !== 'MARKET' ? parseFloat(orderLimitPrice) || 0 : 0,
      });
      showToast(`Order placed: ${result.orderId}`, orderSide === 'BUY' ? '#00FF88' : '#FF3B30');
      pushSignal({
        time: new Date().toLocaleTimeString('en-US',{hour12:false}),
        algo: 'Manual', symbol: activeSym, type: orderSide,
        message: `Manual ${orderSide} ${orderQty}×${activeSym} @ MARKET — ${result.message}`,
      });
      // Refresh orders
      Orders.list().then(r => setOrders(r.orders)).catch(() => {});
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Order failed';
      showToast(msg, '#FF3B30');
    } finally {
      setOrderLoading(false);
    }
  }, [activeSym, orderSide, orderType, orderQty, orderLimitPrice, showToast, pushSignal]);

  // ── AI rank ────────────────────────────────────────────────────────────────
  const runAiRank = useCallback(async () => {
    setAiRunning(true); setAiDone(false);
    pushSignal({ time: new Date().toLocaleTimeString('en-US',{hour12:false}), algo: 'AI', symbol: activeSym, type: 'AI', message: `Running AI backtest on 20 algorithms for ${activeSym}...` });
    try {
      const result = await recommend.full({ symbol: activeSym, period: '2y' });
      const ranked = result.all_strategies;  // already sorted best-to-worst by recommender.py
      setAlgos(ranked.map((r: any, idx: number) => ({
        id: r.strategy.toLowerCase().replace(/\s+/g, '_'),
        name: r.strategy,
        shortName: r.strategy.slice(0, 4).toUpperCase(),
        category: 'trend',
        description: r.best_for,
        winRate: r.win_ratio,
        avgReturn: r.profit_pct,
        maxDrawdown: Math.abs(r.max_drawdown),
        sharpe: r.sharpe,
        score: r.score,
        rank: idx + 1,
        signals: [],
      })));
      setAiDone(true);
      setSelectedAlgo({
        id: ranked[0].strategy.toLowerCase().replace(/\s+/g, '_'),
        name: ranked[0].strategy,
        shortName: ranked[0].strategy.slice(0,4).toUpperCase(),
        category: 'trend',
        description: ranked[0].best_for,
        winRate: ranked[0].win_ratio,
        avgReturn: ranked[0].profit_pct,
        maxDrawdown: Math.abs(ranked[0].max_drawdown),
        sharpe: ranked[0].sharpe,
        signals: [],
      });
      const top = { name: ranked[0].strategy, score: ranked[0].score };
      pushSignal({ time: new Date().toLocaleTimeString('en-US',{hour12:false}), algo: 'AI', symbol: activeSym, type: 'AI', message: `AI Recommendation: "${top.name}" ranked #1 for ${activeSym}. Score: ${top.score}/100` });
      showToast(`AI ranked "${top.name}" #1 for ${activeSym}`, '#5AC8FA');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'AI rank failed', '#FF3B30');
    } finally {
      setAiRunning(false);
    }
  }, [activeSym, pushSignal, showToast]);

  // ── Single backtest ────────────────────────────────────────────────────────
  const runBacktest = useCallback(async () => {
    if (!selectedAlgo) return;
    setBtRunning(true); setBtProgress(0); setBtResult(null);
    // Fake progress bar while waiting
    const prog = setInterval(() => setBtProgress(p => Math.min(p + 6, 92)), 150);
    try {
      const result = await apiRunBacktest({
        symbol: activeSym,
        strategy: selectedAlgo.name,
        period: '2y',
        interval: '1d',
        initial_balance: 10000,
      });
      clearInterval(prog); setBtProgress(100);
      setBtResult(result as unknown as Record<string,unknown>);
      pushSignal({
        time: new Date().toLocaleTimeString('en-US',{hour12:false}),
        algo: 'Backtest', symbol: activeSym, type: 'BACKTEST',
        message: `${selectedAlgo.name} | ${activeSym} | Return: +${result.totalReturn}% | Sharpe: ${result.sharpe} | DD: -${result.maxDrawdown}%`,
      });
    } catch (e: unknown) {
      clearInterval(prog);
      showToast(e instanceof Error ? e.message : 'Backtest failed', '#FF3B30');
    } finally {
      setBtRunning(false);
    }
  }, [selectedAlgo, activeSym, pushSignal, showToast]);

  // ── Bot controls ───────────────────────────────────────────────────────────
  const startBot = useCallback(async () => {
    if (!selectedAlgo) { showToast('Select an algorithm first', '#FF9500'); return; }
    try {
      await Bot.start({ symbol: activeSym, algoId: selectedAlgo.id, algoName: selectedAlgo.name, qty: parseInt(orderQty)||1, intervalSec: 60 });
      setBotStatus('RUNNING');
      showToast(`Bot started: ${selectedAlgo.name} on ${activeSym}`, '#00FF88');
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Start failed', '#FF3B30'); }
  }, [selectedAlgo, activeSym, orderQty, showToast]);

  const pauseBot = useCallback(async () => {
    try {
      const r = await (botStatus === 'PAUSED' ? Bot.resume() : Bot.pause());
      setBotStatus(botStatus === 'PAUSED' ? 'RUNNING' : 'PAUSED');
      showToast(r.message);
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Failed', '#FF3B30'); }
  }, [botStatus, showToast]);

  const stopBot = useCallback(async () => {
    try {
      await Bot.stop();
      setBotStatus('STOPPED');
      showToast('Bot stopped', '#FF3B30');
    } catch (e: unknown) { showToast(e instanceof Error ? e.message : 'Failed', '#FF3B30'); }
  }, [showToast]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const activeQuote  = quotes[activeSym];
  const livePrice    = activeQuote?.price ?? 0;
  const livePct      = activeQuote?.changePct ?? 0;
  const liveChange   = activeQuote?.change ?? 0;
  const lastCandle   = candles[candles.length - 1];
  const isMarketOpen = (() => { const h = new Date().getHours(); return h >= 9 && h < 16; })();
  const filteredSym  = WATCHLIST_SYMBOLS.filter(sym => sym.toLowerCase().includes(symSearch.toLowerCase()));

  // ── Status dot class ───────────────────────────────────────────────────────
  const botDotClass = botStatus === 'RUNNING' ? s.statusRunning
    : botStatus === 'PAUSED' ? s.statusPaused
    : botStatus === 'BACKTESTING' ? s.statusBacktest
    : s.statusStopped;

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className={s.terminal}>

      {/* ── TOP BAR ── */}
      <div className={s.topBar}>
        <Link href="/" className={s.topBarLogo}>
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
            <path d="M2 16L8 8L12 12L16 6L20 10" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="20" cy="10" r="2" fill="#00FF88"/>
          </svg>
          <span>Penn</span>
        </Link>

        {/* Symbol picker */}
        <div className={s.symbolSearch} onClick={() => setSymDropOpen(o => !o)}>
          <span className={s.symbolDisplay}>{activeSym}</span>
          <span className={`${s.marketBadge} ${s.equity}`}>EQUITY</span>
          <span className={s.symbolPrice}>{livePrice.toFixed(2)}</span>
          <span className={`${s.symbolChange} ${livePct >= 0 ? s.up : s.down}`}>
            {livePct >= 0 ? '+' : ''}{livePct.toFixed(2)}%
          </span>
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{marginLeft:4}}>
            <path d="M2 4l4 4 4-4" stroke="#5A6A8A" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>

          {symDropOpen && (
            <div className={s.symbolDropdown} onClick={e => e.stopPropagation()}>
              <div className={s.symbolDropdownSearch}>
                <input className={s.symbolDropdownInput} placeholder="Search symbol..."
                  value={symSearch} onChange={e => setSymSearch(e.target.value)} autoFocus />
              </div>
              <div className={s.symbolDropdownList}>
                {filteredSym.map(sym => {
                  const q = quotes[sym];
                  return (
                    <div key={sym} className={s.symbolDropdownItem} onClick={() => {
                      setActiveSym(sym); setSymDropOpen(false); setSymSearch('');
                      setAiDone(false); setBtResult(null); setSelectedAlgo(null); setAlgos(ALGORITHMS);
                    }}>
                      <div className={s.sdlLeft}>
                        <span className={s.sdlTicker}>{sym}</span>
                        <span className={s.sdlName}>NSE Equity</span>
                      </div>
                      <div className={s.sdlRight}>
                        <span className={s.sdlPrice}>{q ? q.price.toFixed(2) : '—'}</span>
                        {q && <span className={`${s.symbolChange} ${q.changePct >= 0 ? s.up : s.down}`}>
                          {q.changePct >= 0 ? '+' : ''}{q.changePct.toFixed(2)}%
                        </span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* OHLCV stats */}
        <div className={s.topBarStats}>
          {[
            { l:'OPEN',   v: lastCandle?.open.toFixed(2)  ?? '—' },
            { l:'HIGH',   v: lastCandle?.high.toFixed(2)  ?? '—' },
            { l:'LOW',    v: lastCandle?.low.toFixed(2)   ?? '—' },
            { l:'CLOSE',  v: lastCandle?.close.toFixed(2) ?? '—' },
            { l:'VOLUME', v: lastCandle ? (lastCandle.volume/1e6).toFixed(2)+'M' : '—' },
            { l:'DAY P&L',v: `${botPnl >= 0 ? '+' : ''}$${botPnl.toFixed(2)}` },
          ].map(({l,v}) => (
            <div key={l} className={s.topStat}>
              <span className={s.topStatLabel}>{l}</span>
              <span className={s.topStatValue} style={{ color: l==='DAY P&L' ? (botPnl >= 0 ? '#00FF88' : '#FF3B30') : undefined }}>{v}</span>
            </div>
          ))}
        </div>

        <div className={s.topBarRight}>
          <span className={s.clockDisplay}>{clock}</span>
          <span className={`${s.sessionBadge} ${isMarketOpen ? s.sessionOpen : s.sessionClosed}`}>
            {isMarketOpen ? '● OPEN' : '● CLOSED'}
          </span>
          {fyersAuthed ? (
            <span style={{fontSize:'0.7rem',color:'#00FF88',border:'1px solid rgba(0,255,136,0.3)',padding:'2px 8px',borderRadius:4}}>
              ✓ Fyers: {fyersProfile?.name ?? 'Connected'}
            </span>
          ) : (
            <button onClick={async () => {
                FyersAuth.login();
              }}
              style={{fontSize:'0.7rem',background:'rgba(10,132,255,0.15)',color:'#0A84FF',border:'1px solid rgba(10,132,255,0.3)',padding:'3px 10px',borderRadius:5,cursor:'pointer'}}>
              Connect Fyers
            </button>
          )}
          {!fyersAuthed && (
            <button onClick={async () => {
                const code = window.prompt(
                  'After logging into Fyers, copy the "auth_code" value from the redirected page\'s URL and paste it here:'
                );
                if (!code) return;
                try {
                  await FyersAuth.submitCode(code.trim());
                  setFyersAuthed(true);
                  const r = await FyersAuth.status();
                  if (r.profile) setFyersProfile(r.profile as unknown as Record<string,string>);
                  showToast('Fyers account connected!', '#00FF88');
                } catch (e: unknown) {
                  showToast(e instanceof Error ? e.message : 'Invalid auth code', '#FF3B30');
                }
              }}
              style={{fontSize:'0.7rem',background:'rgba(0,255,136,0.1)',color:'#00FF88',border:'1px solid rgba(0,255,136,0.25)',padding:'3px 10px',borderRadius:5,cursor:'pointer'}}>
              Paste Code
            </button>
          )}
          <Link href="/" className={s.backBtn}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Dashboard
          </Link>
        </div>
      </div>

      {/* ── MAIN 3-COL LAYOUT ── */}
      <div className={s.mainLayout}>

        {/* ──── LEFT SIDEBAR ──── */}
        <div className={s.leftSidebar}>

          {/* Watchlist */}
          <div className={s.sidebarSection} style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>
            <div className={s.sidebarHead}>
              <span className={s.sidebarHeadLabel}>Watchlist</span>
            </div>
            <div style={{ overflowY:'auto', flex:1 }}>
              {WATCHLIST_SYMBOLS.map(sym => {
                const q = quotes[sym];
                return (
                  <div key={sym} className={`${s.watchlistItem} ${sym === activeSym ? s.active : ''}`}
                    onClick={() => { setActiveSym(sym); setAiDone(false); setBtResult(null); setSelectedAlgo(null); setAlgos(ALGORITHMS); }}>
                    <div className={s.wlLeft}>
                      <span className={s.wlTicker}>{sym}</span>
                      <span className={s.wlName}>{sym}</span>
                    </div>
                    <div className={s.wlRight}>
                      <span className={s.wlPrice}>{q ? q.price.toFixed(2) : '—'}</span>
                      <span className={`${s.wlChg} ${(q?.changePct ?? 0) >= 0 ? s.up : s.down}`}>
                        {q ? `${q.changePct >= 0 ? '+' : ''}${q.changePct.toFixed(2)}%` : '—'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bot controls */}
          <div className={s.sidebarSection}>
            <div className={s.sidebarHead}><span className={s.sidebarHeadLabel}>Algo Bot</span></div>
            <div className={s.botControls}>
              <div className={s.botStatusRow}>
                <div className={s.botStatusIndicator}>
                  <span className={`${s.statusDot} ${botDotClass}`} />
                  {botStatus}
                </div>
                {botAlgo && <span style={{fontSize:'0.62rem',color:'#5A6A8A'}}>{botAlgo.slice(0,12)}</span>}
              </div>
              <div className={s.botBtnRow}>
                <button className={`${s.botBtn} ${s.botBtnStart}`} onClick={startBot}>▶ Start</button>
                <button className={`${s.botBtn} ${s.botBtnPause}`} onClick={pauseBot}>
                  {botStatus === 'PAUSED' ? '▶ Resume' : '⏸ Pause'}
                </button>
                <button className={`${s.botBtn} ${s.botBtnStop}`}  onClick={stopBot}>■ Stop</button>
              </div>
              <div className={s.botMetaRow}>
                <div className={s.botMeta}>
                  <span className={s.botMetaLabel}>Today P&L</span>
                  <span className={s.botMetaValue} style={{color: botPnl >= 0 ? '#00FF88' : '#FF3B30'}}>
                    {botPnl >= 0 ? '+' : ''}${botPnl.toFixed(2)}
                  </span>
                </div>
                <div className={s.botMeta}>
                  <span className={s.botMetaLabel}>Trades</span>
                  <span className={s.botMetaValue}>{botTrades}</span>
                </div>
                <div className={s.botMeta}>
                  <span className={s.botMetaLabel}>Algo</span>
                  <span className={s.botMetaValue}>{selectedAlgo?.shortName ?? '—'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Positions mini */}
          <div className={s.sidebarSection}>
            <div className={s.sidebarHead}><span className={s.sidebarHeadLabel}>Positions ({positions.length})</span></div>
            <div className={s.positionsList}>
              {positions.map((p, i) => (
                <div key={i} className={s.positionItem}>
                  <div className={s.posLeft}>
                    <span className={s.posTicker}>{p.symbol}</span>
                    <span className={s.posAlgo}>{p.algo}</span>
                  </div>
                  <div className={s.posRight}>
                    <span className={`${s.posPnl} ${p.pnl >= 0 ? s.up : s.down}`}>
                      {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                    </span>
                    <span style={{fontSize:'0.62rem',color: p.pnlPct >= 0 ? '#00FF88' : '#FF3B30'}}>
                      {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ──── CHART AREA ──── */}
        <div className={s.chartArea}>
          <div className={s.chartToolbar}>
            <div className={s.tfGroup}>
              {['1m','5m','15m','1h','4h','1D'].map(t => (
                <button key={t} className={`${s.tfBtn} ${tf===t ? s.active : ''}`} onClick={() => setTf(t)}>{t}</button>
              ))}
            </div>
            <div className={s.indicatorGroup}>
              <button className={`${s.indBtn} ${showEma  ? s.active : ''}`} onClick={() => setShowEma(v=>!v)}>EMA</button>
              <button className={`${s.indBtn} ${showBb   ? s.active : ''}`} onClick={() => setShowBb(v=>!v)}>BB</button>
              <button className={`${s.indBtn} ${showVwap ? s.active : ''}`} onClick={() => setShowVwap(v=>!v)}>VWAP</button>
            </div>
            <div className={s.chartToolbarRight}>
              {chartLoading && <span style={{fontSize:'0.68rem',color:'#5A6A8A'}}>Loading...</span>}
              <div className={s.ohlcDisplay}>
                {([['O',lastCandle?.open],['H',lastCandle?.high],['L',lastCandle?.low],['C',lastCandle?.close]] as [string,number|undefined][]).map(([l,v]) => (
                  <div key={l} className={s.ohlcItem}>
                    <span className={s.ohlcLabel}>{l}</span>
                    <span className={s.ohlcVal}>{v?.toFixed(2) ?? '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={s.chartCanvas}>
            <canvas ref={canvasRef} style={{width:'100%',height:'100%'}} />
          </div>

          {/* Sub-panel */}
          <div className={s.subPanel}>
            <div className={s.subPanelTabs}>
              {(['orders','positions','log'] as const).map(t => (
                <button key={t} className={`${s.subTab} ${subTab===t ? s.active : ''}`} onClick={() => setSubTab(t)}>
                  {t==='orders' ? `Orders (${orders.length})` : t==='positions' ? `Positions (${positions.length})` : 'Signal Log'}
                </button>
              ))}
            </div>
            <div className={s.subPanelContent}>
              {subTab === 'orders' && (
                <table className={s.dataTable}>
                  <thead><tr><th>ID</th><th>Symbol</th><th>Side</th><th>Type</th><th>Qty</th><th>Price</th><th>Status</th><th>P&L</th><th>Time</th></tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={{fontFamily:'JetBrains Mono,monospace',fontSize:'0.7rem',color:'#5A6A8A'}}>{o.id}</td>
                        <td style={{fontWeight:600,color:'#E8EDF5'}}>{o.symbol}</td>
                        <td><span className={`${s.orderSide} ${o.side==='BUY' ? s.buy : s.sell}`}>{o.side}</span></td>
                        <td style={{color:'#8A9BBF',fontSize:'0.7rem'}}>{o.type}</td>
                        <td style={{fontFamily:'JetBrains Mono,monospace'}}>{o.qty}</td>
                        <td style={{fontFamily:'JetBrains Mono,monospace'}}>{o.price?.toFixed(2)}</td>
                        <td><span className={`${s.statusPill} ${o.status==='FILLED' ? s.statusFilled : o.status==='PENDING' ? s.statusPending : s.statusCancelled}`}>{o.status}</span></td>
                        <td style={{fontFamily:'JetBrains Mono,monospace',color: o.pnl!=null ? (o.pnl>=0 ? '#00FF88' : '#FF3B30') : '#5A6A8A'}}>
                          {o.pnl!=null ? `${o.pnl>=0?'+':''}$${o.pnl.toFixed(2)}` : '—'}
                        </td>
                        <td style={{color:'#5A6A8A',fontFamily:'JetBrains Mono,monospace',fontSize:'0.68rem'}}>{o.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {subTab === 'positions' && (
                <table className={s.dataTable}>
                  <thead><tr><th>Symbol</th><th>Side</th><th>Qty</th><th>Avg Entry</th><th>Current</th><th>P&L</th><th>P&L %</th><th>Algorithm</th></tr></thead>
                  <tbody>
                    {positions.map((p,i) => (
                      <tr key={i}>
                        <td style={{fontWeight:600,color:'#E8EDF5'}}>{p.symbol}</td>
                        <td><span className={`${s.orderSide} ${p.side==='BUY' ? s.buy : s.sell}`}>{p.side}</span></td>
                        <td style={{fontFamily:'JetBrains Mono,monospace'}}>{p.qty}</td>
                        <td style={{fontFamily:'JetBrains Mono,monospace'}}>{p.avgEntry.toFixed(2)}</td>
                        <td style={{fontFamily:'JetBrains Mono,monospace'}}>{p.currentPrice.toFixed(2)}</td>
                        <td style={{fontFamily:'JetBrains Mono,monospace',color:p.pnl>=0?'#00FF88':'#FF3B30',fontWeight:600}}>
                          {p.pnl>=0?'+':''}${p.pnl.toFixed(2)}
                        </td>
                        <td style={{fontFamily:'JetBrains Mono,monospace',color:p.pnlPct>=0?'#00FF88':'#FF3B30'}}>
                          {p.pnlPct>=0?'+':''}{p.pnlPct.toFixed(2)}%
                        </td>
                        <td style={{color:'#8A9BBF',fontSize:'0.7rem'}}>{p.algo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {subTab === 'log' && (
                <div>
                  {signals.map(sig => (
                    <div key={sig.id} className={s.signalItem}>
                      <span className={s.sigTime}>{sig.time}</span>
                      <span className={`${s.sigType} ${sig.type==='BUY'?s.sigBuy:sig.type==='SELL'?s.sigSell:sig.type==='WARN'?s.sigWarn:sig.type==='BACKTEST'?s.sigBacktest:sig.type==='AI'?s.sigAi:s.sigInfo}`}>{sig.type}</span>
                      <span className={s.sigMsg}>{sig.message}</span>
                      <span className={s.sigAlgo}>{sig.algo}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ──── RIGHT PANEL ──── */}
        <div className={s.rightPanel}>
          <div className={s.rightTabs}>
            {([['ticket','Order'],['algos','Algorithms'],['backtest','Backtest'],['signals','Live Signals']] as const).map(([id,label]) => (
              <button key={id} className={`${s.rightTab} ${rightTab===id ? s.active : ''}`} onClick={() => setRightTab(id)}>{label}</button>
            ))}
          </div>

          <div className={s.rightContent}>

            {/* ORDER TICKET */}
            {rightTab === 'ticket' && (
              <div className={s.orderTicket}>
                <div className={s.ticketSymbolRow}>
                  <span className={s.ticketSymbol}>{activeSym}</span>
                  <span className={s.ticketPrice}>{livePrice.toFixed(2)}</span>
                </div>
                <div className={s.sideBtnRow}>
                  <button className={`${s.sideBtn} ${s.sideBtnBuy}  ${orderSide==='BUY'  ? s.sel : ''}`} onClick={() => setOrderSide('BUY')}>BUY / LONG</button>
                  <button className={`${s.sideBtn} ${s.sideBtnSell} ${orderSide==='SELL' ? s.sel : ''}`} onClick={() => setOrderSide('SELL')}>SELL / SHORT</button>
                </div>
                <div className={s.orderTypeRow}>
                  {(['MARKET','LIMIT','STOP','STOP_LIMIT'] as OrderType[]).map(t => (
                    <button key={t} className={`${s.orderTypeBtn} ${orderType===t ? s.active : ''}`} onClick={() => setOrderType(t)}>{t.replace('_',' ')}</button>
                  ))}
                </div>
                <div className={s.formGroup}>
                  <label className={s.formLabel}>Quantity</label>
                  <input className={s.formInput} type="number" value={orderQty} onChange={e => setOrderQty(e.target.value)} />
                </div>
                {orderType !== 'MARKET' && (
                  <div className={s.formGroup}>
                    <label className={s.formLabel}>Limit Price</label>
                    <input className={s.formInput} type="number" placeholder={livePrice.toFixed(2)}
                      value={orderLimitPrice} onChange={e => setOrderLimitPrice(e.target.value)} />
                  </div>
                )}
                <div className={s.ticketMeta}>
                  {[
                    { l:'Est. Value', v:`$${((parseInt(orderQty)||0) * livePrice).toLocaleString('en-US',{maximumFractionDigits:2})}` },
                    { l:'Bid',   v:(livePrice * 0.9998).toFixed(2) },
                    { l:'Ask',   v:(livePrice * 1.0002).toFixed(2) },
                    { l:'Spread',v:(livePrice * 0.0004).toFixed(2) },
                  ].map(({l,v}) => (
                    <div key={l} className={s.metaBox}>
                      <div className={s.metaBoxLabel}>{l}</div>
                      <div className={s.metaBoxValue}>{v}</div>
                    </div>
                  ))}
                </div>
                {!fyersAuthed && (
                  <div style={{background:'rgba(255,149,0,0.08)',border:'1px solid rgba(255,149,0,0.25)',borderRadius:6,padding:'0.5rem',fontSize:'0.72rem',color:'#FF9500',marginBottom:'0.5rem'}}>
                    ⚠ Connect Fyers account to place real orders
                  </div>
                )}
                <button
                  className={`${s.submitBtn} ${orderSide==='BUY' ? s.submitBuy : s.submitSell}`}
                  onClick={submitOrder} disabled={orderLoading}>
                  {orderLoading ? 'Placing...' : `${orderSide==='BUY'?'▲':'▼'} ${orderSide} ${orderQty} × ${activeSym}`}
                </button>
              </div>
            )}

            {/* ALGORITHMS */}
            {rightTab === 'algos' && (
              <div className={s.algoPanel}>
                <div className={s.aiBanner}>
                  <span className={s.aiBannerIcon}>🤖</span>
                  <span className={s.aiBannerText}>
                    AI backtests all 20 algorithms on <b>{activeSym}</b> using real historical data and ranks them.
                  </span>
                  <button className={s.aiRunBtn} onClick={runAiRank} disabled={aiRunning}>
                    {aiRunning ? 'Running...' : aiDone ? '↻ Re-run' : '▶ Run AI'}
                  </button>
                </div>
                <div className={s.algoList}>
                  {algos.map(algo => (
                    <div key={algo.id}
                      className={`${s.algoItem} ${selectedAlgo?.id===algo.id ? s.selected : ''} ${algo.rank===1 && aiDone ? s.topRanked : ''}`}
                      onClick={() => { setSelectedAlgo(algo); setBtResult(null); }}>
                      {algo.rank && aiDone && <span className={s.rankBadge}>#{algo.rank}</span>}
                      <div className={s.algoItemHeader}>
                        <span className={s.algoName}>
                          {algo.name}
                          <span className={`${s.algoCategory} ${catClass(algo.category, s as unknown as Record<string,string>)}`}>{algo.category.replace('_',' ')}</span>
                        </span>
                        {algo.score !== undefined && aiDone && (
                          <span className={`${s.algoScore} ${scoreColor(algo.score, s as unknown as Record<string,string>)}`}>{algo.score}</span>
                        )}
                      </div>
                      <div style={{fontSize:'0.65rem',color:'#5A6A8A',marginBottom:3,lineHeight:1.4}}>{algo.description}</div>
                      <div className={s.algoStats}>
                        <span className={s.algoStat}>WR <span>{algo.winRate}%</span></span>
                        <span className={s.algoStat}>Sharpe <span>{algo.sharpe}</span></span>
                        <span className={s.algoStat}>DD <span>-{algo.maxDrawdown}%</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BACKTEST */}
            {rightTab === 'backtest' && (
              <div className={s.backtestPanel}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span className={s.backtestHeader}>{selectedAlgo ? selectedAlgo.name : 'Select an algorithm first'}</span>
                  {selectedAlgo && <span style={{fontSize:'0.65rem',color:'#5A6A8A'}}>{activeSym}</span>}
                </div>
                {!selectedAlgo && (
                  <div style={{color:'#4A5A7A',fontSize:'0.8rem',padding:'1rem 0',textAlign:'center'}}>
                    Go to Algorithms tab and select one to backtest.
                  </div>
                )}
                {selectedAlgo && (
                  <>
                    <button className={s.btRunBtn} onClick={runBacktest} disabled={btRunning}>
                      {btRunning ? `Running... ${Math.round(btProgress)}%` : `▶ Run Backtest — ${selectedAlgo.name}`}
                    </button>
                    {btRunning && (
                      <div className={s.btProgressBar}>
                        <div className={s.btProgressFill} style={{width:`${btProgress}%`}} />
                      </div>
                    )}
                    {btResult && !btRunning && (
                      <>
                        <div className={s.backtestHeader} style={{color:'#00FF88'}}>
                          ✓ Backtest complete — AI Score: {btResult.score as number}/100
                        </div>
                        <div className={s.btResultGrid}>
                          {[
                            {l:'Total Return', v:`+${(btResult.totalReturn as number).toFixed(1)}%`, c:'#00FF88'},
                            {l:'Sharpe Ratio', v:(btResult.sharpe as number).toFixed(2),             c:'#0A84FF'},
                            {l:'Max Drawdown', v:`-${(btResult.maxDrawdown as number).toFixed(1)}%`, c:'#FF3B30'},
                            {l:'Win Rate',     v:`${(btResult.winRate as number).toFixed(1)}%`,      c:'#E8EDF5'},
                            {l:'Total Trades', v:String(btResult.numTrades),                         c:'#E8EDF5'},
                            {l:'AI Score',     v:`${btResult.score as number}/100`,                  c:'#5AC8FA'},
                          ].map(({l,v,c}) => (
                            <div key={l} className={s.btResultCard}>
                              <div className={s.btResultLabel}>{l}</div>
                              <div className={s.btResultValue} style={{color:c}}>{v}</div>
                            </div>
                          ))}
                        </div>
                        <button className={`${s.botBtn} ${s.botBtnStart}`} style={{width:'100%',padding:'0.5rem'}} onClick={startBot}>
                          ▶ Deploy {selectedAlgo.name} Live
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* LIVE SIGNALS */}
            {rightTab === 'signals' && (
              <div className={s.signalLog}>
                <div style={{padding:'0.4rem 0.75rem',background:'#0D1526',borderBottom:'1px solid #1E2D4A',display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <span className={`${s.statusDot} ${botDotClass}`} />
                  <span style={{fontSize:'0.68rem',color:'#5A6A8A'}}>
                    {botStatus === 'RUNNING' ? `Live — ${botAlgo} on ${activeSym}` : 'Bot inactive'}
                  </span>
                  <button onClick={() => setSignals(SEED_SIGNALS)}
                    style={{marginLeft:'auto',background:'none',border:'none',color:'#4A5A7A',fontSize:'0.68rem',cursor:'pointer'}}>Clear</button>
                </div>
                <div className={s.signalItems}>
                  {signals.map(sig => (
                    <div key={sig.id} className={s.signalItem}>
                      <span className={s.sigTime}>{sig.time}</span>
                      <span className={`${s.sigType} ${sig.type==='BUY'?s.sigBuy:sig.type==='SELL'?s.sigSell:sig.type==='WARN'?s.sigWarn:sig.type==='BACKTEST'?s.sigBacktest:sig.type==='AI'?s.sigAi:s.sigInfo}`}>{sig.type}</span>
                      <span className={s.sigMsg}>{sig.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={s.toast}>
          <span className={s.toastDot} style={{background: toast.color}} />
          {toast.msg}
        </div>
      )}
    </div>
  );
}