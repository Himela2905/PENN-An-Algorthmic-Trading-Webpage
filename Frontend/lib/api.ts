/**
 * api.ts
 * ------
 * Central API client for the QuantEdge backend.
 * All fetch calls go through here — token is read from localStorage.
 *
 * Place this at: src/lib/api.ts
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:5001";

// ── Auth token ─────────────────────────────────────────────────────────────
function getToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("access_token") ?? "";
}

// ── Base fetch ─────────────────────────────────────────────────────────────
async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
  return data as T;
}

// ── Market ─────────────────────────────────────────────────────────────────
export const Market = {
  quote: (symbol: string) =>
    api<{ symbol: string; price: number; change: number; changePct: number }>(
      `/market/quote/${symbol}`
    ),

  candles: (symbol: string, tf = "15m") =>
    api<{ symbol: string; tf: string; candles: Candle[] }>(
      `/market/candles/${symbol}?tf=${tf}`
    ),

  watchlist: (symbols: string[]) =>
    api<{ quotes: QuoteData[] }>("/market/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbols }),
    }),
};

// ── Orders ─────────────────────────────────────────────────────────────────
export const Orders = {
  list: () => api<{ orders: OrderData[] }>("/orders"),

  place: (payload: PlaceOrderPayload) =>
    api<{ orderId: string; message: string }>("/orders/place", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  modify: (orderId: string, qty?: number, limitPrice?: number) =>
    api(`/orders/${orderId}/modify`, {
      method: "PUT",
      body: JSON.stringify({ qty, limitPrice }),
    }),

  cancel: (orderId: string) =>
    api(`/orders/${orderId}`, { method: "DELETE" }),

  positions: () => api<{ positions: PositionData[] }>("/orders/positions"),
  holdings:  () => api<{ holdings: unknown[]      }>("/orders/holdings"),
  funds:     () => api<{ funds: Record<string, number> }>("/orders/funds"),
};

// ── Backtest ────────────────────────────────────────────────────────────────
export const Backtest = {
  run: (payload: {
    symbol: string;
    algoId: string;
    period?: string;
    interval?: string;
    initialBalance?: number;
  }) =>
    api<BacktestResult>("/backtest/run", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  aiRank: (payload: {
    symbol: string;
    period?: string;
    interval?: string;
    initialBalance?: number;
  }) =>
    api<{ symbol: string; algorithms: RankedAlgorithm[]; top: RankedAlgorithm }>(
      "/backtest/ai-rank",
      { method: "POST", body: JSON.stringify(payload) }
    ),
};

// ── Bot ────────────────────────────────────────────────────────────────────
export const Bot = {
  start: (payload: {
    symbol: string;
    algoId: string;
    algoName: string;
    qty: number;
    intervalSec?: number;
  }) =>
    api<{ ok: boolean; message: string }>("/algo/bot/start", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  pause:  () => api<{ ok: boolean; message: string }>("/algo/bot/pause",  { method: "POST" }),
  resume: () => api<{ ok: boolean; message: string }>("/algo/bot/resume", { method: "POST" }),
  stop:   () => api<{ ok: boolean; message: string }>("/algo/bot/stop",   { method: "POST" }),
  status: () => api<BotStatus>("/algo/bot/status"),
  signals:() => api<{ signals: SignalItem[] }>("/algo/signals"),
};

// ── Fyers Auth ─────────────────────────────────────────────────────────────
export const FyersAuth = {
  /** Redirect the browser to Fyers OAuth login */
  login: () => { window.location.href = `${BASE}/auth/fyers/login`; },
  logout: () => api("/auth/fyers/logout", { method: "POST" }),
  status: () =>
    api<{ authenticated: boolean; profile: FyersProfile | null }>(
      "/auth/fyers/status"
    ),
  /**
   * Local-dev fallback: Fyers dashboard rejects localhost redirect URLs,
   * so FYERS_REDIRECT_URI points to Fyers' own placeholder page instead.
   * After login, copy the `auth_code` value from that page's URL bar
   * and submit it here manually.
   */
  submitCode: (authCode: string) =>
    api<{ ok: boolean; message: string }>("/auth/fyers/submit-code", {
      method: "POST",
      body: JSON.stringify({ auth_code: authCode }),
    }),
};

// ── WebSocket helpers ──────────────────────────────────────────────────────
export function connectPriceWS(
  symbol: string,
  onMessage: (data: QuoteData) => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/price/${symbol}`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onclose = onClose ?? (() => {});
  return ws;
}

export function connectSignalWS(
  onMessage: (data: SignalItem) => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/signals`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onclose = onClose ?? (() => {});
  return ws;
}

// ── Types shared between api.ts and components ─────────────────────────────
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteData {
  symbol:    string;
  price:     number;
  change:    number;
  changePct: number;
  dayHigh?:  number;
  dayLow?:   number;
  time?:     string;
}

export interface PlaceOrderPayload {
  symbol:      string;
  side:        "BUY" | "SELL";
  qty:         number;
  orderType:   "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT";
  limitPrice?: number;
  stopPrice?:  number;
  productType?:string;
}

export interface OrderData {
  id:     string;
  symbol: string;
  side:   "BUY" | "SELL";
  type:   string;
  qty:    number;
  price:  number;
  filled: number;
  status: string;
  time:   string;
  pnl?:   number;
}

export interface PositionData {
  symbol:       string;
  side:         "BUY" | "SELL";
  qty:          number;
  avgEntry:     number;
  currentPrice: number;
  pnl:          number;
  pnlPct:       number;
  algo:         string;
}

export interface BacktestResult {
  algoId:         string;
  symbol:         string;
  initialBalance: number;
  finalValue:     number;
  totalReturn:    number;
  sharpe:         number;
  maxDrawdown:    number;
  winRate:        number;
  numTrades:      number;
  score:          number;
  trades:         { action: string; price: number; date: string }[];
  equityCurve:    { date: string; value: number }[];
}

export interface RankedAlgorithm {
  id:          string;
  name:        string;
  shortName:   string;
  category:    string;
  description: string;
  signals:     string[];
  winRate:     number;
  avgReturn:   number;
  maxDrawdown: number;
  sharpe:      number;
  totalReturn: number;
  numTrades:   number;
  score:       number;
  rank:        number;
}

export interface BotStatus {
  status:      string;
  symbol:      string | null;
  algo_id:     string | null;
  algo_name:   string | null;
  position:    number;
  entry_price: number;
  qty:         number;
  trades_today:number;
  pnl_today:   number;
  started_at:  string | null;
  last_signal: number | null;
}

export interface SignalItem {
  id:      string;
  time:    string;
  algo:    string;
  symbol:  string;
  type:    "BUY" | "SELL" | "INFO" | "WARN" | "BACKTEST" | "AI";
  message: string;
}

export interface FyersProfile {
  name:     string;
  email:    string;
  mobile:   string;
  pan:      string;
  clientId: string;
}




////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// store token in localStorage
export const saveToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
  }
};

export const isLoggedIn = (): boolean => {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("access_token");
  return !!token;
};
// ─── Auth ───────────────────────────────────────

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const signupUser = async (name: string, email: string, password: string) => {
  const res = await fetch(`${BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
};

// ─── Backtest ────────────────────────────────────

export const runBacktest = async (payload: {
  symbol: string;
  strategy: string;
  period: string;
  interval: string;
  initial_balance: number;
}) => {
  const token = getToken();
  const res = await fetch(`${BASE}/backtest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,   // JWT token sent here
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////