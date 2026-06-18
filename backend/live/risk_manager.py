class RiskManager:

    MAX_QTY = 10

    @staticmethod
    def validate(qty):

        if qty > RiskManager.MAX_QTY:
            return False

        return True