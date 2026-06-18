class PositionManager:

    def __init__(self):

        self.current_position = None

    def has_position(self):

        return self.current_position is not None

    def open_position(self,symbol,side,qty):

        self.current_position = {
            "symbol":symbol,
            "side":side,
            "qty":qty
        }

    def close_position(self):

        self.current_position = None