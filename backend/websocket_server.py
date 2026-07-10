"""
websocket_server.py
--------------------
Runs on port 5001 (separate from Flask on 5000).
Two endpoints:
  ws://localhost:5001/ws/price/<symbol>   → streams latest price every 5s
  ws://localhost:5001/ws/signals          → pushes trade signals from live_engine
"""

import asyncio
import json
import threading
import time

import websockets
import yfinance as yf

from live.live_engine import signal_queue


# ── Price streamer ─────────────────────────────────────────────────────────
async def price_handler(websocket):
    """Streams latest price for a symbol every 5 seconds."""
    # get path from websocket object (works in websockets 12+)
    path = websocket.request.path if hasattr(websocket, 'request') else str(websocket.path if hasattr(websocket, 'path') else '/ws/price/RELIANCE.NS')
    
    # extract symbol from path: /ws/price/TSLA → TSLA
    parts = path.strip("/").split("/")
    symbol = parts[-1] if len(parts) >= 1 else "RELIANCE.NS"
    
    print(f"[WS] Price stream started for {symbol}")
    try:
        while True:
            try:
                ticker = yf.Ticker(symbol)
                info   = ticker.fast_info
                price  = float(info.last_price) if hasattr(info, "last_price") and info.last_price else None
                
                if price:
                    await websocket.send(json.dumps({
                        "symbol": symbol,
                        "price":  round(price, 4),
                        "time":   time.strftime("%H:%M:%S"),
                    }))
            except Exception as e:
                print(f"[WS] Price fetch error for {symbol}: {e}")
            
            await asyncio.sleep(5)
    except websockets.exceptions.ConnectionClosed:
        print(f"[WS] Price stream closed for {symbol}")


# ── Signal streamer ────────────────────────────────────────────────────────
async def signal_handler(websocket):
    """Pushes trade signals from live_engine's signal_queue."""
    print("[WS] Signal stream connected")
    try:
        while True:
            # check queue without blocking the event loop
            try:
                sig = signal_queue.get_nowait()
                await websocket.send(json.dumps(sig))
            except Exception:
                pass  # queue empty, keep waiting
            
            await asyncio.sleep(0.5)
    except websockets.exceptions.ConnectionClosed:
        print("[WS] Signal stream closed")


# ── Router — handles both endpoints ───────────────────────────────────────
async def router(websocket):
    """
    Routes incoming WebSocket connections to the correct handler
    based on the URL path.
    
    Compatible with websockets library v10, v11, v12, v13+
    """
    # get path — different attribute names in different versions
    try:
        path = websocket.request.path
    except AttributeError:
        try:
            path = websocket.path
        except AttributeError:
            path = "/ws/signals"

    print(f"[WS] New connection: {path}")

    if path.startswith("/ws/price/"):
        await price_handler(websocket)
    elif path == "/ws/signals":
        await signal_handler(websocket)
    else:
        print(f"[WS] Unknown path: {path}")
        await websocket.close()


# ── Server startup ─────────────────────────────────────────────────────────
def start_ws_server(port: int = 5001):
    """Starts the WebSocket server in a background thread."""
    def run():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        async def serve():
            print(f"[WS] WebSocket server starting on ws://localhost:{port}")
            async with websockets.serve(router, "0.0.0.0", port):
                print(f"[WS] WebSocket server running on port {port}")
                await asyncio.Future()  # run forever

        loop.run_until_complete(serve())

    t = threading.Thread(target=run, daemon=True)
    t.start()
    print(f"[WS] WebSocket thread started on port {port}")


if __name__ == "__main__":
    start_ws_server()
    # keep main thread alive for testing
    while True:
        time.sleep(1)