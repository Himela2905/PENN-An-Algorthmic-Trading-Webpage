import pandas as pd
import numpy as np


class Backtester:
    def __init__(self, df: pd.DataFrame, initial_balance=None):
        if initial_balance is None:
            initial_balance = 10000

        self.df              = df.copy()
        self.initial_balance = initial_balance
        self.balance         = initial_balance
        self.position        = 0
        self.trades          = []

    def run(self):
        # clean data
        self.df = self.df.dropna(subset=['close'])

        if self.df.empty:
            return self.initial_balance, [], 0, 0

        # reset
        self.balance  = self.initial_balance
        self.position = 0
        self.trades   = []

        for i, row in self.df.iterrows():
            try:
                raw_signal = row.at["signal"]
                if pd.isna(raw_signal):
                    continue
                signal = int(raw_signal)
                price  = float(row.at["close"])

                if pd.isna(price) or price <= 0:
                    continue

                if signal == 1 and self.position == 0:
                    self.position = self.balance / price
                    self.balance  = 0
                    self.trades.append(("BUY", price, i))

                elif signal == -1 and self.position > 0:
                    self.balance  = self.position * price
                    self.position = 0
                    self.trades.append(("SELL", price, i))

            except Exception:
                continue

        # close open position at end
        final_price = float(self.df.iloc[-1]["close"])
        if self.position > 0:
            self.balance  = self.position * final_price
            self.position = 0
            self.trades.append(("SELL", final_price, self.df.index[-1]))

        final_value = self.balance

        if final_value <= 0:
            final_value = self.initial_balance

        # win ratio
        buy_prices  = [p for a, p, _ in self.trades if a == "BUY"]
        sell_prices = [p for a, p, _ in self.trades if a == "SELL"]
        pairs       = list(zip(buy_prices, sell_prices))
        wins        = sum(1 for b, s in pairs if s > b)
        win_ratio   = round((wins / len(pairs) * 100), 1) if pairs else 0

        # max drawdown
        peak     = self.initial_balance
        drawdown = 0
        running  = self.initial_balance
        for action, price, _ in self.trades:
            if action == "SELL":
                running  = running + (price - (running / (running / price)))
                peak     = max(peak, running)
                dd       = (running - peak) / peak * 100
                drawdown = min(drawdown, dd)

        print(f"Trades executed: {len(self.trades)}, Final: {final_value}, WinRatio: {win_ratio}")

        return round(final_value, 2), self.trades, win_ratio, round(drawdown, 2)