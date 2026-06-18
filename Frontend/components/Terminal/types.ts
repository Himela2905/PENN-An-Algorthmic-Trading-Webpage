export type Market = 'equity' | 'forex';
export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'PARTIAL';
export type BotStatus = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'BACKTESTING';
export type AlgoCategory = 'trend' | 'mean_reversion' | 'momentum' | 'volatility' | 'ml';

export interface Candle {
  time: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface Symbol {
  ticker: string;
  name: string;
  market: Market;
  price: number;
  change: number;
  changePct: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  qty: number;
  price: number;
  filled: number;
  status: OrderStatus;
  time: string;
  pnl?: number;
}

export interface Position {
  symbol: string;
  side: OrderSide;
  qty: number;
  avgEntry: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  algo: string;
}

export interface Algorithm {
  id: string;
  name: string;
  shortName: string;
  category: AlgoCategory;
  description: string;
  winRate: number;
  avgReturn: number;
  maxDrawdown: number;
  sharpe: number;
  score?: number;      // AI-assigned score 0–100
  rank?: number;
  signals: ('trend' | 'volume' | 'momentum' | 'reversal'| 'volatility')[];
}

export interface SignalLog {
  id: string;
  time: string;
  algo: string;
  symbol: string;
  type: 'BUY' | 'SELL' | 'INFO' | 'WARN' | 'BACKTEST' | 'AI';
  message: string;
}

export interface BacktestResult {
  algoId: string;
  symbol: string;
  totalReturn: number;
  sharpe: number;
  maxDrawdown: number;
  winRate: number;
  trades: number;
  score: number;
}
