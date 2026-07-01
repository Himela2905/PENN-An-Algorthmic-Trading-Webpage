"""
recommender.py
---------------
Standalone recommendation engine — separate from backtest module.

Responsibilities:
  1. calculate_features()   → describes WHAT KIND of stock this is
                               (used both for human-readable reasoning
                                AND as ML training features later)
  2. evaluate_strategy()    → runs one strategy, scores it
  3. get_recommendation()   → runs ALL strategies, ranks them, explains why

Designed so generate_training_data.py can call calculate_features() and
get_recommendation() directly to build the ML training dataset.
"""

import pandas as pd
import numpy as np
from backtester import Backtester
from strategy import STRATEGY_REGISTRY


# ============================================================
# 1. FEATURE EXTRACTION — "what kind of stock is this"
# ============================================================
def calculate_features(df: pd.DataFrame) -> dict:
    """
    Extracts numeric characteristics of a stock's price history.
    These describe the stock's personality — used for:
      - human-readable reasoning ("this stock is highly volatile")
      - ML training features later (X values for the model)

    All values are plain Python floats (not numpy types) so they
    serialize cleanly to JSON and CSV without errors.
    """
    close = df["close"].dropna()

    if len(close) < 30:
        # not enough data to compute meaningful features
        return _empty_features()

    daily_returns = close.pct_change().dropna()

    # ---- Volatility ----
    # how much the stock jumps around day to day (annualized %)
    volatility = float(daily_returns.std() * np.sqrt(252) * 100)

    # ---- Trend strength ----
    # positive = uptrending, negative = downtrending
    # measured as slope of 50-day MA over the last 20 days, normalized by price
    if len(close) >= 50:
        ma50  = close.rolling(50).mean()
        slope = ma50.diff().tail(20).mean()
        trend_strength = float(slope / close.iloc[-1] * 100) if close.iloc[-1] != 0 else 0.0
    else:
        trend_strength = 0.0

    # ---- Average RSI ----
    # tells us if the stock has generally been overbought (>50) or oversold (<50)
    delta = close.diff()
    gain  = delta.where(delta > 0, 0).rolling(14).mean()
    loss  = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs    = gain / loss
    rsi   = 100 - (100 / (1 + rs))
    avg_rsi = float(rsi.mean()) if not rsi.dropna().empty else 50.0

    # ---- Volume trend ----
    # is trading activity increasing or decreasing lately (%)
    if "volume" in df.columns and df["volume"].notna().sum() >= 20:
        vol = df["volume"].dropna()
        recent_avg = vol.tail(20).mean()
        older_avg  = vol.tail(60).head(40).mean() if len(vol) >= 60 else vol.mean()
        vol_trend  = float(((recent_avg - older_avg) / older_avg) * 100) if older_avg else 0.0
    else:
        vol_trend = 0.0

    # ---- Average daily range ----
    # how wide the candle swings each day, as % of price — proxy for "choppiness"
    if "high" in df.columns and "low" in df.columns:
        daily_range = float(((df["high"] - df["low"]) / close).mean() * 100)
    else:
        daily_range = 0.0

    # ---- Momentum (rate of change over 20 days) ----
    momentum_20d = float((close.iloc[-1] / close.iloc[-20] - 1) * 100) if len(close) >= 20 else 0.0

    # ---- Sharpe-like consistency measure ----
    # mean daily return / std of daily return — higher = steadier gains
    if daily_returns.std() != 0:
        return_consistency = float(daily_returns.mean() / daily_returns.std())
    else:
        return_consistency = 0.0

    # ---- Max historical drawdown over the period (raw, not strategy specific) ----
    cum_returns  = (1 + daily_returns).cumprod()
    running_max  = cum_returns.cummax()
    drawdown_series = (cum_returns - running_max) / running_max
    historical_max_drawdown = float(drawdown_series.min() * 100)

    return {
        "volatility":              round(volatility, 4),
        "trend_strength":          round(trend_strength, 4),
        "avg_rsi":                 round(avg_rsi, 4),
        "vol_trend":               round(vol_trend, 4),
        "daily_range":             round(daily_range, 4),
        "momentum_20d":            round(momentum_20d, 4),
        "return_consistency":      round(return_consistency, 4),
        "historical_max_drawdown": round(historical_max_drawdown, 4),
    }


def _empty_features() -> dict:
    """Fallback when there isn't enough data to compute features safely."""
    return {
        "volatility": 0.0, "trend_strength": 0.0, "avg_rsi": 50.0,
        "vol_trend": 0.0, "daily_range": 0.0, "momentum_20d": 0.0,
        "return_consistency": 0.0, "historical_max_drawdown": 0.0,
    }


