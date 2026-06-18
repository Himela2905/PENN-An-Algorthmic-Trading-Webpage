import pandas as pd
import numpy as np


class GoldenCross:
    def __init__(self, df: pd.DataFrame, long_period: int, short_period: int):
        self.df           = df
        self.short_period = short_period
        self.long_period  = long_period
        self.compute_indicators()

    def compute_indicators(self):
        self.df["long_average"]  = self.df["close"].rolling(window=self.long_period).mean()
        self.df["short_average"] = self.df["close"].rolling(window=self.short_period).mean()
        self.df["long_average"]  = self.df["long_average"].bfill().ffill()
        self.df["short_average"] = self.df["short_average"].bfill().ffill()

    def generate_signals(self):
        self.df["signal"] = 0

        cross_up = (self.df["short_average"] > self.df["long_average"]) & \
                   (self.df["short_average"].shift(1) <= self.df["long_average"].shift(1))

        cross_down = (self.df["short_average"] < self.df["long_average"]) & \
                     (self.df["short_average"].shift(1) >= self.df["long_average"].shift(1))

        self.df.loc[cross_up,   "signal"] = 1
        self.df.loc[cross_down, "signal"] = -1

        return self.df


class RSI_Strategy:
    def __init__(self, df, period=14, overbought=70, oversold=30):
        self.df         = df
        self.period     = period
        self.overbought = overbought
        self.oversold   = oversold

    def generate_signals(self):
        delta = self.df['close'].diff()
        gain  = (delta.where(delta > 0, 0)).rolling(self.period).mean()
        loss  = (-delta.where(delta < 0, 0)).rolling(self.period).mean()

        rs                = gain / loss
        self.df['rsi']    = 100 - (100 / (1 + rs))
        self.df['signal'] = 0

        buy_signal  = (self.df['rsi'] < self.oversold) & \
                      (self.df['rsi'].shift(1) >= self.oversold)
        sell_signal = (self.df['rsi'] > self.overbought) & \
                      (self.df['rsi'].shift(1) <= self.overbought)

        self.df.loc[buy_signal,  'signal'] = 1
        self.df.loc[sell_signal, 'signal'] = -1

        return self.df

# ==========================================
# 1. Death Cross
# ==========================================

