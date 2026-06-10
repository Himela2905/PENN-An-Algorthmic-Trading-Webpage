const BASE_URL = "http://localhost:5000";

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
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const signupUser = async (name: string, email: string, password: string) => {
  const res = await fetch(`${BASE_URL}/auth/signup`, {
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
  const res = await fetch(`${BASE_URL}/backtest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,   // JWT token sent here
    },
    body: JSON.stringify(payload),
  });
  return res.json();
};