
"""
merged_app.py
Combines app.py + app(1).py without removing functionality.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity
from dotenv import load_dotenv
from datetime import timedelta
import os
import pandas as pd

load_dotenv()

from extensions import db, bcrypt, jwt
from config import DevelopmentConfig, ProductionConfig

# Blueprints
from routes.auth import auth_bp
from routes.fyers_auth import fyers_auth_bp
from routes.market import market_bp
from routes.orders import orders_bp
from routes.algo import algo_bp
from routes.backtest import backtest_bp

# Legacy backtest imports
from data_fetcher import fetch_from_yf
from strategy import GoldenCross, RSI_Strategy
from backtester import Backtester

from routes.live import live_bp


def create_app():
    app = Flask(__name__)

    CORS(
        app,
        resources={
            r"/*": {
                "origins": os.getenv(
                    "FRONTEND_URL",
                    "http://localhost:3000"
                )
            }
        },
    )
    app.register_blueprint(live_bp); #Rupayan LIve Trading 2
    env = os.getenv("ENVIRONMENT", "development")

    if "DevelopmentConfig" in globals():
        app.config.from_object(
            DevelopmentConfig if env == "development"
            else ProductionConfig
        )
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
        app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)

    # ALL blueprints from both files
    app.register_blueprint(auth_bp, url_prefix="/auth")

    try:
        app.register_blueprint(fyers_auth_bp)
    except Exception:
        pass

    try:
        app.register_blueprint(market_bp)
    except Exception:
        pass

    try:
        app.register_blueprint(orders_bp)
    except Exception:
        pass

    try:
        app.register_blueprint(algo_bp)
    except Exception:
        pass

    try:
        app.register_blueprint(backtest_bp)
    except Exception:
        pass

    @app.route("/", methods=["GET"])
    def health():
        return jsonify({
            "status": "QuantEdge backend running",
            "version": "2.0",
            "message": "Algo Trading Backend Running"
        })

    # Route from original app.py
    @app.route("/backtest/legacy", methods=["POST"])
    @jwt_required()
    def run_backtest_legacy():
        try:
            data = request.json

            symbol = data.get("symbol", "").strip().upper()
            strategy_name = data.get("strategy", "")
            period = data.get("period", "2y")
            interval = data.get("interval", "1d")
            initial_balance = float(
                data.get("initial_balance", 10000)
            )

            if not symbol:
                return jsonify({"error": "Symbol is required"}), 400

            df = fetch_from_yf(symbol, period, interval)

            if df.empty:
                return jsonify(
                    {"error": "No data found for " + symbol}
                ), 400

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df.columns = df.columns.str.lower()

            if strategy_name == "Golden Cross":
                strategy = GoldenCross(
                    df,
                    long_period=50,
                    short_period=20
                )
            elif strategy_name == "RSI":
                strategy = RSI_Strategy(df, period=14)
            else:
                return jsonify(
                    {"error": "Invalid strategy: " + strategy_name}
                ), 400

            df = strategy.generate_signals()

            bt = Backtester(
                df,
                initial_balance=initial_balance
            )

            final_value, trades, win_ratio, max_drawdown = bt.run()

            trade_list = [
                {
                    "action": a,
                    "price": round(float(p), 2),
                    "date": str(d)
                }
                for a, p, d in trades
            ]

            return jsonify({
                "symbol": symbol,
                "strategy": strategy_name,
                "initial_balance": initial_balance,
                "final_value": final_value,
                "profit_loss": round(
                    final_value - initial_balance, 2
                ),
                "profit_percent": round(
                    (final_value - initial_balance)
                    / initial_balance * 100,
                    2
                ),
                "total_trades": len(trades),
                "win_ratio": win_ratio,
                "max_drawdown": max_drawdown,
                "trades": trade_list,
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # Route from app(1).py
    @app.route("/backtest", methods=["POST"])
    @jwt_required()
    def run_backtest():
        try:
            current_user_id = get_jwt_identity()

            data = request.json
            symbol = data.get("symbol", "").strip().upper()
            strategy_name = data.get("strategy", "")
            period = data.get("period", "2y")
            interval = data.get("interval", "1d")
            initial_balance = float(
                data.get("initial_balance", 10000)
            )

            if not symbol:
                return jsonify({"error": "Symbol is required"}), 400

            df = fetch_from_yf(symbol, period, interval)

            if df.empty:
                return jsonify(
                    {"error": "No data found for " + symbol}
                ), 400

            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            df.columns = df.columns.str.lower()

            if strategy_name == "Golden Cross":
                strategy = GoldenCross(
                    df,
                    long_period=50,
                    short_period=20
                )
            elif strategy_name == "RSI":
                strategy = RSI_Strategy(df, period=14)
            else:
                return jsonify(
                    {"error": "Invalid strategy: " + strategy_name}
                ), 400

            df = strategy.generate_signals()

            backtester = Backtester(
                df,
                initial_balance=initial_balance
            )

            final_value, trades, win_ratio, max_drawdown = \
                backtester.run()

            return jsonify({
                "symbol": symbol,
                "strategy": strategy_name,
                "final_value": final_value,
                "total_trades": len(trades),
                "win_ratio": win_ratio,
                "max_drawdown": max_drawdown,
                "user_id": current_user_id
            })

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app


app = create_app()

if __name__ == "__main__":
    try:
        from websocket_server import start_ws_server
        start_ws_server(port=5001)
    except Exception:
        pass

    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000,
        use_reloader=False
    )