# ============================================================
# 2. SINGLE STRATEGY EVALUATION
# ============================================================
def evaluate_strategy(df: pd.DataFrame, strategy_name: str, initial_balance: float):
    """
    Runs ONE strategy on the given stock data and scores it.
    Returns None if the strategy crashes or produces invalid output
    (so one bad strategy never breaks the whole ranking).
    """
    try:
        df_copy  = df.copy()
        strategy = STRATEGY_REGISTRY[strategy_name](df_copy)
        df_copy  = strategy.generate_signals()

        backtester = Backtester(df_copy, initial_balance=initial_balance)
        final_value, trades, win_ratio, max_drawdown = backtester.run()

        profit_pct   = round(((final_value - initial_balance) / initial_balance) * 100, 2)
        total_trades = len(trades)

        # ---- Sharpe ratio (risk-adjusted return) ----
        # built from the equity curve so it reflects THIS strategy's
        # actual trade-by-trade volatility, not just the raw stock volatility
        equity_curve = _build_equity_curve(df_copy, initial_balance)
        sharpe = _calculate_sharpe(equity_curve)

        # ---- Composite score out of 100 ----
        score  = 0
        score += min(max(profit_pct, 0), 35)          # profit: up to 35 pts
        score += min(win_ratio * 0.30, 25)             # win ratio: up to 25 pts
        score += min(total_trades * 0.5, 10)           # activity: up to 10 pts
        score += min(max(sharpe, 0) * 10, 20)           # sharpe: up to 20 pts
        score += max(max_drawdown * 0.5, -20)           # drawdown penalty: up to -20 pts
        score  = max(0, min(100, round(score, 1)))

        # ---- Risk classification ----
        if abs(max_drawdown) < 5:
            risk = "Low"
        elif abs(max_drawdown) < 15:
            risk = "Medium"
        else:
            risk = "High"

        # ---- Suggested market condition ----
        best_for = _market_condition_for(strategy_name)

        return {
            "strategy":     strategy_name,
            "score":        score,
            "profit_pct":   profit_pct,
            "win_ratio":    win_ratio,
            "max_drawdown": max_drawdown,
            "sharpe":       round(sharpe, 2),
            "total_trades": total_trades,
            "final_value":  round(final_value, 2),
            "risk":         risk,
            "best_for":     best_for,
        }

    except Exception as e:
        print(f"[recommender] Skipping {strategy_name}: {e}")
        return None


def _build_equity_curve(df: pd.DataFrame, initial_balance: float) -> list:
    """Simulates balance over time so we can derive Sharpe ratio from it."""
    equity = []
    bal, pos = initial_balance, 0.0
    for _, row in df.iterrows():
        try:
            sig   = int(row["signal"]) if not pd.isna(row.get("signal", 0)) else 0
            price = float(row["close"])
            if sig == 1 and pos == 0:
                pos = bal / price
                bal = 0
            elif sig == -1 and pos > 0:
                bal = pos * price
                pos = 0
            equity.append(bal + pos * price)
        except Exception:
            continue
    return equity


def _calculate_sharpe(equity_curve: list) -> float:
    """Annualized Sharpe ratio from a simulated equity curve. 0 if not computable."""
    if len(equity_curve) < 2:
        return 0.0
    series = pd.Series(equity_curve)
    rets   = series.pct_change(fill_method=None).dropna()
    if rets.std() == 0 or rets.empty:
        return 0.0
    return float(rets.mean() / rets.std() * np.sqrt(252))


def _market_condition_for(strategy_name: str) -> str:
    """Tags each strategy with the market regime it intuitively suits.
    Purely descriptive — helps the user understand WHEN to trust the score."""
    if strategy_name in _TRENDING:
        return "Trend Following"
    if strategy_name in _REVERSION:
        return "Mean Reversion"
    if strategy_name in _BREAKOUT:
        return "Breakout/Momentum"
    return "All market conditions"


# ============================================================
# Strategy -> Category mapping
# ============================================================
# Used for two purposes:
#   1. _market_condition_for() above — human-readable "best_for" text
#   2. ML training label (CATEGORY_MAP) — groups 20 granular strategies
#      into broad families so the ML model has enough examples per
#      class to learn reliably. The precise strategy is still chosen
#      afterwards by the scoring engine WITHIN the predicted category.
#
# NOTE ON MOMENTUM MERGE:
#   "Momentum" started as its own category (ROC Strategy, VWAP Cross)
#   but had only 17 training examples out of 195 — the model achieved
#   0% recall on it (never correctly predicted it, too little data to
#   learn a distinct pattern). Momentum and Breakout strategies share
#   the same underlying trading logic (both react to sharp, fast price
#   moves rather than gradual trends or range-bound reversals), so we
#   merge them into one "Breakout/Momentum" category. This is a
#   data-driven decision, not an arbitrary one — documented here for
#   transparency in the project report.
# ============================================================
_TRENDING  = {"Golden Cross", "Death Cross", "EMA Cross", "Triple MA", "EMA Ribbon",
              "MACD Cross", "MACD Zero Line", "SuperTrend", "ADX Strategy"}
