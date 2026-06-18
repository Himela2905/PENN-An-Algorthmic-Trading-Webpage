"""
websocket_server.py
-------------------
Standalone WebSocket server (runs alongside Flask on port 5001).
Two channels:
  ws://localhost:5001/ws/price/<symbol>   → streams live price ticks every ~1s
  ws://localhost:5001/ws/signals          → streams bot signals from engine queue

Start this in a separate process or thread alongside Flask:
  python websocket_server.py
Or import and call start_ws_server() in app.py after app creation.
"""

import asyncio
import json
import threading
import time
from datetime import datetime

import websockets
from services.yfinance_service import get_quote
import engine

# ── Price broadcaster ──────────────────────────────────────────────────────

PRICE_CLIENTS: dict[str, set] = {}   # symbol → set of websockets
SIGNAL_CLIENTS: set            = set()
_ws_lock = threading.Lock()


async def price_handler(websocket, path: str):
    """
    Path format: /ws/price/AAPL
    Sends { symbol, price, change, changePct, time } every second.
    """
    parts  = path.strip("/").split("/")
    symbol = parts[-1].upper() if parts else ""

    if not symbol:
        await websocket.close(1008, "No symbol in path")
        return

    print(f"[ws] Price client connected: {symbol}")
    with _ws_lock:
        PRICE_CLIENTS.setdefault(symbol, set()).add(websocket)

    try:
        while True:
            try:
                quote = get_quote(symbol)
                if quote:
                    payload = {**quote, "time": datetime.now().strftime("%H:%M:%S")}
                    await websocket.send(json.dumps(payload))
            except Exception as e:
                print(f"[ws] Price fetch error {symbol}: {e}")

            await asyncio.sleep(1.5)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        with _ws_lock:
            PRICE_CLIENTS.get(symbol, set()).discard(websocket)
        print(f"[ws] Price client disconnected: {symbol}")


async def signal_handler(websocket, path: str):
    """
    Path: /ws/signals
    Drains engine.signal_queue and pushes each item to all connected clients.
    """
    print("[ws] Signal client connected")
    with _ws_lock:
        SIGNAL_CLIENTS.add(websocket)

    try:
        while True:
            # Drain up to 10 signals per tick
            for _ in range(10):
                try:
                    item = engine.signal_queue.get_nowait()
                    await websocket.send(json.dumps(item))
                except Exception:
                    break
            await asyncio.sleep(0.5)

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        with _ws_lock:
            SIGNAL_CLIENTS.discard(websocket)
        print("[ws] Signal client disconnected")


async def router(websocket, path: str):
    """Route incoming WebSocket connections by path."""
    if path.startswith("/ws/price/"):
        await price_handler(websocket, path)
    elif path.startswith("/ws/signals"):
        await signal_handler(websocket, path)
    else:
        await websocket.close(1008, f"Unknown path: {path}")


def run_ws_server(host: str = "0.0.0.0", port: int = 5001):
    """Blocking call — run this in a daemon thread."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    async def _serve():
        print(f"[ws] WebSocket server listening on ws://{host}:{port}")
        async with websockets.serve(router, host, port):
            await asyncio.Future()   # run forever

    loop.run_until_complete(_serve())


def start_ws_server(host: str = "0.0.0.0", port: int = 5001):
    """Launch WebSocket server in a background daemon thread."""
    t = threading.Thread(target=run_ws_server, args=(host, port), daemon=True, name="WSServer")
    t.start()
    print(f"[ws] WebSocket server thread started on port {port}")
    return t


if __name__ == "__main__":
    run_ws_server()