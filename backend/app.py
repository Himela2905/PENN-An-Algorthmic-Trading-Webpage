from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
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
    return jsonify({"status": "Flask backend running 🚀"})

# -----------------------------
# Backtest Route — UNCHANGED
# -----------------------------
@app.route("/backtest", methods=["POST"])
@jwt_required() 
def run_backtest():
    current_user_id = get_jwt_identity()
    data = request.json
    symbol           = data.get("symbol")
    strategy_name    = data.get("strategy")
    period           = data.get("period", "1y")
    interval         = data.get("interval", "1d")
    initial_balance  = float(data.get("initial_balance", 10000))

    if not symbol:
        return jsonify({"error": "Symbol is required"}), 400

    df = fetch_from_yf(symbol, period, interval)

    if df.empty:
        return jsonify({"error": "No data found"}), 400

    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df.columns = df.columns.str.lower()

    if strategy_name == "Golden Cross":
        strategy = GoldenCross(df, long_period=200, short_period=50)
    elif strategy_name == "RSI":
        strategy = RSI_Strategy(df, period=14)
    else:
        return jsonify({"error": "Invalid strategy"}), 400

    df = strategy.generate_signals()

    backtester = Backtester(df, initial_balance=initial_balance)
    final_value, trades = backtester.run()

    trade_list = []
    for action, price, date in trades:
        trade_list.append({
            "action": action,
            "price": float(price),
            "date": str(date)
        })

    chart_data   = df.reset_index().to_dict(orient="records")
    profit_loss  = final_value - initial_balance
    profit_pct   = (profit_loss / initial_balance) * 100

    return jsonify({
        "symbol":          symbol,
        "strategy":        strategy_name,
        "initial_balance": initial_balance,
        "final_value":     float(final_value),
        "profit_loss":     float(profit_loss),
        "profit_percent":  float(profit_pct),
        "total_trades":    len(trades),
        "trades":          trade_list,
        "chart_data":      chart_data
    })

@app.route("/db-test")
def db_test():
    return "Database Connected!"

if __name__ == "__main__":
    app.run(debug=True)