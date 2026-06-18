"""
routes/algo.py
--------------
POST /algo/bot/start    → start the bot
POST /algo/bot/pause    → pause
POST /algo/bot/resume   → resume from pause
POST /algo/bot/stop     → stop
GET  /algo/bot/status   → get current bot state
GET  /algo/signals      → drain signal queue (polling fallback for WebSocket)
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
import engine

algo_bp = Blueprint("algo", __name__, url_prefix="/algo")


@algo_bp.route("/bot/start", methods=["POST"])
@jwt_required()
def start():
    """
    Body:
    {
      "symbol":      "AAPL",
      "algoId":      "golden_cross",
      "algoName":    "Golden Crossover",
      "qty":         1,
      "intervalSec": 60       (optional, how often to check signal)
    }
    """
    body         = request.get_json(silent=True) or {}
    symbol       = body.get("symbol", "").strip().upper()
    algo_id      = body.get("algoId", "").strip()
    algo_name    = body.get("algoName", algo_id)
    qty          = int(body.get("qty", 1))
    interval_sec = int(body.get("intervalSec", 60))

    if not symbol:
        return jsonify({"error": "symbol is required"}), 400
    if not algo_id:
        return jsonify({"error": "algoId is required"}), 400

    result = engine.start_bot(
        symbol=symbol,
        algo_id=algo_id,
        algo_name=algo_name,
        qty=qty,
        interval_sec=interval_sec,
    )
    status = 200 if result["ok"] else 409
    return jsonify(result), status


@algo_bp.route("/bot/pause", methods=["POST"])
@jwt_required()
def pause():
    result = engine.pause_bot()
    return jsonify(result), 200 if result["ok"] else 409


@algo_bp.route("/bot/resume", methods=["POST"])
@jwt_required()
def resume():
    result = engine.resume_bot()
    return jsonify(result), 200 if result["ok"] else 409


@algo_bp.route("/bot/stop", methods=["POST"])
@jwt_required()
def stop():
    result = engine.stop_bot()
    return jsonify(result)


@algo_bp.route("/bot/status", methods=["GET"])
@jwt_required()
def bot_status():
    state = engine.get_status()
    return jsonify(state)


@algo_bp.route("/signals", methods=["GET"])
@jwt_required()
def drain_signals():
    """
    Polling fallback — returns up to 50 buffered signals and clears them.
    Frontend should prefer WebSocket /ws/signals instead.
    """
    items = []
    try:
        while not engine.signal_queue.empty() and len(items) < 50:
            items.append(engine.signal_queue.get_nowait())
    except Exception:
        pass
    return jsonify({"signals": items})