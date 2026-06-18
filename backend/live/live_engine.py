class LiveEngine:

    def __init__(self):

        self.running = False
        self.symbol = None
        self.strategy_name = None
        self.qty = 1

        self.positions = []
        self.trade_history = []

    def start(self, symbol, strategy_name, qty):

        self.running = True
        self.symbol = symbol
        self.strategy_name = strategy_name
        self.qty = qty

        print(
            f"Starting live trading: "
            f"{symbol} | {strategy_name}"
        )

    def stop(self):

        self.running = False

        print("Live trading stopped")


live_engine = LiveEngine()