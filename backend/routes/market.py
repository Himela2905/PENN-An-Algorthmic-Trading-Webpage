"""
routes/market.py
----------------
GET /market/quote/<symbol>          → single quote
GET /market/candles/<symbol>?tf=15m → OHLCV candles for chart
POST /market/watchlist              → batch quotes { symbols: [...] }
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from services.yfinance_service import get_quote, get_candles, get_multi_quote

market_bp = Blueprint("market", __name__, url_prefix="/market")


@market_bp.route("/quote/<symbol>")
@jwt_required()
def quote(symbol: str):
    """Latest price, change, changePct for a single symbol."""
    data = get_quote(symbol.upper())
    if not data:
        return jsonify({"error": f"No data for {symbol}"}), 404
    return jsonify(data)


@market_bp.route("/candles/<symbol>")
@jwt_required()
def candles(symbol: str):
    """
    OHLCV candles for the chart.
    Query param: ?tf=15m  (1m | 5m | 15m | 1h | 4h | 1D)
    """
    tf   = request.args.get("tf", "15m")
    data = get_candles(symbol.upper(), tf=tf)
    if not data:
        return jsonify({"error": f"No candles for {symbol}"}), 404
    return jsonify({"symbol": symbol.upper(), "tf": tf, "candles": data})


@market_bp.route("/watchlist", methods=["POST"])
@jwt_required()
def watchlist():
    """
    Batch quote fetch.
    Body: { "symbols": ["AAPL", "NVDA", "TSLA", ...] }
    """
    body    = request.get_json(silent=True) or {}
    symbols = body.get("symbols", [])
    if not symbols:
        return jsonify({"error": "symbols list required"}), 400

    data = get_multi_quote(symbols)
    return jsonify({"quotes": data})