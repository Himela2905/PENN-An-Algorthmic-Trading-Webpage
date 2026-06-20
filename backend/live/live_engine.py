import threading
import time
import pandas as pd

from live.strategy_runner import StrategyRunner
from services.yfinance_service import get_candles
from datetime import datetime

class LiveEngine:

    def __init__(self):

        self.running = False
        self.thread=None
        self.symbol = None
        self.strategy_name = None
        self.qty = 1

        self.positions = []
        self.trade_history = []

        self.positions = []
        self.trade_history = []

        self.current_position = None
        self.last_signal = 0


        self.total_pnl = 0
        self.total_trades = 0
        self.wins = 0
        self.losses = 0

    def start(self, symbol, strategy_name, qty):

        if self.running:
            return

        self.running = True

        self.symbol = symbol
        self.strategy_name = strategy_name
        self.qty = qty

        self.thread = threading.Thread(
            target=self.run_loop,
            daemon=True
        )

        self.thread.start()
    def run_loop(self):

        while self.running:

            try:

                candles = get_candles(
                    self.symbol,
                    tf="15m"
                )
                print("Candles:", candles)
                df = pd.DataFrame(candles)
                print("Columns:", df.columns.tolist())

                signal = StrategyRunner.get_signal(
                    self.strategy_name,
                    df
                )

                latest_price = float(df["close"].iloc[-1])

                if signal == 1 and self.last_signal != 1:

                    if (
                        self.current_position
                        and self.current_position["side"] == "SELL"
                    ):
                        self.close_position(latest_price)

                    self.create_trade(
                        "BUY",
                        latest_price
                    )

                    self.open_position(
                        "BUY",
                        latest_price
                    )

                    self.last_signal = 1

                elif signal == -1 and self.last_signal != -1:


                    if (
                        self.current_position
                        and self.current_position["side"] == "BUY"
                    ):
                        self.close_position(latest_price)

                    self.create_trade(
                    side="SELL",
                    price=latest_price
                    )

                    self.open_position(
                    side="SELL",
                    price=latest_price
                    )

                    self.last_signal = -1

                else:

                    print("HOLD")

            except Exception as e:

                print(
                    f"Live Engine Error: {e}"
                )
        if self.current_position:

            current_price = latest_price

            entry = self.current_position["avgEntry"]

            qty = self.current_position["qty"]

            if self.current_position["side"] == "BUY":
                pnl = (current_price - entry) * qty
            else:
                pnl = (entry - current_price) * qty

            self.current_position["currentPrice"] = round(
                current_price,
                2
            )

            self.current_position["pnl"] = round(
                pnl,
                2
            )
        time.sleep(30)
    def stop(self):

        self.running = False

        print("Live trading stopped")

    def create_trade(self, side, price):

        trade = {
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "symbol": self.symbol,
            "side": side,
            "qty": self.qty,
            "price": round(price, 2)
        }

        self.trade_history.append(trade)

        print("TRADE EXECUTED:", trade)

    def open_position(self, side, price):
        self.current_position = {
            "symbol": self.symbol,
            "side": side,
            "qty": self.qty,
            "avgEntry": round(price, 2),
            "currentPrice": round(price, 2),
            "pnl": 0
            }

        self.positions = [self.current_position]
    def get_pnl(self):

        if not self.current_position:
            return {
                "pnl": 0,
                "pnl_pct": 0
            }

        candles = get_candles(
            self.symbol,
            tf="15m"
    )

        if not candles:
            return {
                "pnl": 0,
                "pnl_pct": 0
            }

        current_price = candles[-1]["close"]

        entry_price = self.current_position["entry_price"]

        qty = self.current_position["qty"]

        side = self.current_position["side"]

        if side == "BUY":

            pnl = (
                current_price - entry_price
            ) * qty

        else:

            pnl = (
             entry_price - current_price
            ) * qty

        pnl_pct = (
            pnl / (entry_price * qty)
        ) * 100

        return {
            "symbol": self.symbol,
            "entry_price": entry_price,
            "current_price": current_price,
            "qty": qty,
            "side": side,
            "pnl": round(pnl, 2),
            "pnl_pct": round(pnl_pct, 2)
        }
    
    def close_position(self, exit_price):

        if not self.current_position:
            return

        side = self.current_position["side"]

        qty = self.current_position["qty"]

        entry = self.current_position["entry_price"]

        if side == "BUY":

            pnl = (
                exit_price - entry
            ) * qty

        else:

            pnl = (
                entry - exit_price
            ) * qty

        print(
            f"POSITION CLOSED | PnL={round(pnl,2)}"
        )
        self.total_pnl += pnl
        self.total_trades += 1

        if pnl > 0:
            self.wins += 1
        else:
            self.losses += 1
        self.current_position = None

        self.positions = []

        self.trade_history.append({
        "symbol": self.symbol,
        "side": "EXIT",
        "qty": qty,
        "entry": entry,
        "exit": exit_price,
        "pnl": round(pnl,2)
    })
    def get_stats(self):

        return {
            "total_pnl": self.total_pnl,
            "total_trades": self.total_trades,
            "wins": self.wins,
            "losses": self.losses
        }
live_engine = LiveEngine()