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
        self.df = self.df.dropna(subset=['close'])

        if self.df.empty:
            return self.initial_balance, [], 0, 0

        self.balance  = self.initial_balance
        self.position = 0
        self.trades   = []

        equity_history = [self.initial_balance]  # track equity at every step

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

                # record current equity (cash + position value) at every step
                current_equity = self.balance + (self.position * price)
                equity_history.append(current_equity)

            except Exception:
                continue

        # close any open position at the end
        final_price = float(self.df.iloc[-1]["close"])
        if self.position > 0:
            self.balance  = self.position * final_price
            self.position = 0
            self.trades.append(("SELL", final_price, self.df.index[-1]))
            equity_history.append(self.balance)

        final_value = self.balance if self.balance > 0 else self.initial_balance

        # ---- Win ratio ----
        buy_prices  = [p for a, p, _ in self.trades if a == "BUY"]
        sell_prices = [p for a, p, _ in self.trades if a == "SELL"]
        pairs       = list(zip(buy_prices, sell_prices))
        wins        = sum(1 for b, s in pairs if s > b)
        win_ratio   = round((wins / len(pairs) * 100), 1) if pairs else 0

        # ---- Max drawdown — calculated from the FULL equity history ----
        equity_series = pd.Series(equity_history)
        running_max   = equity_series.cummax()
        drawdown_series = (equity_series - running_max) / running_max * 100
        max_drawdown  = round(float(drawdown_series.min()), 2) if not drawdown_series.empty else 0

        return round(final_value, 2), self.trades, win_ratio, max_drawdown