_REVERSION = {"RSI", "Bollinger Bands", "Stochastic", "ZScore Reversion",
              "VWAP Bounce", "Bollinger Squeeze"}
_BREAKOUT  = {"Price Breakout", "Donchian Breakout", "ATR Breakout",
              "Volume Spike Breakout", "Momentum Burst",
              "ROC Strategy", "VWAP Cross"}   # momentum strategies merged in here

CATEGORY_MAP = {}
for _s in _TRENDING:
    CATEGORY_MAP[_s] = "Trend Following"
for _s in _REVERSION:
    CATEGORY_MAP[_s] = "Mean Reversion"
for _s in _BREAKOUT:
    CATEGORY_MAP[_s] = "Breakout/Momentum"


def get_category(strategy_name: str) -> str:
    """Returns the broad category for a given strategy name.
    Falls back to 'Other' for any strategy not yet mapped."""
    return CATEGORY_MAP.get(strategy_name, "Other")


# ============================================================
# 5. ML PREDICTION LAYER
# ============================================================
# Loads the trained model ONCE when this module is first imported,
# not on every request — loading from disk is slow, predicting is fast.
# If the model file is missing (e.g. fresh clone, not yet trained),
# this fails gracefully and ML features simply report unavailable.
# ============================================================
_ML_MODEL          = None
_ML_FEATURE_ORDER  = None
_ML_TEST_ACCURACY  = None
_ML_LOAD_ERROR     = None

def _load_ml_model():
    global _ML_MODEL, _ML_FEATURE_ORDER, _ML_TEST_ACCURACY, _ML_LOAD_ERROR
    import os
    import joblib

    model_path = os.path.join("ml", "model_category.pkl")
    try:
        bundle             = joblib.load(model_path)
        _ML_MODEL           = bundle["model"]
        _ML_FEATURE_ORDER   = bundle["feature_columns"]
        _ML_TEST_ACCURACY   = bundle.get("test_accuracy")
    except Exception as e:
        _ML_LOAD_ERROR = str(e)
        print(f"[recommender] ML model not loaded: {e}")

_load_ml_model()  # runs once when this file is imported


def predict_category(features: dict) -> dict:
    """
    Uses the trained Random Forest model to predict which broad
    strategy category (Trend Following / Mean Reversion / Breakout-Momentum)
    best suits a stock, based on its 8 calculated features.

    Returns a dict with the predicted category, the model's confidence
    (probability), and a note about overall model reliability — so the
    frontend/report can be transparent about how much to trust this.

    If the model failed to load, returns an explicit "unavailable" result
    instead of crashing — the score-based system still works regardless.
    """
    if _ML_MODEL is None:
        return {
            "available": False,
            "reason":    _ML_LOAD_ERROR or "Model not trained yet",
        }

    import pandas as pd

    # build a single-row dataframe in the exact column order the model expects
    row = pd.DataFrame([[features.get(col, 0.0) for col in _ML_FEATURE_ORDER]],
                        columns=_ML_FEATURE_ORDER)

    predicted_category = _ML_MODEL.predict(row)[0]

    # probability for each class — tells us HOW confident the model is
    proba        = _ML_MODEL.predict_proba(row)[0]
    class_labels = _ML_MODEL.classes_
    confidence   = float(max(proba))

    probability_breakdown = {
        label: round(float(p) * 100, 1)
        for label, p in zip(class_labels, proba)
    }

    return {
        "available":             True,
        "predicted_category":    predicted_category,
        "confidence_pct":        round(confidence * 100, 1),
        "probability_breakdown": probability_breakdown,
        "model_test_accuracy":   _ML_TEST_ACCURACY,
    }


