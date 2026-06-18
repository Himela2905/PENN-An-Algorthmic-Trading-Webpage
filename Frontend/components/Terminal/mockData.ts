import { Algorithm, Candle, Order, Position, SignalLog, Symbol } from './types';

// ── Symbols ────────────────────────────────────────────────────────────────
export const SYMBOLS: Symbol[] = [
  { ticker: 'AAPL',    name: 'Apple Inc.',           market: 'equity', price: 214.85, change: +1.97, changePct: +0.93 },
  { ticker: 'NVDA',    name: 'NVIDIA Corp.',          market: 'equity', price: 875.30, change: +26.6, changePct: +3.14 },
  { ticker: 'TSLA',    name: 'Tesla Inc.',            market: 'equity', price: 188.42, change: -2.34, changePct: -1.23 },
  { ticker: 'MSFT',    name: 'Microsoft Corp.',       market: 'equity', price: 421.55, change: +3.10, changePct: +0.74 },
  { ticker: 'AMZN',    name: 'Amazon.com Inc.',       market: 'equity', price: 198.33, change: +0.88, changePct: +0.45 },
  { ticker: 'GOOGL',   name: 'Alphabet Inc.',         market: 'equity', price: 178.22, change: -0.51, changePct: -0.29 },
  { ticker: 'META',    name: 'Meta Platforms Inc.',   market: 'equity', price: 512.40, change: +7.22, changePct: +1.43 },
  { ticker: 'EUR/USD', name: 'Euro / US Dollar',      market: 'forex',  price: 1.0842, change: +0.0008, changePct: +0.08 },
  { ticker: 'GBP/USD', name: 'British Pound / USD',  market: 'forex',  price: 1.2731, change: -0.0031, changePct: -0.24 },
  { ticker: 'USD/JPY', name: 'US Dollar / Yen',       market: 'forex',  price: 157.43, change: +0.22,   changePct: +0.14 },
  { ticker: 'USD/CHF', name: 'US Dollar / Swiss Fr.', market: 'forex', price: 0.8981, change: -0.0011, changePct: -0.12 },
];

