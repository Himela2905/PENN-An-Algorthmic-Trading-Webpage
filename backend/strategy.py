import pandas as pd
import numpy as np

class GoldenCross:
    def __init__(self, df: pd.DataFrame, long_period: int, short_period: int):
        self.df = df
        self.short_period = short_period
        self.long_period = long_period
        self.compute_indicators()

    def compute_indicators(self):
        #calculate moving average
        self.df["long_average"] = self.df["close"].rolling(window=self.long_period).mean()
        self.df["short_average"] = self.df["close"].rolling(window=self.short_period).mean()
        
        #filling the blanks
        self.df["long_average"]=self.df["long_average"].bfill().ffill()
        self.df["short_average"]=self.df["short_average"].bfill().ffill()

    def generate_signals(self):
        self.df["signal"] = 0

        #define crossover
        cross_up = (self.df["short_average"] > self.df["long_average"]) & \
                   (self.df["short_average"].shift(1) <= self.df["long_average"].shift(1))
        cross_down = (self.df["short_average"] < self.df["long_average"]) & \
                     (self.df["short_average"].shift(1) >= self.df["long_average"].shift(1))
        
        #Assign signals
        self.df.loc[cross_up, "signal"] = 1
        self.df.loc[cross_down, "signal"] = -1
        
        return self.df
    
class RSI_Strategy:
    def __init__(self, df, period=14, overbought=70, oversold=30):
        self.df = df
        self.period = period
        self.overbought = overbought
        self.oversold = oversold

    def generate_signals(self):
        # Calculate RSI
        delta = self.df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(self.period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(self.period).mean()

        rs = gain / loss
        self.df['rsi'] = 100 - (100 / (1 + rs))

        # Generate buy/sell signals
        self.df['signal'] = 0
        self.df.loc[self.df['rsi'] < self.oversold, 'signal'] = 1   # Buy
        self.df.loc[self.df['rsi'] > self.overbought, 'signal'] = -1 # Sell

        return self.df


