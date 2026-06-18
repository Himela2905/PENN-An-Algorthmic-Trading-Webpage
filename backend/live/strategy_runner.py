from strategy import *

class StrategyRunner:

    @staticmethod
    def get_signal(strategy_name, df):

        strategy_map = {
            "Golden Cross": lambda d: GoldenCross(d,50,20),
            "RSI": lambda d: RSI_Strategy(d),
            "EMA Cross": lambda d: EMA_Cross(d),
            "MACD Cross": lambda d: MACD_Cross(d),
            "SuperTrend": lambda d: SuperTrend(d),
        }

        strategy = strategy_map[strategy_name](df)

        result = strategy.generate_signals()

        return int(result["signal"].iloc[-1])