// ── Algorithms ─────────────────────────────────────────────────────────────
export const ALGORITHMS: Algorithm[] = [
  { id: 'golden_cross',   name: 'Golden Crossover',        shortName: 'GC',   category: 'trend',         description: 'MA50 crosses above MA200. Classic long-term trend signal.',            winRate: 61, avgReturn: 2.8,  maxDrawdown: 8.2,  sharpe: 1.82, signals: ['trend'] },
  { id: 'death_cross',    name: 'Death Cross Short',       shortName: 'DC',   category: 'trend',         description: 'MA50 crosses below MA200. Bearish trend confirmation.',                winRate: 58, avgReturn: 2.1,  maxDrawdown: 9.4,  sharpe: 1.61, signals: ['trend'] },
  { id: 'rsi_reversal',   name: 'RSI Mean Reversion',      shortName: 'RSI',  category: 'mean_reversion',description: 'Buy oversold (<30), sell overbought (>70) RSI zones.',               winRate: 67, avgReturn: 1.6,  maxDrawdown: 5.1,  sharpe: 2.14, signals: ['reversal'] },
  { id: 'macd_signal',    name: 'MACD Signal Cross',       shortName: 'MACD', category: 'momentum',      description: 'MACD line crosses signal line with histogram confirmation.',          winRate: 63, avgReturn: 2.2,  maxDrawdown: 6.8,  sharpe: 1.95, signals: ['momentum', 'trend'] },
  { id: 'bb_squeeze',     name: 'Bollinger Band Squeeze',  shortName: 'BB',   category: 'volatility',    description: 'Trade breakouts after low-volatility squeeze periods.',               winRate: 59, avgReturn: 3.4,  maxDrawdown: 10.2, sharpe: 1.74, signals: ['volatility'] },
  { id: 'vwap_bounce',    name: 'VWAP Bounce',             shortName: 'VWAP', category: 'mean_reversion',description: 'Price reverts to VWAP after deviation. Intraday focus.',             winRate: 64, avgReturn: 1.2,  maxDrawdown: 3.8,  sharpe: 2.31, signals: ['reversal', 'volume'] },
  { id: 'momentum_burst', name: 'Momentum Burst',          shortName: 'MOM',  category: 'momentum',      description: 'Enter on strong volume + price surge above 20-day high.',           winRate: 55, avgReturn: 4.1,  maxDrawdown: 12.5, sharpe: 1.58, signals: ['momentum', 'volume'] },
  { id: 'ema_ribbon',     name: 'EMA Ribbon Trend',        shortName: 'EMA',  category: 'trend',         description: 'Multiple EMA alignment (8,13,21,34,55) for trend direction.',        winRate: 60, avgReturn: 2.6,  maxDrawdown: 7.9,  sharpe: 1.88, signals: ['trend'] },
  { id: 'stoch_cross',    name: 'Stochastic Crossover',    shortName: 'STO',  category: 'mean_reversion',description: '%K crosses %D in oversold/overbought zones.',                       winRate: 62, avgReturn: 1.8,  maxDrawdown: 5.5,  sharpe: 2.02, signals: ['reversal'] },
  { id: 'ichimoku',       name: 'Ichimoku Cloud',          shortName: 'ICH',  category: 'trend',         description: 'Price vs cloud, TK cross, and chikou confirmation.',                 winRate: 65, avgReturn: 3.0,  maxDrawdown: 9.1,  sharpe: 1.97, signals: ['trend', 'momentum'] },
  { id: 'pivot_points',   name: 'Pivot Point Reversal',    shortName: 'PIV',  category: 'mean_reversion',description: 'R1/S1 pivot bounces with volume confirmation.',                     winRate: 63, avgReturn: 1.4,  maxDrawdown: 4.2,  sharpe: 2.08, signals: ['reversal'] },
  { id: 'adx_trend',      name: 'ADX Trend Filter',        shortName: 'ADX',  category: 'trend',         description: 'Enter trend only when ADX > 25 for high conviction trades.',        winRate: 66, avgReturn: 2.9,  maxDrawdown: 7.4,  sharpe: 2.18, signals: ['trend'] },
  { id: 'parabolic_sar',  name: 'Parabolic SAR Trail',     shortName: 'SAR',  category: 'trend',         description: 'Dynamic trailing stop with SAR flip entries.',                      winRate: 57, avgReturn: 2.3,  maxDrawdown: 8.8,  sharpe: 1.70, signals: ['trend'] },
  { id: 'obv_divergence', name: 'OBV Volume Divergence',   shortName: 'OBV',  category: 'volatility',    description: 'Price/volume divergence signals with OBV confirmation.',            winRate: 61, avgReturn: 2.0,  maxDrawdown: 6.1,  sharpe: 1.85, signals: ['volume', 'reversal'] },
  { id: 'atr_breakout',   name: 'ATR Channel Breakout',    shortName: 'ATR',  category: 'volatility',    description: 'Breakout beyond ATR-based dynamic channels with volume.',           winRate: 58, avgReturn: 3.6,  maxDrawdown: 11.0, sharpe: 1.66, signals: ['volatility', 'momentum'] },
  { id: 'cci_reversal',   name: 'CCI Extreme Reversal',    shortName: 'CCI',  category: 'mean_reversion',description: 'Commodity Channel Index ±200 extreme reversal trades.',             winRate: 60, avgReturn: 1.9,  maxDrawdown: 5.8,  sharpe: 1.91, signals: ['reversal'] },
  { id: 'donchian',       name: 'Donchian Turtle System',  shortName: 'DON',  category: 'momentum',      description: '20/55-day breakout system from the classic Turtle Traders.',       winRate: 53, avgReturn: 4.8,  maxDrawdown: 15.2, sharpe: 1.52, signals: ['momentum', 'trend'] },
  { id: 'zscore_mean',    name: 'Z-Score Reversion',       shortName: 'ZSC',  category: 'mean_reversion',description: 'Statistical mean reversion using 2σ z-score bands.',               winRate: 68, avgReturn: 1.3,  maxDrawdown: 3.5,  sharpe: 2.44, signals: ['reversal'] },
  { id: 'keltner_break',  name: 'Keltner Channel Break',   shortName: 'KEL',  category: 'volatility',    description: 'Momentum entries on Keltner upper/lower channel breaks.',           winRate: 59, avgReturn: 2.7,  maxDrawdown: 8.5,  sharpe: 1.78, signals: ['volatility', 'momentum'] },
  { id: 'ai_ensemble',    name: 'AI Ensemble Model',       shortName: 'AI',   category: 'ml',            description: 'ML ensemble combining 5 indicators with regime-aware weighting.',  winRate: 71, avgReturn: 3.2,  maxDrawdown: 6.0,  sharpe: 2.61, signals: ['trend', 'momentum', 'reversal'] },
];

