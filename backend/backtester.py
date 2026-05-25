import pandas as pd # type: ignore


class Backtester:
    def __init__(self, df: pd.DataFrame, initial_balance=None):
        if initial_balance is None:
            initial_balance = 10000

        self.df = df
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.position = 0
        self.trades = []
        self.portfolio_value = initial_balance

    def run(self):
        if self.df.empty:
            print("⚠️ No data available for backtest.")
            return self.balance, self.trades   # return initial state safely
        
        for i, row in self.df.iterrows():
            signal=int(row.at["signal"])
            price=float(row.at["close"])

            if signal == 1 and self.position == 0:
                #buy
                self.position = self.balance / price
                self.balance = 0
                self.trades.append(("BUY", price, i))

            elif signal == -1 and self.position > 0:
                #Sell
                self.balance = self.position * price
                self.position = 0
                self.trades.append(("SELL", price , i))

        # Final portfolio value
        final_value = self.balance + (self.position * float(self.df.iloc[-1]["close"]))
        return final_value, self.trades
