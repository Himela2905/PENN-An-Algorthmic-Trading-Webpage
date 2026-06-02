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