// ── Candle generator ───────────────────────────────────────────────────────
export function generateCandles(basePrice: number, count: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const vol   = 0.008;
    const drift = 0.0001;
    const chg   = price * (drift + vol * (Math.random() - 0.5));
    const open  = price;
    const close = price + chg;
    const high  = Math.max(open, close) + Math.abs(chg) * Math.random() * 0.5;
    const low   = Math.min(open, close) - Math.abs(chg) * Math.random() * 0.5;
    candles.push({ time: now - i * 60000, open, close, high, low, volume: Math.floor(Math.random() * 900000 + 100000) });
    price = close;
  }
  return candles;
}

// ── Mock orders ────────────────────────────────────────────────────────────
export const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', symbol: 'AAPL',    side: 'BUY',  type: 'MARKET', qty: 50,  price: 213.10, filled: 50,  status: 'FILLED',    time: '09:31:04', pnl: +88.5  },
  { id: 'ORD-002', symbol: 'NVDA',    side: 'BUY',  type: 'LIMIT',  qty: 10,  price: 868.00, filled: 10,  status: 'FILLED',    time: '09:45:22', pnl: +73.0  },
  { id: 'ORD-003', symbol: 'TSLA',    side: 'SELL', type: 'MARKET', qty: 30,  price: 190.80, filled: 30,  status: 'FILLED',    time: '10:02:11', pnl: -71.4  },
  { id: 'ORD-004', symbol: 'EUR/USD', side: 'BUY',  type: 'LIMIT',  qty: 10000, price: 1.0831, filled: 0, status: 'PENDING',  time: '10:18:33', pnl: undefined },
  { id: 'ORD-005', symbol: 'MSFT',    side: 'BUY',  type: 'STOP',   qty: 25,  price: 418.50, filled: 25,  status: 'FILLED',    time: '10:33:55', pnl: +76.5  },
];

// ── Mock positions ─────────────────────────────────────────────────────────
export const MOCK_POSITIONS: Position[] = [
  { symbol: 'AAPL', side: 'BUY', qty: 50,    avgEntry: 213.10, currentPrice: 214.85, pnl: +87.5,   pnlPct: +0.82, algo: 'Golden Crossover' },
  { symbol: 'NVDA', side: 'BUY', qty: 10,    avgEntry: 868.00, currentPrice: 875.30, pnl: +73.0,   pnlPct: +0.84, algo: 'MACD Signal Cross' },
  { symbol: 'MSFT', side: 'BUY', qty: 25,    avgEntry: 418.50, currentPrice: 421.55, pnl: +76.25,  pnlPct: +0.73, algo: 'EMA Ribbon Trend' },
];

// ── Signal log seed ────────────────────────────────────────────────────────
export const SEED_SIGNALS: SignalLog[] = [
  { id: 's1', time: '10:44:01', algo: 'AI',          symbol: 'AAPL',    type: 'AI',      message: 'AI ranked RSI Mean Reversion #1 for AAPL. Score: 87/100' },
  { id: 's2', time: '10:43:55', algo: 'MACD',        symbol: 'NVDA',    type: 'BUY',     message: 'MACD bullish crossover confirmed. Entry: 875.30' },
  { id: 's3', time: '10:43:20', algo: 'RSI',         symbol: 'GBP/USD', type: 'INFO',    message: 'RSI approaching oversold zone (34.2). Monitoring...' },
  { id: 's4', time: '10:42:08', algo: 'Backtest',    symbol: 'AAPL',    type: 'BACKTEST',message: 'Golden Crossover | AAPL | 2yr | Return: +142% | Sharpe: 2.41' },
  { id: 's5', time: '10:41:33', algo: 'EMA',         symbol: 'MSFT',    type: 'BUY',     message: 'EMA ribbon bullish alignment. 8>13>21>34>55 confirmed' },
  { id: 's6', time: '10:40:18', algo: 'AI',          symbol: 'TSLA',    type: 'WARN',    message: 'Low regime confidence for TSLA. Skipping signal.' },
  { id: 's7', time: '10:39:55', algo: 'VWAP',        symbol: 'AAPL',    type: 'INFO',    message: 'Price deviation from VWAP: +0.8%. Within threshold.' },
  { id: 's8', time: '10:38:40', algo: 'System',      symbol: '—',       type: 'INFO',    message: 'Bot started. Watching 3 symbols across 2 strategies.' },
];
