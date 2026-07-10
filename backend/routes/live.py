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
    data     = request.get_json() or {}
    symbol   = data.get("symbol")
    strategy = data.get("strategy")
    live_engine.stop(symbol=symbol, strategy_name=strategy)
    return jsonify({"success": True, 
                    "message": "Stopped"})


@live_bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    engines_list = [
        {"symbol": s["symbol"], "strategy": s["strategy_name"], "running": s["running"]}
        for s in live_engine.engines.values()
    ]
    return jsonify({
        "running":  len(live_engine.engines) > 0,
        "engines":  engines_list,
        "symbol":   engines_list[0]["symbol"]   if engines_list else None,
        "strategy": engines_list[0]["strategy"] if engines_list else None,
        "qty":      1,
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


@live_bp.route("/inject-test", methods=["POST"])
@jwt_required()
def inject_test():
    data     = request.get_json() or {}
    symbol   = data.get("symbol", "RELIANCE.NS")
    strategy = data.get("strategy", "RSI")
    live_engine.inject_test_trade(symbol, strategy)
    return jsonify({"ok": True, "message": f"Test trade injected for {symbol}"})