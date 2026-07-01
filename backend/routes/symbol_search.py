"""
routes/symbol_search.py
-------------------------
GET /search?q=reliance  →  returns matching stocks with company names

Uses yfinance's built-in Search() — no database, no static file needed.
Works for both Indian (NSE) and US/global stocks in one call.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import yfinance as yf

search_bp = Blueprint("search", __name__)


@search_bp.route("/search", methods=["GET"])
@jwt_required()
def search_symbols():
    query = request.args.get("q", "").strip()

    if not query or len(query) < 2:
        return jsonify({"results": []})

    try:
        results = yf.Search(query, max_results=10)
        quotes = results.quotes or []

        formatted = []
        for q in quotes:
            symbol     = q.get("symbol", "")
            short_name = q.get("shortname") or q.get("longname") or symbol
            exchange   = q.get("exchange", "")
            quote_type = q.get("quoteType", "")

            # only show actual tradable equities, skip crypto/options noise
            if quote_type not in ("EQUITY", ""):
                continue

            formatted.append({
                "symbol":      symbol,
                "name":        short_name,
                "exchange":    exchange,
            })

        return jsonify({"results": formatted})

    except Exception as e:
        print(f"[search] yfinance search failed: {e}")
        # fail gracefully — empty results, not a crash
        return jsonify({"results": [], "warning": "Search temporarily unavailable"})