from flask import signals

from strategy import STRATEGY_REGISTRY
import pandas as pd

from strategy import STRATEGY_REGISTRY

class StrategyRunner:

    @staticmethod
    def get_signal(strategy_name: str, df) -> int:
        if strategy_name not in STRATEGY_REGISTRY:
            print(f"[StrategyRunner] Unknown strategy: {strategy_name}")
            return 0  # HOLD, never crash

        try:
            strategy = STRATEGY_REGISTRY[strategy_name](df.copy())
            result   = strategy.generate_signals()
            signals = result[result["signal"] != 0]
            print(signals[["close", "signal"]].tail(10))

            
            signal   = result["signal"].iloc[-1]
            return 0 if pd.isna(signal) else int(signal)
        except Exception as e:
            print(f"[StrategyRunner] Error running {strategy_name}: {e}")
            return 0