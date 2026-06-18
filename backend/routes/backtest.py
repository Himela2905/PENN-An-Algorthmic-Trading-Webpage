"""
routes/backtest.py
------------------
POST /backtest/run      → single algorithm backtest
POST /backtest/ai-rank  → run all 20 algos, score, return ranked list
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import pandas as pd

from services.yfinance_service import get_market_data
from services.ranking_service  import rank_algorithms
from services.indicator_service import run_strategy, STRATEGY_MAP
from backtester import Backtester

backtest_bp = Blueprint("backtest", __name__, url_prefix="/backtest")


@backtest_bp.route("/run", methods=["POST"])
@jwt_required()
def run_single():
    """
    Run one algorithm backtest.
    Body:
    {
      "symbol":         "AAPL",
      "algoId":         "golden_cross",
      "period":         "2y",       (optional)
      "interval":       "1d",       (optional)
      "initialBalance": 10000       (optional)
    }
    Returns full backtest result + equity curve.
    """
    body    = request.get_json(silent=True) or {}
    symbol  = body.get("symbol", "").strip().upper()
    algo_id = body.get("algoId", "").strip()
    period  = body.get("period", "2y")
    interval= body.get("interval", "1d")
    balance = float(body.get("initialBalance", 10000))

    if not symbol:
        return jsonify({"error": "symbol is required"}), 400
    if not algo_id:
        return jsonify({"error": "algoId is required"}), 400
    if algo_id not in STRATEGY_MAP:
        return jsonify({"error": f"Unknown algoId: {algo_id}"}), 400

    try:
        df = get_market_data(symbol, period=period, interval=interval)
        if df.empty:
            return jsonify({"error": f"No data for {symbol}"}), 400

        df = run_strategy(algo_id, df)

        bt = Backtester(df, initial_balance=balance)
        final_val, trades, win_ratio, max_dd = bt.run()

        total_return = round((final_val - balance) / balance * 100, 2)

        # Build equity curve
        equity_curve = []
        bal = balance; pos = 0.0
        for i, row in df.iterrows():
            try:
                sig   = int(row["signal"]) if not pd.isna(row.get("signal", 0)) else 0
                price = float(row["close"])
                if sig == 1 and pos == 0:
                    pos = bal / price; bal = 0
                elif sig == -1 and pos > 0:
                    bal = pos * price;  pos = 0
                equity_curve.append({"date": str(i), "value": round(bal + pos * price, 2)})
            except Exception:
                continue

        # Sharpe
        import numpy as np
        vals    = pd.Series([e["value"] for e in equity_curve])
        rets    = vals.pct_change().dropna()
        sharpe  = round(float(rets.mean() / rets.std() * np.sqrt(252)), 2) if rets.std() > 0 else 0.0

        # Score
        from services.ranking_service import _compute_score
        score = _compute_score(total_return, sharpe, max_dd, win_ratio, len(trades))

        trade_list = [
            {"action": a, "price": round(float(p), 2), "date": str(d)}
            for a, p, d in trades
        ]

        return jsonify({
            "algoId":         algo_id,
            "symbol":         symbol,
            "initialBalance": balance,
            "finalValue":     round(final_val, 2),
            "totalReturn":    total_return,
            "sharpe":         sharpe,
            "maxDrawdown":    round(abs(max_dd), 2),
            "winRate":        win_ratio,
            "numTrades":      len(trades),
            "score":          score,
            "trades":         trade_list,
            "equityCurve":    equity_curve,
        })

    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@backtest_bp.route("/ai-rank", methods=["POST"])
@jwt_required()
def ai_rank():
    """
    Run all 20 algorithms on a symbol, score each, return ranked list.
    Body:
    {
      "symbol":         "AAPL",
      "period":         "2y",   (optional)
      "interval":       "1d",   (optional)
      "initialBalance": 10000   (optional)
    }
    This can take 10–30s depending on data size.
    Returns the same shape as the frontend Algorithm[] type, with score + rank added.
    """
    body    = request.get_json(silent=True) or {}
    symbol  = body.get("symbol", "").strip().upper()
    period  = body.get("period", "2y")
    interval= body.get("interval", "1d")
    balance = float(body.get("initialBalance", 10000))

    if not symbol:
        return jsonify({"error": "symbol is required"}), 400

    try:
        ranked = rank_algorithms(
            symbol=symbol,
            period=period,
            interval=interval,
            initial_balance=balance,
        )
        return jsonify({
            "symbol":     symbol,
            "algorithms": ranked,
            "top":        ranked[0] if ranked else None,
        })
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({"error": str(e)}), 500