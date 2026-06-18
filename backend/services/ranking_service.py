"""
ranking_service.py
------------------
AI ranking engine: backtests all 20 algorithms on the given symbol,
scores them using a composite metric, and returns a ranked list
matching the shape the frontend AlgorithmPanel expects.
"""

import pandas as pd
import numpy as np
from backtester import Backtester
from services.indicator_service import STRATEGY_MAP, run_strategy
from services.yfinance_service import get_market_data

# Frontend algo metadata (name, shortName, category, description, signals)
ALGO_META = {
    "golden_cross":   {"name": "Golden Crossover",       "shortName": "GC",   "category": "trend",          "description": "MA50 crosses above MA200. Classic long-term trend signal.",           "signals": ["trend"]},
    "death_cross":    {"name": "Death Cross Short",      "shortName": "DC",   "category": "trend",          "description": "MA50 crosses below MA200. Bearish trend confirmation.",               "signals": ["trend"]},
    "rsi_reversal":   {"name": "RSI Mean Reversion",     "shortName": "RSI",  "category": "mean_reversion", "description": "Buy oversold (<30), sell overbought (>70) RSI zones.",              "signals": ["reversal"]},
    "macd_signal":    {"name": "MACD Signal Cross",      "shortName": "MACD", "category": "momentum",       "description": "MACD line crosses signal line with histogram confirmation.",         "signals": ["momentum", "trend"]},
    "bb_squeeze":     {"name": "Bollinger Band Squeeze", "shortName": "BB",   "category": "volatility",     "description": "Trade breakouts after low-volatility squeeze periods.",              "signals": ["volatility"]},
    "vwap_bounce":    {"name": "VWAP Bounce",            "shortName": "VWAP", "category": "mean_reversion", "description": "Price reverts to VWAP after deviation. Intraday focus.",            "signals": ["reversal", "volume"]},
    "momentum_burst": {"name": "Momentum Burst",         "shortName": "MOM",  "category": "momentum",       "description": "Enter on strong volume + price surge above 20-day high.",          "signals": ["momentum", "volume"]},
    "ema_ribbon":     {"name": "EMA Ribbon Trend",       "shortName": "EMA",  "category": "trend",          "description": "Multiple EMA alignment (8,13,21,34,55) for trend direction.",       "signals": ["trend"]},
    "stoch_cross":    {"name": "Stochastic Crossover",   "shortName": "STO",  "category": "mean_reversion", "description": "%K crosses %D in oversold/overbought zones.",                      "signals": ["reversal"]},
    "ichimoku":       {"name": "Ichimoku Cloud",         "shortName": "ICH",  "category": "trend",          "description": "Price vs cloud, TK cross, and chikou confirmation.",                "signals": ["trend", "momentum"]},
    "pivot_points":   {"name": "Pivot Point Reversal",   "shortName": "PIV",  "category": "mean_reversion", "description": "R1/S1 pivot bounces with volume confirmation.",                    "signals": ["reversal"]},
    "adx_trend":      {"name": "ADX Trend Filter",       "shortName": "ADX",  "category": "trend",          "description": "Enter trend only when ADX > 25 for high conviction trades.",       "signals": ["trend"]},
    "parabolic_sar":  {"name": "Parabolic SAR Trail",    "shortName": "SAR",  "category": "trend",          "description": "Dynamic trailing stop with SAR flip entries.",                     "signals": ["trend"]},
    "obv_divergence": {"name": "OBV Volume Divergence",  "shortName": "OBV",  "category": "volatility",     "description": "Price/volume divergence signals with OBV confirmation.",           "signals": ["volume", "reversal"]},
    "atr_breakout":   {"name": "ATR Channel Breakout",   "shortName": "ATR",  "category": "volatility",     "description": "Breakout beyond ATR-based dynamic channels with volume.",          "signals": ["volatility", "momentum"]},
    "cci_reversal":   {"name": "CCI Extreme Reversal",   "shortName": "CCI",  "category": "mean_reversion", "description": "Commodity Channel Index ±200 extreme reversal trades.",            "signals": ["reversal"]},
    "donchian":       {"name": "Donchian Turtle System", "shortName": "DON",  "category": "momentum",       "description": "20/55-day breakout system from the classic Turtle Traders.",      "signals": ["momentum", "trend"]},
    "zscore_mean":    {"name": "Z-Score Reversion",      "shortName": "ZSC",  "category": "mean_reversion", "description": "Statistical mean reversion using 2σ z-score bands.",              "signals": ["reversal"]},
    "keltner_break":  {"name": "Keltner Channel Break",  "shortName": "KEL",  "category": "volatility",     "description": "Momentum entries on Keltner upper/lower channel breaks.",          "signals": ["volatility", "momentum"]},
    "ai_ensemble":    {"name": "AI Ensemble Model",      "shortName": "AI",   "category": "ml",             "description": "ML ensemble combining 5 indicators with regime-aware weighting.", "signals": ["trend", "momentum", "reversal"]},
}


