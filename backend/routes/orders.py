"""
routes/orders.py
----------------
POST /orders/place          → place a new order via Fyers
PUT  /orders/<id>/modify    → modify an open order
DELETE /orders/<id>         → cancel an order
GET  /orders                → fetch order book
GET  /orders/positions      → fetch net positions
GET  /orders/holdings       → fetch holdings
GET  /orders/funds          → fetch available funds
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from services.fyers_service import (
    place_order, modify_order, cancel_order,
    get_orders, get_positions, get_holdings, get_funds, load_token,
)

orders_bp = Blueprint("orders", __name__, url_prefix="/orders")


def _token():
    """Pull Fyers token from saved file."""
    t = load_token()
    if not t:
        raise RuntimeError("Not authenticated with Fyers. Please login first.")
    return t


@orders_bp.route("", methods=["GET"])
@jwt_required()
def list_orders():
    try:
        orders = get_orders(_token())
        return jsonify({"orders": orders})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@orders_bp.route("/place", methods=["POST"])
@jwt_required()
def place():
    """
    Body:
    {
      "symbol":      "AAPL",
      "side":        "BUY" | "SELL",
      "qty":         100,
      "orderType":   "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT",
      "limitPrice":  0.0,        (optional)
      "stopPrice":   0.0,        (optional)
      "productType": "INTRADAY"  (optional, default INTRADAY)
    }
    """
    body = request.get_json(silent=True) or {}

    symbol      = body.get("symbol", "").strip().upper()
    side        = body.get("side", "").strip().upper()
    qty         = int(body.get("qty", 1))
    order_type  = body.get("orderType", "MARKET").strip().upper()
    limit_price = float(body.get("limitPrice", 0) or 0)
    stop_price  = float(body.get("stopPrice", 0) or 0)
    product     = body.get("productType", "INTRADAY").strip().upper()

    if not symbol:
        return jsonify({"error": "symbol is required"}), 400
    if side not in ("BUY", "SELL"):
        return jsonify({"error": "side must be BUY or SELL"}), 400
    if qty <= 0:
        return jsonify({"error": "qty must be > 0"}), 400

    try:
        result = place_order(
            symbol=symbol,
            side=side,
            qty=qty,
            order_type=order_type,
            limit_price=limit_price,
            stop_price=stop_price,
            product_type=product,
            access_token=_token(),
        )
        return jsonify(result), 201
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@orders_bp.route("/<order_id>/modify", methods=["PUT"])
@jwt_required()
def modify(order_id: str):
    body        = request.get_json(silent=True) or {}
    qty         = body.get("qty")
    limit_price = body.get("limitPrice")
    try:
        result = modify_order(order_id, qty=qty, limit_price=limit_price,
                              access_token=_token())
        return jsonify(result)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@orders_bp.route("/<order_id>", methods=["DELETE"])
@jwt_required()
def cancel(order_id: str):
    try:
        result = cancel_order(order_id, access_token=_token())
        return jsonify(result)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@orders_bp.route("/positions", methods=["GET"])
@jwt_required()
def positions():
    try:
        data = get_positions(_token())
        return jsonify({"positions": data})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@orders_bp.route("/holdings", methods=["GET"])
@jwt_required()
def holdings():
    try:
        data = get_holdings(_token())
        return jsonify({"holdings": data})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@orders_bp.route("/funds", methods=["GET"])
@jwt_required()
def funds():
    try:
        data = get_funds(_token())
        return jsonify({"funds": data})
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500