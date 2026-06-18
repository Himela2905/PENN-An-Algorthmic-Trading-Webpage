"""
indicator_service.py
--------------------
Central dispatcher that maps strategy IDs (matching frontend mockData.ts)
to the correct strategy class from strategy.py, runs them, and returns
the latest signal with indicator values.
"""

import pandas as pd
import numpy as np
from strategy import (
    GoldenCross, DeathCross, EMA_Cross, TripleMA, EMA_Ribbon,
    MACD_Cross, MACD_ZeroLine, MomentumBurst, ROC_Strategy,
    PriceBreakout, DonchianBreakout, BollingerBands, BollingerSqueeze,
    VWAP_Cross, VWAP_Bounce, ATR_Breakout, Stochastic_Strategy,
    ZScore_Reversion, ADX_Strategy, VolumeSpikeBreakout, SuperTrend,
    RSI_Strategy,
)

# Maps frontend algo IDs → (StrategyClass, kwargs)
STRATEGY_MAP = {
    "golden_cross":   (GoldenCross,          {"long_period": 50, "short_period": 20}),
    "death_cross":    (DeathCross,            {"short_period": 50, "long_period": 200}),
    "rsi_reversal":   (RSI_Strategy,          {"period": 14, "overbought": 70, "oversold": 30}),
    "macd_signal":    (MACD_Cross,            {}),
    "bb_squeeze":     (BollingerSqueeze,      {"period": 20}),
    "vwap_bounce":    (VWAP_Bounce,           {}),
    "momentum_burst": (MomentumBurst,         {"period": 10, "threshold": 5}),
    "ema_ribbon":     (EMA_Ribbon,            {}),
    "stoch_cross":    (Stochastic_Strategy,   {"period": 14}),
    "ichimoku":       (TripleMA,              {}),           # TripleMA as proxy
    "pivot_points":   (PriceBreakout,         {"period": 20}),
    "adx_trend":      (ADX_Strategy,          {"period": 14}),
    "parabolic_sar":  (SuperTrend,            {"period": 10, "multiplier": 3}),
    "obv_divergence": (VolumeSpikeBreakout,   {"period": 20}),
    "atr_breakout":   (ATR_Breakout,          {"period": 14}),
    "cci_reversal":   (ZScore_Reversion,      {"period": 20}),
    "donchian":       (DonchianBreakout,      {"period": 20}),
    "zscore_mean":    (ZScore_Reversion,      {"period": 20}),
    "keltner_break":  (EMA_Cross,             {"fast": 20, "slow": 50}),
    "ai_ensemble":    (MACD_Cross,            {}),           # placeholder, ranked by scoring
}


def _prep_df(df: pd.DataFrame) -> pd.DataFrame:
    """Ensure lowercase columns and clean data."""
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df.columns = df.columns.str.lower()
    df = df.dropna(subset=["close"])
    return df.copy()


def run_strategy(algo_id: str, df: pd.DataFrame) -> pd.DataFrame:
    """
    Run strategy by ID on a DataFrame.
    Returns the DataFrame with a 'signal' column added.
    Raises ValueError if algo_id not found.
    """
    if algo_id not in STRATEGY_MAP:
        raise ValueError(f"Unknown algorithm: {algo_id}")

    df = _prep_df(df)
    StratClass, kwargs = STRATEGY_MAP[algo_id]

    strategy = StratClass(df, **kwargs)
    df = strategy.generate_signals()
    return df


def get_latest_signal(algo_id: str, df: pd.DataFrame) -> dict:
    """
    Run strategy and return only the most recent signal.
    Returns: { signal: 1 | -1 | 0, price: float, time: str }
    """
    try:
        df = run_strategy(algo_id, df)
        last = df.iloc[-1]
        signal = int(last.get("signal", 0)) if not pd.isna(last.get("signal", 0)) else 0
        price  = float(last["close"])
        time   = str(df.index[-1])
        return {"signal": signal, "price": price, "time": time, "algo_id": algo_id}
    except Exception as e:
        print(f"[indicator] Error running {algo_id}: {e}")
        return {"signal": 0, "price": 0.0, "time": "", "algo_id": algo_id}


def get_all_latest_signals(df: pd.DataFrame) -> list:
    """
    Run all 20 strategies on the same DataFrame.
    Returns list of {algo_id, signal, price, time} for each.
    """
    results = []
    for algo_id in STRATEGY_MAP:
        result = get_latest_signal(algo_id, df.copy())
        results.append(result)
    return results