def _compute_sharpe(equity_curve: list, risk_free=0.0) -> float:
    """Annualised Sharpe from a list of portfolio values."""
    if len(equity_curve) < 2:
        return 0.0
    vals    = pd.Series(equity_curve)
    returns = vals.pct_change().dropna()
    if returns.std() == 0:
        return 0.0
    return round(float((returns.mean() - risk_free / 252) / returns.std() * np.sqrt(252)), 2)


def _compute_score(total_return: float, sharpe: float, max_drawdown: float,
                   win_ratio: float, num_trades: int) -> int:
    """
    Composite AI score 0–100.
    Weights: return 30%, sharpe 30%, drawdown 20%, win_rate 15%, trade_count 5%
    """
    ret_score  = min(max(total_return / 2, 0), 30)          # cap at +60% → 30pts
    sharpe_score  = min(max(sharpe / 3 * 30, 0), 30)        # sharpe 3.0 → 30pts
    dd_score   = min(max((1 - abs(max_drawdown) / 20) * 20, 0), 20)  # 0% dd → 20pts
    wr_score   = min(max(win_ratio / 100 * 15, 0), 15)      # 100% wr → 15pts
    trd_score  = min(max(num_trades / 50 * 5, 0), 5)        # 50+ trades → 5pts
    return int(round(ret_score + sharpe_score + dd_score + wr_score + trd_score))


def rank_algorithms(symbol: str, period: str = "2y", interval: str = "1d",
                    initial_balance: float = 10000.0) -> list:
    """
    Run all 20 strategies on `symbol`, backtest each, score, and return
    a ranked list ready for the frontend AlgorithmPanel.
    """
    # Fetch data once
    df_raw = get_market_data(symbol, period=period, interval=interval)
    if df_raw.empty:
        return []

    results = []

    for algo_id, meta in ALGO_META.items():
        try:
            df = df_raw.copy()
            df = run_strategy(algo_id, df)

            bt              = Backtester(df, initial_balance=initial_balance)
            final_val, trades, win_ratio, max_dd = bt.run()

            total_return    = round((final_val - initial_balance) / initial_balance * 100, 2)
            num_trades      = len(trades)

            # Build simple equity curve for Sharpe
            equity          = []
            bal             = initial_balance
            pos             = 0.0
            for i, row in df.iterrows():
                try:
                    sig   = int(row["signal"]) if not pd.isna(row.get("signal", 0)) else 0
                    price = float(row["close"])
                    if sig == 1 and pos == 0:
                        pos = bal / price; bal = 0
                    elif sig == -1 and pos > 0:
                        bal = pos * price;  pos = 0
                    equity.append(bal + pos * price)
                except Exception:
                    continue

            sharpe = _compute_sharpe(equity)
            score  = _compute_score(total_return, sharpe, max_dd, win_ratio, num_trades)

            results.append({
                "id":          algo_id,
                "name":        meta["name"],
                "shortName":   meta["shortName"],
                "category":    meta["category"],
                "description": meta["description"],
                "signals":     meta["signals"],
                # backtest metrics
                "winRate":     round(win_ratio, 1),
                "avgReturn":   round(total_return / max(num_trades, 1), 2),
                "maxDrawdown": round(abs(max_dd), 2),
                "sharpe":      sharpe,
                "totalReturn": total_return,
                "numTrades":   num_trades,
                "score":       score,
            })

        except Exception as e:
            print(f"[ranking] {algo_id} failed: {e}")
            # Still include with zeroed metrics so frontend doesn't lose the row
            meta_entry = ALGO_META.get(algo_id, {})
            results.append({
                "id":          algo_id,
                "name":        meta_entry.get("name", algo_id),
                "shortName":   meta_entry.get("shortName", "?"),
                "category":    meta_entry.get("category", "trend"),
                "description": meta_entry.get("description", ""),
                "signals":     meta_entry.get("signals", []),
                "winRate":     0, "avgReturn": 0, "maxDrawdown": 0,
                "sharpe":      0, "totalReturn": 0, "numTrades": 0, "score": 0,
            })

    # Sort by score descending, add rank
    results.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results