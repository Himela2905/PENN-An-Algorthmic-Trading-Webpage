"""
engine.py
---------
The live trading bot engine.
- Runs in a background thread when started
- Polls yfinance data at a set interval
- Runs the selected algorithm's signal logic
- Auto-places BUY/SELL orders via Fyers when a signal fires
- Emits signal events to a shared queue (consumed by WebSocket /ws/signals)
- Tracks its own state: RUNNING | PAUSED | STOPPED
"""

import threading
import time
import queue
from datetime import datetime
from services.yfinance_service import get_market_data
from services.indicator_service import get_latest_signal
from services.fyers_service import place_order, load_token

# ── Shared state ───────────────────────────────────────────────────────────
_lock   = threading.Lock()
_state  = {
    "status":      "STOPPED",     # RUNNING | PAUSED | STOPPED
    "symbol":      None,
    "algo_id":     None,
    "algo_name":   None,
    "position":    0,              # 0 = flat, 1 = long, -1 = short
    "entry_price": 0.0,
    "qty":         1,
    "trades_today":0,
    "pnl_today":   0.0,
    "started_at":  None,
    "last_signal": None,
    "last_checked":None,
}

# Signal queue — WebSocket server reads from this
signal_queue: queue.Queue = queue.Queue(maxsize=500)

_bot_thread: threading.Thread | None = None
_stop_event: threading.Event         = threading.Event()


# ── Public API ─────────────────────────────────────────────────────────────

def start_bot(symbol: str, algo_id: str, algo_name: str,
              qty: int = 1, interval_sec: int = 60) -> dict:
    global _bot_thread, _stop_event

    with _lock:
        if _state["status"] == "RUNNING":
            return {"ok": False, "message": "Bot is already running"}

        _stop_event.clear()
        _state.update({
            "status":       "RUNNING",
            "symbol":       symbol,
            "algo_id":      algo_id,
            "algo_name":    algo_name,
            "qty":          qty,
            "trades_today": 0,
            "pnl_today":    0.0,
            "position":     0,
            "entry_price":  0.0,
            "started_at":   datetime.utcnow().isoformat(),
            "last_signal":  None,
        })

    _bot_thread = threading.Thread(
        target=_bot_loop,
        args=(symbol, algo_id, qty, interval_sec),
        daemon=True,
        name="BotEngine",
    )
    _bot_thread.start()

    _push_signal("AI", symbol, "INFO",
                 f"Bot started — {algo_name} on {symbol} | qty={qty} | interval={interval_sec}s")

    return {"ok": True, "message": f"Bot started: {algo_name} on {symbol}"}


def pause_bot() -> dict:
    with _lock:
        if _state["status"] != "RUNNING":
            return {"ok": False, "message": "Bot is not running"}
        _state["status"] = "PAUSED"
    _push_signal("System", _state["symbol"] or "—", "INFO", "Bot paused")
    return {"ok": True, "message": "Bot paused"}


def resume_bot() -> dict:
    with _lock:
        if _state["status"] != "PAUSED":
            return {"ok": False, "message": "Bot is not paused"}
        _state["status"] = "RUNNING"
    _push_signal("System", _state["symbol"] or "—", "INFO", "Bot resumed")
    return {"ok": True, "message": "Bot resumed"}


def stop_bot() -> dict:
    global _bot_thread
    _stop_event.set()
    with _lock:
        _state["status"] = "STOPPED"
    if _bot_thread and _bot_thread.is_alive():
        _bot_thread.join(timeout=5)
    _push_signal("System", _state["symbol"] or "—", "INFO", "Bot stopped")
    return {"ok": True, "message": "Bot stopped"}


def get_status() -> dict:
    with _lock:
        return dict(_state)


# ── Internal bot loop ──────────────────────────────────────────────────────

