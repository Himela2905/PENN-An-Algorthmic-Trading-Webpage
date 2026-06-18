import yfinance as yf
import pandas as pd
from datetime import datetime

# Map frontend timeframe strings to yfinance interval + period
TF_MAP = {
    "1m":  {"interval": "1m",  "period": "1d"},
    "5m":  {"interval": "5m",  "period": "5d"},
    "15m": {"interval": "15m", "period": "5d"},
    "1h":  {"interval": "1h",  "period": "1mo"},
    "4h":  {"interval": "1h",  "period": "3mo"},   # yf has no 4h, use 1h
    "1D":  {"interval": "1d",  "period": "1y"},
}

def get_market_data(symbol: str, period="5d", interval="1d") -> pd.DataFrame:
    """Raw yfinance fetch — returns DataFrame with standard columns."""
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)
    if df.empty:
        return df
    df = df.rename(columns={
        "Open": "open", "High": "high",
        "Low": "low",   "Close": "close",
        "Volume": "volume"
    })
    df = df[["open", "high", "low", "close", "volume"]]
    df = df.dropna()
    return df


def get_candles(symbol: str, tf: str = "15m") -> list:
    """
    Returns OHLCV candles as a list of dicts for the frontend chart.
    Each candle: { time, open, high, low, close, volume }
    """
    params = TF_MAP.get(tf, TF_MAP["15m"])
    df = get_market_data(symbol, period=params["period"], interval=params["interval"])

    if df.empty:
        return []

    candles = []
    for ts, row in df.iterrows():
        # Convert index to Unix ms timestamp
        if hasattr(ts, "timestamp"):
            t = int(ts.timestamp() * 1000)
        else:
            t = int(pd.Timestamp(ts).timestamp() * 1000)

        candles.append({
            "time":   t,
            "open":   round(float(row["open"]),  4),
            "high":   round(float(row["high"]),  4),
            "low":    round(float(row["low"]),   4),
            "close":  round(float(row["close"]), 4),
            "volume": int(row["volume"]),
        })

    return candles


def get_quote(symbol: str) -> dict:
    """
    Returns latest price, change, changePct for a symbol.
    """
    try:
        ticker = yf.Ticker(symbol)
        info   = ticker.fast_info

        price     = float(info.last_price)          if hasattr(info, "last_price")          else None
        prev      = float(info.previous_close)      if hasattr(info, "previous_close")      else None
        day_high  = float(info.day_high)            if hasattr(info, "day_high")            else None
        day_low   = float(info.day_low)             if hasattr(info, "day_low")             else None

        if price is None:
            # fallback: last candle from history
            df = get_market_data(symbol, period="2d", interval="1d")
            if df.empty:
                return {}
            price = float(df.iloc[-1]["close"])
            prev  = float(df.iloc[-2]["close"]) if len(df) >= 2 else price

        change     = round(price - prev, 4)         if prev else 0.0
        change_pct = round((change / prev) * 100, 2) if prev else 0.0

        return {
            "symbol":     symbol.upper(),
            "price":      round(price, 4),
            "change":     change,
            "changePct":  change_pct,
            "dayHigh":    round(day_high, 4) if day_high else None,
            "dayLow":     round(day_low,  4) if day_low  else None,
        }

    except Exception as e:
        print(f"[yfinance] Quote error for {symbol}: {e}")
        return {}


def get_multi_quote(symbols: list) -> list:
    """Batch quote fetch for the watchlist."""
    results = []
    for sym in symbols:
        q = get_quote(sym)
        if q:
            results.append(q)
    return results