class DeathCross:
    def __init__(self, df, short_period=50, long_period=200):
        self.df = df
        self.short_period = short_period
        self.long_period = long_period

    def generate_signals(self):

        self.df["short_ma"] = self.df["close"].rolling(self.short_period).mean()
        self.df["long_ma"] = self.df["close"].rolling(self.long_period).mean()

        self.df["signal"] = 0

        sell = (
            (self.df["short_ma"] < self.df["long_ma"]) &
            (self.df["short_ma"].shift(1) >= self.df["long_ma"].shift(1))
        )

        buy = (
            (self.df["short_ma"] > self.df["long_ma"]) &
            (self.df["short_ma"].shift(1) <= self.df["long_ma"].shift(1))
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 2. EMA Cross
# ==========================================

class EMA_Cross:

    def __init__(self, df, fast=20, slow=50):
        self.df = df
        self.fast = fast
        self.slow = slow

    def generate_signals(self):

        self.df["fast_ema"] = self.df["close"].ewm(span=self.fast).mean()
        self.df["slow_ema"] = self.df["close"].ewm(span=self.slow).mean()

        self.df["signal"] = 0

        buy = (
            (self.df["fast_ema"] > self.df["slow_ema"]) &
            (self.df["fast_ema"].shift(1) <= self.df["slow_ema"].shift(1))
        )

        sell = (
            (self.df["fast_ema"] < self.df["slow_ema"]) &
            (self.df["fast_ema"].shift(1) >= self.df["slow_ema"].shift(1))
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 3. Triple Moving Average
# ==========================================

class TripleMA:

    def __init__(self, df):
        self.df = df

    def generate_signals(self):

        self.df["ma10"] = self.df["close"].rolling(10).mean()
        self.df["ma50"] = self.df["close"].rolling(50).mean()
        self.df["ma200"] = self.df["close"].rolling(200).mean()

        self.df["signal"] = 0

        buy = (
            (self.df["ma10"] > self.df["ma50"]) &
            (self.df["ma50"] > self.df["ma200"])
        )

        sell = (
            (self.df["ma10"] < self.df["ma50"]) &
            (self.df["ma50"] < self.df["ma200"])
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 4. EMA Ribbon
# ==========================================

class EMA_Ribbon:

    def __init__(self, df):
        self.df = df

    def generate_signals(self):

        self.df["ema8"] = self.df["close"].ewm(span=8).mean()
        self.df["ema13"] = self.df["close"].ewm(span=13).mean()
        self.df["ema21"] = self.df["close"].ewm(span=21).mean()
        self.df["ema34"] = self.df["close"].ewm(span=34).mean()
        self.df["ema55"] = self.df["close"].ewm(span=55).mean()

        self.df["signal"] = 0

        buy = (
            (self.df["ema8"] > self.df["ema13"]) &
            (self.df["ema13"] > self.df["ema21"]) &
            (self.df["ema21"] > self.df["ema34"]) &
            (self.df["ema34"] > self.df["ema55"])
        )

        sell = (
            (self.df["ema8"] < self.df["ema13"]) &
            (self.df["ema13"] < self.df["ema21"]) &
            (self.df["ema21"] < self.df["ema34"]) &
            (self.df["ema34"] < self.df["ema55"])
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 5. MACD Cross
# ==========================================

class MACD_Cross:

    def __init__(self, df):
        self.df = df

    def generate_signals(self):

        ema12 = self.df["close"].ewm(span=12).mean()
        ema26 = self.df["close"].ewm(span=26).mean()

        self.df["macd"] = ema12 - ema26
        self.df["signal_line"] = self.df["macd"].ewm(span=9).mean()

        self.df["signal"] = 0

        buy = (
            (self.df["macd"] > self.df["signal_line"]) &
            (self.df["macd"].shift(1) <= self.df["signal_line"].shift(1))
        )

        sell = (
            (self.df["macd"] < self.df["signal_line"]) &
            (self.df["macd"].shift(1) >= self.df["signal_line"].shift(1))
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 6. MACD Zero Line
# ==========================================

class MACD_ZeroLine:

    def __init__(self, df):
        self.df = df

    def generate_signals(self):

        ema12 = self.df["close"].ewm(span=12).mean()
        ema26 = self.df["close"].ewm(span=26).mean()

        self.df["macd"] = ema12 - ema26

        self.df["signal"] = 0

        buy = (
            (self.df["macd"] > 0) &
            (self.df["macd"].shift(1) <= 0)
        )

        sell = (
            (self.df["macd"] < 0) &
            (self.df["macd"].shift(1) >= 0)
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 7. Momentum Burst
# ==========================================

class MomentumBurst:

    def __init__(self, df, period=10, threshold=5):
        self.df = df
        self.period = period
        self.threshold = threshold

    def generate_signals(self):

        self.df["roc"] = (
            self.df["close"].pct_change(self.period) * 100
        )

        self.df["signal"] = 0

        buy = self.df["roc"] > self.threshold
        sell = self.df["roc"] < -self.threshold

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 8. ROC Strategy
# ==========================================

class ROC_Strategy:

    def __init__(self, df, period=14):
        self.df = df
        self.period = period

    def generate_signals(self):

        self.df["roc"] = (
            self.df["close"] /
            self.df["close"].shift(self.period) - 1
        ) * 100

        self.df["signal"] = 0

        buy = (
            (self.df["roc"] > 0) &
            (self.df["roc"].shift(1) <= 0)
        )

        sell = (
            (self.df["roc"] < 0) &
            (self.df["roc"].shift(1) >= 0)
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 9. Price Breakout
# ==========================================

class PriceBreakout:

    def __init__(self, df, period=20):
        self.df = df
        self.period = period

    def generate_signals(self):

        self.df["highest"] = (
            self.df["high"]
            .rolling(self.period)
            .max()
        )

        self.df["lowest"] = (
            self.df["low"]
            .rolling(self.period)
            .min()
        )

        self.df["signal"] = 0

        buy = (
            self.df["close"] >
            self.df["highest"].shift(1)
        )

        sell = (
            self.df["close"] <
            self.df["lowest"].shift(1)
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df


# ==========================================
# 10. Donchian Breakout
# ==========================================

class DonchianBreakout:

    def __init__(self, df, period=20):
        self.df = df
        self.period = period

    def generate_signals(self):

        self.df["upper"] = (
            self.df["high"]
            .rolling(self.period)
            .max()
        )

        self.df["lower"] = (
            self.df["low"]
            .rolling(self.period)
            .min()
        )

        self.df["signal"] = 0

        buy = (
            self.df["close"] >
            self.df["upper"].shift(1)
        )

        sell = (
            self.df["close"] <
            self.df["lower"].shift(1)
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df

# ==========================================
# 11. Bollinger Band
# ==========================================
    
class BollingerBands:

    def __init__(self, df, period=20, std_dev=2):
        self.df = df
        self.period = period
        self.std_dev = std_dev

    def generate_signals(self):

        ma = self.df["close"].rolling(self.period).mean()
        std = self.df["close"].rolling(self.period).std()

        self.df["upper_band"] = ma + (self.std_dev * std)
        self.df["lower_band"] = ma - (self.std_dev * std)

        self.df["signal"] = 0

        buy = self.df["close"] < self.df["lower_band"]
        sell = self.df["close"] > self.df["upper_band"]

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 12. Bollinger Squeeze
# ==========================================

class BollingerSqueeze:

    def __init__(self, df, period=20):
        self.df = df
        self.period = period

    def generate_signals(self):

        ma = self.df["close"].rolling(self.period).mean()
        std = self.df["close"].rolling(self.period).std()

        upper = ma + (2 * std)
        lower = ma - (2 * std)

        width = (upper - lower) / ma

        squeeze = width < width.rolling(100).quantile(0.2)

        self.df["signal"] = 0

        buy = squeeze & (self.df["close"] > upper)
        sell = squeeze & (self.df["close"] < lower)

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 13. VWAP Cross
# ==========================================

class VWAP_Cross:

    def __init__(self, df):
        self.df = df

    def generate_signals(self):

        tp = (
            self.df["high"] +
            self.df["low"] +
            self.df["close"]
        ) / 3

        self.df["vwap"] = (
            (tp * self.df["volume"]).cumsum()
            / self.df["volume"].cumsum()
        )

        self.df["signal"] = 0

        buy = (
            (self.df["close"] > self.df["vwap"]) &
            (self.df["close"].shift(1) <= self.df["vwap"].shift(1))
        )

        sell = (
            (self.df["close"] < self.df["vwap"]) &
            (self.df["close"].shift(1) >= self.df["vwap"].shift(1))
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 14. VWAP_Bounce
# ==========================================

class VWAP_Bounce:

    def __init__(self, df):
        self.df = df

    def generate_signals(self):

        tp = (
            self.df["high"] +
            self.df["low"] +
            self.df["close"]
        ) / 3

        self.df["vwap"] = (
            (tp * self.df["volume"]).cumsum()
            / self.df["volume"].cumsum()
        )

        self.df["signal"] = 0

        buy = (
            (self.df["low"] <= self.df["vwap"]) &
            (self.df["close"] > self.df["vwap"])
        )

        sell = (
            (self.df["high"] >= self.df["vwap"]) &
            (self.df["close"] < self.df["vwap"])
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 15. ATR_Breakout
# ==========================================

class ATR_Breakout:

    def __init__(self, df, period=14):
        self.df = df
        self.period = period

    def generate_signals(self):

        high_low = self.df["high"] - self.df["low"]

        high_close = np.abs(
            self.df["high"] - self.df["close"].shift()
        )

        low_close = np.abs(
            self.df["low"] - self.df["close"].shift()
        )

        tr = pd.concat(
            [high_low, high_close, low_close],
            axis=1
        ).max(axis=1)

        atr = tr.rolling(self.period).mean()

        self.df["signal"] = 0

        buy = (
            self.df["close"] >
            self.df["close"].shift(1) + atr
        )

        sell = (
            self.df["close"] <
            self.df["close"].shift(1) - atr
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 16. Stochastic_Strategy
# ==========================================

class Stochastic_Strategy:

    def __init__(self, df, period=14):
        self.df = df
        self.period = period

    def generate_signals(self):

        low_min = self.df["low"].rolling(self.period).min()
        high_max = self.df["high"].rolling(self.period).max()

        self.df["k"] = (
            100 *
            (self.df["close"] - low_min)
            / (high_max - low_min)
        )

        self.df["signal"] = 0

        buy = (
            (self.df["k"] < 20) &
            (self.df["k"].shift(1) >= 20)
        )

        sell = (
            (self.df["k"] > 80) &
            (self.df["k"].shift(1) <= 80)
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 17. ZScore_Reversion
# ==========================================

class ZScore_Reversion:

    def __init__(self, df, period=20):
        self.df = df
        self.period = period

    def generate_signals(self):

        mean = self.df["close"].rolling(self.period).mean()
        std = self.df["close"].rolling(self.period).std()

        self.df["zscore"] = (
            self.df["close"] - mean
        ) / std

        self.df["signal"] = 0

        buy = self.df["zscore"] < -2
        sell = self.df["zscore"] > 2

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 18. ADX_Strategy
# ==========================================

class ADX_Strategy:

    def __init__(self, df, period=14):
        self.df = df
        self.period = period

    def generate_signals(self):

        up_move = self.df["high"].diff()
        down_move = -self.df["low"].diff()

        plus_dm = np.where(
            (up_move > down_move) & (up_move > 0),
            up_move,
            0
        )

        minus_dm = np.where(
            (down_move > up_move) & (down_move > 0),
            down_move,
            0
        )

        tr = pd.concat([
            self.df["high"] - self.df["low"],
            abs(self.df["high"] - self.df["close"].shift()),
            abs(self.df["low"] - self.df["close"].shift())
        ], axis=1).max(axis=1)

        atr = tr.rolling(self.period).mean()

        plus_di = (
            pd.Series(plus_dm).rolling(self.period).mean()
            / atr
        ) * 100

        minus_di = (
            pd.Series(minus_dm).rolling(self.period).mean()
            / atr
        ) * 100

        self.df["signal"] = 0

        buy = (plus_di > minus_di)
        sell = (minus_di > plus_di)

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 19. VolumeSpikeBreakout
# ==========================================

class VolumeSpikeBreakout:

    def __init__(self, df, period=20):
        self.df = df
        self.period = period

    def generate_signals(self):

        avg_vol = self.df["volume"].rolling(
            self.period
        ).mean()

        self.df["signal"] = 0

        buy = (
            (self.df["volume"] > avg_vol * 2) &
            (self.df["close"] > self.df["close"].shift(1))
        )

        sell = (
            (self.df["volume"] > avg_vol * 2) &
            (self.df["close"] < self.df["close"].shift(1))
        )

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
    
# ==========================================
# 20. SuperTrend
# ==========================================

class SuperTrend:

    def __init__(self, df, period=10, multiplier=3):
        self.df = df
        self.period = period
        self.multiplier = multiplier

    def generate_signals(self):

        hl2 = (
            self.df["high"] +
            self.df["low"]
        ) / 2

        tr = pd.concat([
            self.df["high"] - self.df["low"],
            abs(self.df["high"] - self.df["close"].shift()),
            abs(self.df["low"] - self.df["close"].shift())
        ], axis=1).max(axis=1)

        atr = tr.rolling(self.period).mean()

        upper = hl2 + self.multiplier * atr
        lower = hl2 - self.multiplier * atr

        self.df["signal"] = 0

        buy = self.df["close"] > upper.shift(1)
        sell = self.df["close"] < lower.shift(1)

        self.df.loc[buy, "signal"] = 1
        self.df.loc[sell, "signal"] = -1

        return self.df