# ============================================================
# 3. HUMAN-READABLE REASONING
# ============================================================
def generate_reasoning(best: dict, all_results: list) -> list:
    reasoning = []

    if best["profit_pct"] > 0:
        reasoning.append(f"Generated {best['profit_pct']}% return on historical data")
    else:
        reasoning.append(f"Minimised losses at {best['profit_pct']}% — best available for this stock")

    if best["win_ratio"] > 60:
        reasoning.append(f"High win rate of {best['win_ratio']}%")
    elif best["win_ratio"] > 40:
        reasoning.append(f"Moderate win rate of {best['win_ratio']}%")

    if best.get("sharpe", 0) > 0.5:
        reasoning.append(f"Strong risk-adjusted return (Sharpe {best['sharpe']})")

    if abs(best["max_drawdown"]) < 10:
        reasoning.append(f"Low risk — max drawdown only {best['max_drawdown']}%")
    elif abs(best["max_drawdown"]) < 20:
        reasoning.append(f"Moderate drawdown of {best['max_drawdown']}% — manageable risk")

    if best["total_trades"] > 10:
        reasoning.append(f"Active strategy — {best['total_trades']} trade signals generated")
    elif best["total_trades"] > 0:
        reasoning.append(f"Conservative strategy — only {best['total_trades']} selective trades")
    else:
        reasoning.append("Caution — no trades were generated for this stock/period")

    reasoning.append(f"Best suited for: {best['best_for']}")

    if len(all_results) > 1:
        second = all_results[1]
        diff   = round(best["score"] - second["score"], 1)
        if diff > 10:
            reasoning.append(f"Outperforms {second['strategy']} by {diff} score points")

    return reasoning


# ============================================================
# 4. MAIN ENTRY POINT
# ============================================================
def get_recommendation(df: pd.DataFrame, initial_balance: float = 10000) -> dict:
    """
    Runs every strategy in STRATEGY_REGISTRY on the given stock data,
    ranks them, and returns the best one with full reasoning.

    Also returns `stock_features` — these are the exact values
    generate_training_data.py will collect to build the ML dataset.
    """
    features = calculate_features(df)

    results = []
    for strategy_name in STRATEGY_REGISTRY.keys():
        result = evaluate_strategy(df, strategy_name, initial_balance)
        if result:
            results.append(result)

    if not results:
        return {"error": "Could not evaluate any strategy for this stock"}

    results.sort(key=lambda x: x["score"], reverse=True)
    best      = results[0]
    reasoning = generate_reasoning(best, results)

    return {
        "recommended_strategy": best["strategy"],
        "score":                best["score"],
        "risk":                 best["risk"],
        "best_for":              best["best_for"],
        "reasoning":             reasoning,
        "stock_features":        features,     # <-- ML training will read this
        "all_strategies":        results,
    }


# ============================================================
# 5. ML-ASSISTED RECOMMENDATION (two-stage pipeline)
# ============================================================
def get_recommendation_ml(df: pd.DataFrame, initial_balance: float = 10000) -> dict:
    """
    Two-stage recommendation:
      Stage 1 (ML)    -> predict_category() guesses the broad strategy
                          family from the stock's features, instantly,
                          without running any backtests.
      Stage 2 (Score) -> only the strategies WITHIN that predicted
                          category are actually backtested and scored,
                          giving a precise, real-data-backed final answer.

    This is faster than get_recommendation() (which scores all 20
    strategies) because Stage 2 only scores ~6-9 strategies instead
    of 20. It also demonstrates the ML model in a genuinely useful
    role: narrowing the search space, not making the final call alone.

    If the ML model is unavailable for any reason, this transparently
    falls back to scoring ALL strategies (i.e. behaves like
    get_recommendation()) rather than failing.
    """
    features = calculate_features(df)
    ml_result = predict_category(features)

    if not ml_result.get("available"):
        # ML unavailable — fall back to full scan, but say so explicitly
        fallback = get_recommendation(df, initial_balance)
        fallback["ml_used"] = False
        fallback["ml_unavailable_reason"] = ml_result.get("reason")
        return fallback

    predicted_category = ml_result["predicted_category"]

    # only test strategies that belong to the predicted category
    candidate_strategies = [
        name for name in STRATEGY_REGISTRY.keys()
        if get_category(name) == predicted_category
    ]

    if not candidate_strategies:
        # safety net — should not happen, but never crash
        candidate_strategies = list(STRATEGY_REGISTRY.keys())

    results = []
    for strategy_name in candidate_strategies:
        result = evaluate_strategy(df, strategy_name, initial_balance)
        if result:
            results.append(result)

    if not results:
        return {"error": "Could not evaluate any strategy for this stock"}

    results.sort(key=lambda x: x["score"], reverse=True)
    best      = results[0]
    reasoning = generate_reasoning(best, results)

    reasoning.insert(0,
        f"ML model predicted '{predicted_category}' category with "
        f"{ml_result['confidence_pct']}% confidence "
        f"(model test accuracy: {ml_result['model_test_accuracy']}%)"
    )

    return {
        "recommended_strategy": best["strategy"],
        "score":                best["score"],
        "risk":                 best["risk"],
        "best_for":              best["best_for"],
        "reasoning":             reasoning,
        "stock_features":        features,
        "all_strategies":        results,          # only within predicted category
        "ml_used":               True,
        "ml_prediction":         ml_result,         # full ML detail for transparency
    }