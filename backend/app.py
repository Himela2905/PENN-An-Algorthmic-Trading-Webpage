from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from datetime import timedelta
from dotenv import load_dotenv
import os

load_dotenv()

from extensions import db, bcrypt, jwt
from routes.auth import auth_bp
from data_fetcher import fetch_from_yf
from strategy import GoldenCross, RSI_Strategy
from backtester import Backtester
from flask_jwt_extended import JWTManager,jwt_required, get_jwt_identity

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['JWT_SECRET_KEY']          = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

# Initialize extensions
db.init_app(app)
bcrypt.init_app(app)
jwt.init_app(app)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')

# -----------------------------
# Health Check
# -----------------------------
@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Flask backend running "})

# -----------------------------
# Backtest Route 
# -----------------------------
@app.route("/backtest", methods=["POST"])
@jwt_required()
def run_backtest():
    try:
        current_user_id = get_jwt_identity()
        data            = request.json

        symbol          = data.get("symbol", "").strip().upper()
        strategy_name   = data.get("strategy", "")
        period          = data.get("period", "2y")
        interval        = data.get("interval", "1d")
        initial_balance = float(data.get("initial_balance", 10000))

        if not symbol:
            return jsonify({"error": "Symbol is required"}), 400

        df = fetch_from_yf(symbol, period, interval)

        if df.empty:
            return jsonify({"error": "No data found for " + symbol}), 400

        if isinstance(df.columns, pd.MultiIndex):
            df.columns = df.columns.get_level_values(0)
        df.columns = df.columns.str.lower()

        if strategy_name == "Golden Cross":
            strategy = GoldenCross(df, long_period=50, short_period=20)
        elif strategy_name == "RSI":
            strategy = RSI_Strategy(df, period=14)
        else:
            return jsonify({"error": "Invalid strategy: " + strategy_name}), 400

        df = strategy.generate_signals()

        backtester                                   = Backtester(df, initial_balance=initial_balance)
        final_value, trades, win_ratio, max_drawdown = backtester.run()

        trade_list = []
        buy_count  = 0
        sell_count = 0
        for action, price, date in trades:
            trade_list.append({
                "action": action,
                "price":  round(float(price), 2),
                "date":   str(date)
            })
            if action == "BUY":
                buy_count += 1
            else:
                sell_count += 1

        # equity curve
        equity_curve = []
        bal          = initial_balance
        pos          = 0
        for i, row in df.iterrows():
            try:
                sig   = int(row["signal"]) if not pd.isna(row["signal"]) else 0
                price = float(row["close"])
                if sig == 1 and pos == 0:
                    pos = bal / price
                    bal = 0
                elif sig == -1 and pos > 0:
                    bal = pos * price
                    pos = 0
                equity_curve.append({
                    "date":  str(i),
                    "value": round(bal + pos * price, 2)
                })
            except Exception:
                continue

        profit_loss = round(final_value - initial_balance, 2)
        profit_pct  = round((profit_loss / initial_balance) * 100, 2)

        return jsonify({
            "symbol":          symbol,
            "strategy":        strategy_name,
            "initial_balance": initial_balance,
            "final_value":     final_value,
            "profit_loss":     profit_loss,
            "profit_percent":  profit_pct,
            "total_trades":    len(trades),
            "buy_trades":      buy_count,
            "sell_trades":     sell_count,
            "win_ratio":       win_ratio,
            "max_drawdown":    max_drawdown,
            "trades":          trade_list,
            "equity_curve":    equity_curve
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)