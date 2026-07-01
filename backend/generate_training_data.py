"""
generate_training_data.py
--------------------------
Run this ONCE to build the ML training dataset.

What it does:
  1. Loops through a list of stocks (Indian + US, for variety)
  2. For each stock, fetches 2 years of historical data
  3. Extracts features (volatility, trend, RSI, etc.) via recommender.calculate_features()
  4. Runs ALL strategies via recommender.get_recommendation() to find the best one
  5. Saves one row per stock: features -> best_strategy

Output: ml/training_data.csv
This file is later used by train_model.py to train the ML model.

Run with:
    python generate_training_data.py

Takes roughly 5-15 minutes depending on stock count and internet speed.
Safe to re-run — it overwrites the CSV each time with fresh data.
"""

import os
import time
import pandas as pd

from data_fetcher import fetch_from_yf
from recommender import calculate_features, get_recommendation


# ============================================================
# Stock universe — mix of Indian (NSE) and US stocks for variety
# Variety matters: the model needs to see different volatility/trend
# combinations to learn meaningful patterns, not just one market's behaviour.
# ============================================================
STOCKS = [
    # ---- Indian — Banking & Finance ----
    "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "AXISBANK.NS", "KOTAKBANK.NS",
    "BAJFINANCE.NS", "BAJAJFINSV.NS", "INDUSINDBK.NS", "PNB.NS", "BANKBARODA.NS",

    # ---- Indian — IT / Tech ----
    "TCS.NS", "INFY.NS", "WIPRO.NS", "HCLTECH.NS", "TECHM.NS", "LTIM.NS",

    # ---- Indian — Energy / Auto / Industrials ----
    "RELIANCE.NS", "ONGC.NS", "NTPC.NS", "POWERGRID.NS",
    "TATAMOTORS.NS", "MARUTI.NS", "M&M.NS", "BAJAJ-AUTO.NS",
    "LT.NS", "ULTRACEMCO.NS", "ADANIPORTS.NS",

    # ---- Indian — Consumer / Pharma / Misc ----
    "ITC.NS", "HINDUNILVR.NS", "NESTLEIND.NS", "TITAN.NS", "ASIANPAINT.NS",
    "SUNPHARMA.NS", "DRREDDY.NS", "CIPLA.NS", "DIVISLAB.NS",
    "TATASTEEL.NS", "JSWSTEEL.NS", "COALINDIA.NS", "GRASIM.NS",

    # ---- US — Tech / Growth ----
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "NFLX",
    "AMD", "INTC", "CRM", "ADBE", "ORCL",

    # ---- US — Finance / Industrial / Consumer ----
    "JPM", "BAC", "GS", "V", "MA",
    "DIS", "KO", "PEP", "WMT", "MCD",
    "XOM", "CVX", "BA", "CAT",
]

OUTPUT_DIR  = "ml"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "training_data.csv")


# ============================================================
# Time windows — same stock, different historical slices.
# Each window genuinely has different volatility/trend/RSI values
# because markets change over time, so this is legitimate extra
# training data, not duplicated/fake data.
# ============================================================
WINDOWS = [
    {"label": "full_2y",    "days": None},   # full fetched data
    {"label": "recent_1y",  "days": 252},     # ~252 trading days = 1y
    {"label": "recent_6mo", "days": 126},     # ~126 trading days = 6mo
]


def generate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    rows = []
    skipped = []
    total_attempts = len(STOCKS) * len(WINDOWS)
    attempt = 0

    print(f"Starting training data generation for {len(STOCKS)} stocks "
          f"x {len(WINDOWS)} time windows = up to {total_attempts} samples...\n")

    for symbol in STOCKS:
        # fetch the longest window once, then slice it locally for shorter
        # windows — avoids hitting yfinance 3x per stock
        try:
            full_df = fetch_from_yf(symbol, period="2y", interval="1d")
        except Exception as e:
            print(f"{symbol}: fetch failed ({e}), skipping all windows")
            skipped.append(symbol)
            attempt += len(WINDOWS)
            continue

        if full_df.empty or len(full_df) < 60:
            print(f"{symbol}: not enough data, skipping all windows")
            skipped.append(symbol)
            attempt += len(WINDOWS)
            continue

        if isinstance(full_df.columns, pd.MultiIndex):
            full_df.columns = full_df.columns.get_level_values(0)
        full_df.columns = full_df.columns.str.lower()

        for window in WINDOWS:
            attempt += 1
            label = window["label"]
            days  = window["days"]
            print(f"[{attempt}/{total_attempts}] {symbol} ({label})...", end=" ")

            try:
                df_slice = full_df.copy() if days is None else full_df.tail(days).copy()

                if len(df_slice) < 60:
                    print("skipped (window too short)")
                    continue

                # ---- Extract features (the X values for ML) ----
                features = calculate_features(df_slice)

                # ---- Run full recommendation (gives us the Y label) ----
                result = get_recommendation(df_slice, initial_balance=10000)

                if "error" in result:
                    print(f"skipped ({result['error']})")
                    continue

                row = {
                    "symbol":         f"{symbol}_{label}",
                    "base_symbol":    symbol,
                    "window":         label,
                    **features,
                    "best_strategy":  result["recommended_strategy"],
                    "best_score":     result["score"],
                    "best_risk":      result["risk"],
                }
                rows.append(row)

                print(f"done -> best: {result['recommended_strategy']} "
                      f"(score {result['score']})")

            except Exception as e:
                print(f"FAILED: {e}")
                continue

        # one pause per stock (not per window), since we only fetch once per stock
        time.sleep(1.5)

    if not rows:
        print("\nNo data collected. Nothing saved.")
        return

    training_df = pd.DataFrame(rows)
    training_df.to_csv(OUTPUT_FILE, index=False)

    print(f"\nDone. Saved {len(rows)} rows to {OUTPUT_FILE}")
    print(f"(from {len(STOCKS)} stocks x up to {len(WINDOWS)} windows each)")
    if skipped:
        print(f"Fully skipped {len(skipped)} stocks: {skipped}")

    print("\n--- Label distribution (which strategy won most often) ---")
    print(training_df["best_strategy"].value_counts())

    print("\n--- Rows per window ---")
    print(training_df["window"].value_counts())


if __name__ == "__main__":
    generate()