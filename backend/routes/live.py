from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from live.live_engine import live_engine

live_bp = Blueprint(
    "live",
    __name__,
    url_prefix="/live"
)


@live_bp.route("/start", methods=["POST"])
@jwt_required()
def start_live():

    data = request.get_json() or {}

    symbol = data.get("symbol")
    strategy = data.get("strategy")
    qty = int(data.get("qty", 1))

    if not symbol:
        return jsonify({
            "error": "symbol required"
        }), 400

    if not strategy:
        return jsonify({
            "error": "strategy required"
        }), 400

    live_engine.start(
        symbol=symbol,
        strategy_name=strategy,
        qty=qty
    )

    return jsonify({
        "success": True,
        "message": "Live trading started",
        "symbol": symbol,
        "strategy": strategy
    })


@live_bp.route("/stop", methods=["POST"])
@jwt_required()
def stop_live():

    live_engine.stop()

    return jsonify({
        "success": True,
        "message": "Live trading stopped"
    })


@live_bp.route("/status", methods=["GET"])
@jwt_required()
def status():

    return jsonify({
        "running": live_engine.running,
        "symbol": live_engine.symbol,
        "strategy": live_engine.strategy_name,
        "qty": live_engine.qty
    })


@live_bp.route("/positions", methods=["GET"])
@jwt_required()
def positions():

    return jsonify({
        "positions": live_engine.positions
    })


@live_bp.route("/trades", methods=["GET"])
@jwt_required()
def trades():

    return jsonify({
        "trades": live_engine.trade_history
    })


@live_bp.route("/pnl", methods=["GET"])
@jwt_required()
def pnl():

    return jsonify(
        live_engine.get_pnl()
    )


@live_bp.route("/stats")
@jwt_required()
def stats():

    return jsonify(
        live_engine.get_stats()
    )
