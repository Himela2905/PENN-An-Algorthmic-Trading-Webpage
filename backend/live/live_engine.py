import threading
import time
import pandas as pd

from live.strategy_runner import StrategyRunner
from services.yfinance_service import get_candles
from datetime import datetime
import queue
signal_queue = queue.Queue()

class LiveEngine:
    def __init__(self):
        self.engines = {}  # key: "SYMBOL_STRATEGY" → engine state dict
        self.running = False  # kept for backward compat

    def start(self, symbol, strategy_name, qty):
        key = f"{symbol}_{strategy_name}"
        if key in self.engines:
            print(f"Already running {key}")
            return

        engine_state = {
            "symbol":        symbol,
            "strategy_name": strategy_name,
            "qty":           qty,
            "running":       True,
            "positions":     [],
            "trade_history": [],
            "current_position": None,
            "last_signal":   0,
            "total_pnl":     0,
            "total_trades":  0,
            "wins":          0,
            "losses":        0,
        }
        self.engines[key] = engine_state
        self.running = True

        thread = threading.Thread(
            target=self._run_loop,
            args=(key,),
            daemon=True
        )
        thread.start()
        print(f"Started engine: {key}")

    def _run_loop(self, key):
        import pandas as pd
        from services.yfinance_service import get_candles

        while key in self.engines and self.engines[key]["running"]:
            state = self.engines[key]
            try:
                candles = get_candles(state["symbol"], tf="1D")
                if not candles:
                    print(f"[{key}] No candles, retrying...")
                    time.sleep(30)
                    continue

                df     = pd.DataFrame(candles)
                signal = StrategyRunner.get_signal(state["strategy_name"], df)
                price  = float(df["close"].iloc[-1])

                print(f"[{key}] signal={signal} price={price} last={state['last_signal']}")

                # BUY: signal is 1 AND we have no position
                if signal == 1 and state["current_position"] is None:
                    self._create_trade(key, "BUY", price)
                    self._open_position(key, "BUY", price)
                    state["last_signal"] = 1
                    print(f"[{key}] BUY EXECUTED at {price}")

                # SELL: signal is -1 AND we have an open BUY position
                elif signal == -1 and state["current_position"] is not None and state["current_position"]["side"] == "BUY":
                    self._close_position(key, price)
                    self._create_trade(key, "SELL", price)
                    state["last_signal"] = -1
                    print(f"[{key}] SELL EXECUTED at {price}")

                # HOLD
                else:
                    print(f"[{key}] HOLD - signal={signal}, position={'open' if state['current_position'] else 'none'}")

            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"[{key}] Error: {e}")

            time.sleep(30)

    def stop(self, symbol=None, strategy_name=None):
        if symbol and strategy_name:
            key = f"{symbol}_{strategy_name}"
            if key in self.engines:
                self.engines[key]["running"] = False
                del self.engines[key]
                print(f"Stopped {key}")
        else:
            # stop all
            for key in list(self.engines.keys()):
                self.engines[key]["running"] = False
            self.engines.clear()
            self.running = False
            print("All engines stopped")

    def _open_position(self, key, side, price):
        state = self.engines[key]
        state["current_position"] = {
            "symbol":       state["symbol"],
            "side":         side,
            "qty":          state["qty"],
            "avgEntry":     round(price, 2),
            "entry_price":  round(price, 2),
            "currentPrice": round(price, 2),
            "pnl":          0,
            "pnl_pct":      0,
        }
        state["positions"] = [state["current_position"]]

    def _close_position(self, key, exit_price):
        state = self.engines[key]
        if not state["current_position"]:
            return
        entry = state["current_position"]["entry_price"]
        qty   = state["current_position"]["qty"]
        side  = state["current_position"]["side"]
        pnl   = (exit_price - entry) * qty if side == "BUY" else (entry - exit_price) * qty
        state["total_pnl"]    += pnl
        state["total_trades"] += 1
        if pnl > 0: state["wins"]   += 1
        else:       state["losses"] += 1
        state["current_position"] = None
        state["positions"]        = []
        print(f"[{key}] CLOSED PnL={round(pnl,2)}")

    def _create_trade(self, key, side, price):
        state = self.engines[key]
        trade = {
            "time":   datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "symbol": state["symbol"],
            "side":   side,
            "qty":    state["qty"],
            "price":  round(price, 2),
        }
        state["trade_history"].append(trade)
        try:
            signal_queue.put_nowait({"type": "TRADE", **trade})
        except Exception:
            pass
        print(f"TRADE EXECUTED: {trade}")

    @property
    def positions(self):
        result = []
        for state in self.engines.values():
            result.extend(state["positions"])
        return result

    @property
    def trade_history(self):
        result = []
        for state in self.engines.values():
            result.extend(state["trade_history"])
        return result

    def get_pnl(self):
        total = sum(s["total_pnl"] for s in self.engines.values())
        return {"pnl": round(total, 2), "pnl_pct": 0, "total_equity": 100000 + total}

    def get_stats(self):
        wins   = sum(s["wins"]          for s in self.engines.values())
        losses = sum(s["losses"]        for s in self.engines.values())
        trades = sum(s["total_trades"]  for s in self.engines.values())
        return {"total_pnl": self.get_pnl()["pnl"], "total_trades": trades, "wins": wins, "losses": losses}

    def inject_test_trade(self, symbol: str, strategy: str):
        """
        Manually injects a BUY trade for demo/testing purposes.
        Call this when you want to show the system working without
        waiting for market conditions.
        """
        key = f"{symbol}_{strategy}"
        if key not in self.engines:
            # create a temporary engine state
            self.engines[key] = {
                "symbol": symbol, "strategy_name": strategy, "qty": 1,
                "running": False, "positions": [], "trade_history": [],
                "current_position": None, "last_signal": 0,
                "total_pnl": 0, "total_trades": 0, "wins": 0, "losses": 0,
            }
        
        # get current price
        from services.yfinance_service import get_candles
        import pandas as pd
        candles = get_candles(symbol, tf="1D")
        price   = float(pd.DataFrame(candles)["close"].iloc[-1]) if candles else 100.0
        
        self._create_trade(key, "BUY", price)
        self._open_position(key, "BUY", price)
        print(f"[inject] Test BUY trade created for {symbol} at {price}")

live_engine = LiveEngine()