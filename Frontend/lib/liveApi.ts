const API = 'http://localhost:5000';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface QuoteData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
}

export interface OrderData {
  id: string;
  symbol: string;
  side: string;
  type: string;
  qty: number;
  price: number;
  filled: number;
  status: string;
  time: string;
  pnl?: number;
}

export interface PositionData {
  symbol: string;
  side: string;
  qty: number;
  avgEntry: number;
  currentPrice: number;
  pnl: number;
  pnlPct: number;
  algo: string;
}
function headers() {
  const token = localStorage.getItem('access_token');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export async function startLive(data: any) {
  const res = await fetch(`${API}/live/start`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  });

  return res.json();
}

export async function stopLive() {
  const res = await fetch(`${API}/live/stop`, {
    method: 'POST',
    headers: headers(),
  });

  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${API}/live/status`, {
    headers: headers(),
  });

  return res.json();
}

export async function getPositions() {
  const res = await fetch(`${API}/live/positions`, {
    headers: headers(),
  });

  return res.json();
}

export async function getTrades() {
  const res = await fetch(`${API}/live/trades`, {
    headers: headers(),
  });

  return res.json();
}

export async function getPnl() {
  const res = await fetch(`${API}/live/pnl`, {
    headers: headers(),
  });

  return res.json();
}

// store token in localStorage
export const saveToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("access_token", token);
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("access_token");
  }
  return null;
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
  const res = await fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const signupUser = async (name: string, email: string, password: string) => {
  const res = await fetch(`${API}/auth/signup`, {
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
  const res = await fetch(`${API}/backtest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,   // JWT token sent here
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};
// add to liveApi.ts

export const Market = {
  watchlist: async (symbols: string[]) => {
    try {
      const res = await fetch(`${API}/market/watchlist?symbols=${symbols.join(',')}`, { headers: headers() });
      if (!res.ok) throw new Error('failed');
      return res.json();
    } catch {
      return { quotes: [] };  // safe fallback, no crash
    }
  },
  candles: async (symbol: string, tf: string) => {
    try {
      const res = await fetch(`${API}/market/candles?symbol=${symbol}&tf=${tf}`, { headers: headers() });
      if (!res.ok) throw new Error('failed');
      return res.json();
    } catch {
      return { candles: [] };
    }
  },
};

export const Orders = {
  list: async () => {
    try {
      const res = await fetch(`${API}/orders/list`, { headers: headers() });
      if (!res.ok) throw new Error('failed');
      return res.json();
    } catch {
      return { orders: [] };
    }
  },
  positions: async () => {
    try {
      const res = await fetch(`${API}/orders/positions`, { headers: headers() });
      if (!res.ok) throw new Error('failed');
      return res.json();
    } catch {
      return { positions: [] };
    }
  },
  place: async (payload: any) => {
    const res = await fetch(`${API}/orders/place`, {
      method: 'POST', headers: headers(), body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Order failed');
    return res.json();
  },
};

export const Bot = {
  status: async () => {
    try {
      const res = await fetch(`${API}/live/status`, { headers: headers() });
      if (!res.ok) throw new Error('failed');
      return res.json();
    } catch {
      return { status: 'STOPPED', pnl_today: 0, trades_today: 0, algo_name: '' };
    }
  },
  start: async (payload: any) => {
    const res = await fetch(`${API}/live/start`, { method: 'POST', headers: headers(), body: JSON.stringify(payload) });
    if (!res.ok) throw new Error((await res.json()).error || 'Start failed');
    return res.json();
  },
  pause: async () => {
    const res = await fetch(`${API}/live/pause`, { method: 'POST', headers: headers() });
    if (!res.ok) throw new Error('Pause failed');
    return res.json();
  },
  resume: async () => {
    const res = await fetch(`${API}/live/resume`, { method: 'POST', headers: headers() });
    if (!res.ok) throw new Error('Resume failed');
    return res.json();
  },
  stop: async () => {
    const res = await fetch(`${API}/live/stop`, { method: 'POST', headers: headers() });
    if (!res.ok) throw new Error('Stop failed');
    return res.json();
  },
};

export const FyersAuth = {
  status: async () => {
    try {
      const res = await fetch(`${API}/auth/fyers/status`, { headers: headers() });
      if (!res.ok) throw new Error('failed');
      return res.json();
    } catch {
      return { authenticated: false, profile: null };
    }
  },
    login: () => {
    window.location.href = `${API}/auth/fyers/login`;
    },
    submitCode: async (authCode: string) => {
      const res = await fetch(`${API}/auth/fyers/submit-code`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ auth_code: authCode }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Fyers connection failed');
      return res.json();
    },
};


export const connectPriceWS = (symbol: string, onData: (data: any) => void) => {
  // stub — returns a fake "socket" with a no-op close(), so .close() calls don't crash
  return { close: () => {} };
};

export const connectSignalWS = (onSignal: (sig: any) => void) => {
  return { close: () => {} };
};

export const getRecommendation = async (payload: {
  symbol: string;
  initial_balance?: number;
  period?: string;
}) => {
  const res = await fetch(`${API}/recommend`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Recommendation failed');
  return res.json();
};

export const getRecommendationML = async (payload: {
  symbol: string;
  initial_balance?: number;
  period?: string;
}) => {
  const res = await fetch(`${API}/recommend-ml`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'ML recommendation failed');
  return res.json();
};

export const searchSymbols = async (query: string) => {
  if (!query || query.length < 2) return { results: [] };
  const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}`, {
    headers: headers(),
  });
  if (!res.ok) return { results: [] };
  return res.json();
};