def _bot_loop(symbol: str, algo_id: str, qty: int, interval_sec: int):
    print(f"[engine] Bot loop started: {algo_id} on {symbol}")

    while not _stop_event.is_set():
        try:
            with _lock:
                status = _state["status"]

            if status == "PAUSED":
                time.sleep(2)
                continue

            if status != "RUNNING":
                break

            # ── 1. Fetch latest data ────────────────────────────────────
            df = get_market_data(symbol, period="60d", interval="1d")
            if df.empty:
                _push_signal(algo_id, symbol, "WARN",
                             f"No data for {symbol} — skipping tick")
                time.sleep(interval_sec)
                continue

            # ── 2. Run signal ───────────────────────────────────────────
            result = get_latest_signal(algo_id, df)
            signal = result["signal"]
            price  = result["price"]

            with _lock:
                _state["last_checked"] = datetime.utcnow().isoformat()
                _state["last_signal"]  = signal

            now = datetime.now().strftime("%H:%M:%S")

            # ── 3. Act on signal ────────────────────────────────────────
            with _lock:
                current_pos = _state["position"]

            if signal == 1 and current_pos == 0:
                # BUY signal and we're flat
                _push_signal(algo_id, symbol, "BUY",
                             f"{algo_id.upper()} BUY signal | {symbol} @ {price:.2f} | Placing order...")
                try:
                    token = load_token()
                    if token:
                        order_resp = place_order(
                            symbol=symbol,
                            side="BUY",
                            qty=qty,
                            order_type="MARKET",
                            access_token=token,
                        )
                        with _lock:
                            _state["position"]     = 1
                            _state["entry_price"]  = price
                            _state["trades_today"] += 1
                        _push_signal(algo_id, symbol, "BUY",
                                     f"ORDER PLACED: BUY {qty}×{symbol} @ {price:.2f} | ID: {order_resp.get('orderId','?')}")
                    else:
                        # No token — paper trade mode
                        with _lock:
                            _state["position"]    = 1
                            _state["entry_price"] = price
                            _state["trades_today"] += 1
                        _push_signal(algo_id, symbol, "INFO",
                                     f"[PAPER] BUY {qty}×{symbol} @ {price:.2f} (no Fyers token)")

                except Exception as e:
                    _push_signal(algo_id, symbol, "WARN",
                                 f"Order failed: {e}")

            elif signal == -1 and current_pos == 1:
                # SELL signal and we hold a long
                with _lock:
                    entry = _state["entry_price"]

                trade_pnl = (price - entry) * qty
                _push_signal(algo_id, symbol, "SELL",
                             f"{algo_id.upper()} SELL signal | {symbol} @ {price:.2f} | P&L: {'+' if trade_pnl >= 0 else ''}{trade_pnl:.2f}")
                try:
                    token = load_token()
                    if token:
                        order_resp = place_order(
                            symbol=symbol,
                            side="SELL",
                            qty=qty,
                            order_type="MARKET",
                            access_token=token,
                        )
                        with _lock:
                            _state["position"]   = 0
                            _state["pnl_today"] += trade_pnl
                            _state["trades_today"] += 1
                        _push_signal(algo_id, symbol, "SELL",
                                     f"ORDER PLACED: SELL {qty}×{symbol} @ {price:.2f} | ID: {order_resp.get('orderId','?')}")
                    else:
                        with _lock:
                            _state["position"]   = 0
                            _state["pnl_today"] += trade_pnl
                            _state["trades_today"] += 1
                        _push_signal(algo_id, symbol, "INFO",
                                     f"[PAPER] SELL {qty}×{symbol} @ {price:.2f} | P&L: {trade_pnl:.2f}")

                except Exception as e:
                    _push_signal(algo_id, symbol, "WARN",
                                 f"Order failed: {e}")

            else:
                # No actionable signal
                sig_label = "BUY" if signal == 1 else "SELL" if signal == -1 else "NEUTRAL"
                _push_signal(algo_id, symbol, "INFO",
                             f"Signal: {sig_label} | {symbol} @ {price:.2f} | pos={current_pos} | no action")

        except Exception as e:
            print(f"[engine] Loop error: {e}")
            _push_signal("System", symbol, "WARN", f"Bot loop error: {e}")

        # Wait for next tick
        _stop_event.wait(timeout=interval_sec)

    print("[engine] Bot loop exited")


# ── Signal emitter ─────────────────────────────────────────────────────────

def _push_signal(algo: str, symbol: str, sig_type: str, message: str):
    item = {
        "id":      f"{time.time_ns()}",
        "time":    datetime.now().strftime("%H:%M:%S"),
        "algo":    algo,
        "symbol":  symbol,
        "type":    sig_type,
        "message": message,
    }
    try:
        signal_queue.put_nowait(item)
    except queue.Full:
        signal_queue.get_nowait()   # drop oldest
        signal_queue.put_nowait(item)
    print(f"[signal] [{sig_type}] {message}")