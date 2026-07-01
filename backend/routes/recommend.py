from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import pandas as pd

from data_fetcher import fetch_from_yf
from recommender import get_recommendation, get_recommendation_ml

recommend_bp = Blueprint("recommend", __name__)


def _fetch_clean_df(symbol, period, interval):
    df = fetch_from_yf(symbol, period, interval)
    if df.empty:
        return None
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    df.columns = df.columns.str.lower()
    return df


@recommend_bp.route("/recommend", methods=["POST"])
@jwt_required()
def recommend():
    try:
        current_user_id = get_jwt_identity()
        data = request.json

        symbol          = data.get("symbol", "").strip().upper()
        initial_balance = float(data.get("initial_balance", 10000))
        period          = data.get("period", "2y")
        interval        = data.get("interval", "1d")

        if not symbol:
            return jsonify({"error": "Symbol is required"}), 400

        df = _fetch_clean_df(symbol, period, interval)
        if df is None:
            return jsonify({"error": "No data found for " + symbol}), 400

        result = get_recommendation(df, initial_balance)
        if "error" in result:
            return jsonify(result), 400

        return jsonify({"symbol": symbol, **result})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


@recommend_bp.route("/recommend-ml", methods=["POST"])
@jwt_required()
def recommend_ml():
    try:
        current_user_id = get_jwt_identity()
        data = request.json

        symbol          = data.get("symbol", "").strip().upper()
        initial_balance = float(data.get("initial_balance", 10000))
        period          = data.get("period", "2y")
        interval        = data.get("interval", "1d")

        if not symbol:
            return jsonify({"error": "Symbol is required"}), 400

        df = _fetch_clean_df(symbol, period, interval)
        if df is None:
            return jsonify({"error": "No data found for " + symbol}), 400

        result = get_recommendation_ml(df, initial_balance)
        if "error" in result:
            return jsonify(result), 400

        return jsonify({"symbol": symbol, **result})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500