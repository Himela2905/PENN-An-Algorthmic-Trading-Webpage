"""
fyers_service.py
----------------
Thin wrapper around fyers-apiv3.
Handles: token storage/load, session creation, order placement,
         order book, positions, holdings, profile.
"""

import os
import json
import hashlib
from pathlib import Path
from datetime import datetime

from fyers_apiv3 import fyersModel                    
from fyers_apiv3.FyersWebsocket import data_ws        # type: ignore
from dotenv import load_dotenv

load_dotenv()

APP_ID       = os.getenv("FYERS_APP_ID", "")
SECRET_KEY   = os.getenv("FYERS_SECRET_KEY", "")
REDIRECT_URI = os.getenv("FYERS_REDIRECT_URI", "http://localhost:5000/auth/fyers/callback")
TOKEN_FILE   = Path(os.getenv("TOKEN_FILE", ".fyers_token.json"))

# ── Token persistence ──────────────────────────────────────────────────────

def save_token(access_token: str) -> None:
    TOKEN_FILE.write_text(json.dumps({
        "access_token": access_token,
        "saved_at":     datetime.utcnow().isoformat(),
    }))


def load_token() -> str | None:
    if TOKEN_FILE.exists():
        try:
            data = json.loads(TOKEN_FILE.read_text())
            return data.get("access_token")
        except Exception:
            return None
    return None


def clear_token() -> None:
    if TOKEN_FILE.exists():
        TOKEN_FILE.unlink()


# ── Session factory ────────────────────────────────────────────────────────

def get_fyers(access_token: str | None = None) -> fyersModel.FyersModel:
    token = access_token or load_token()
    if not token:
        raise RuntimeError("No Fyers access token. Please authenticate first.")
    return fyersModel.FyersModel(
        client_id=APP_ID,
        token=token,
        log_path="",          # suppress file logs
        is_async=False,
    )


# ── Auth helpers ───────────────────────────────────────────────────────────

def get_auth_url() -> str:
    """Build the Fyers OAuth URL to redirect the user to."""
    session = fyersModel.SessionModel(
        client_id=APP_ID,
        secret_key=SECRET_KEY,
        redirect_uri=REDIRECT_URI,
        response_type="code",
        grant_type="authorization_code",
    )
    return session.generate_authcode()


def exchange_code_for_token(auth_code: str) -> str:
    """Exchange OAuth auth_code for access_token. Saves to file."""
    session = fyersModel.SessionModel(
        client_id=APP_ID,
        secret_key=SECRET_KEY,
        redirect_uri=REDIRECT_URI,
        response_type="code",
        grant_type="authorization_code",
    )
    session.set_token(auth_code)
    resp = session.generate_token()

    if resp.get("s") != "ok":
        raise RuntimeError(f"Token exchange failed: {resp}")

    access_token = resp["access_token"]
    save_token(access_token)
    return access_token


# ── Market data ────────────────────────────────────────────────────────────

def get_fyers_quote(symbol: str, access_token: str | None = None) -> dict:
    """
    symbol format for Fyers: NSE:AAPL-EQ  or  NSE:NIFTY50-INDEX
    For equities passed from frontend (e.g. 'AAPL') we prefix NSE: and suffix -EQ.
    """
    fyers      = get_fyers(access_token)
    fyers_sym  = _to_fyers_symbol(symbol)
    resp       = fyers.quotes(data={"symbols": fyers_sym})

    if resp.get("s") != "ok":
        raise RuntimeError(f"Quote failed: {resp}")

    d = resp["d"][0]["v"]
    return {
        "symbol":    symbol.upper(),
        "price":     d.get("lp", 0),
        "open":      d.get("open_price", 0),
        "high":      d.get("high_price", 0),
        "low":       d.get("low_price", 0),
        "close":     d.get("prev_close_price", 0),
        "volume":    d.get("volume", 0),
        "change":    d.get("ch", 0),
        "changePct": d.get("chp", 0),
    }


def _to_fyers_symbol(symbol: str) -> str:
    """Convert plain ticker to Fyers symbol format."""
    sym = symbol.upper().replace("/", "-")
    if ":" in sym:
        return sym
    if "-" in sym and any(c.isdigit() for c in sym):
        return f"NSE:{sym}"
    return f"NSE:{sym}-EQ"


# ── Orders ────────────────────────────────────────────────────────────────

# Fyers order type constants
ORDER_TYPE_MAP = {
    "MARKET":     2,
    "LIMIT":      1,
    "STOP":       3,
    "STOP_LIMIT": 4,
}

SIDE_MAP = {
    "BUY":  1,
    "SELL": -1,
}


def place_order(
    symbol: str,
    side: str,          # "BUY" | "SELL"
    qty: int,
    order_type: str,    # "MARKET" | "LIMIT" | "STOP" | "STOP_LIMIT"
    limit_price: float  = 0.0,
    stop_price: float   = 0.0,
    product_type: str   = "INTRADAY",   # "INTRADAY" | "CNC" | "MARGIN"
    access_token: str | None = None,
) -> dict:
    fyers      = get_fyers(access_token)
    fyers_sym  = _to_fyers_symbol(symbol)

    data = {
        "symbol":       fyers_sym,
        "qty":          qty,
        "type":         ORDER_TYPE_MAP.get(order_type, 2),
        "side":         SIDE_MAP.get(side, 1),
        "productType":  product_type,
        "limitPrice":   limit_price,
        "stopPrice":    stop_price,
        "validity":     "DAY",
        "disclosedQty": 0,
        "offlineOrder": False,
    }

    resp = fyers.place_order(data=data)

    if resp.get("s") != "ok":
        raise RuntimeError(f"Order placement failed: {resp.get('message', resp)}")

    return {
        "orderId":   resp.get("id", ""),
        "message":   resp.get("message", "Order placed"),
        "status":    "PENDING",
        "symbol":    symbol,
        "side":      side,
        "qty":       qty,
        "orderType": order_type,
    }


def modify_order(order_id: str, qty: int = None, limit_price: float = None,
                 access_token: str | None = None) -> dict:
    fyers = get_fyers(access_token)
    data  = {"id": order_id}
    if qty          is not None: data["qty"]        = qty
    if limit_price  is not None: data["limitPrice"] = limit_price

    resp = fyers.modify_order(data=data)
    if resp.get("s") != "ok":
        raise RuntimeError(f"Modify order failed: {resp}")
    return {"orderId": order_id, "message": "Order modified"}


def cancel_order(order_id: str, access_token: str | None = None) -> dict:
    fyers = get_fyers(access_token)
    resp  = fyers.cancel_order(data={"id": order_id})
    if resp.get("s") != "ok":
        raise RuntimeError(f"Cancel order failed: {resp}")
    return {"orderId": order_id, "message": "Order cancelled"}


def get_orders(access_token: str | None = None) -> list:
    fyers = get_fyers(access_token)
    resp  = fyers.orderbook()
    if resp.get("s") != "ok":
        return []

    orders = []
    for o in resp.get("orderBook", []):
        side_val = o.get("side", 1)
        type_val = o.get("type", 2)
        orders.append({
            "id":      o.get("id", ""),
            "symbol":  o.get("symbol", "").replace("NSE:", "").replace("-EQ", ""),
            "side":    "BUY" if side_val == 1 else "SELL",
            "type":    {1: "LIMIT", 2: "MARKET", 3: "STOP", 4: "STOP_LIMIT"}.get(type_val, "MARKET"),
            "qty":     o.get("qty", 0),
            "price":   o.get("limitPrice", 0) or o.get("tradedPrice", 0),
            "filled":  o.get("filledQty", 0),
            "status":  _map_order_status(o.get("status", 6)),
            "time":    o.get("orderDateTime", ""),
        })
    return orders


def _map_order_status(code: int) -> str:
    return {1: "CANCELLED", 2: "FILLED", 4: "PENDING", 5: "PARTIAL", 6: "PENDING"}.get(code, "PENDING")


# ── Positions & Holdings ──────────────────────────────────────────────────

def get_positions(access_token: str | None = None) -> list:
    fyers = get_fyers(access_token)
    resp  = fyers.positions()
    if resp.get("s") != "ok":
        return []

    positions = []
    for p in resp.get("netPositions", []):
        qty = p.get("netQty", 0)
        if qty == 0:
            continue
        avg   = p.get("netAvg", 0)
        ltp   = p.get("ltp", avg)
        pnl   = p.get("pl", 0)
        positions.append({
            "symbol":       p.get("symbol", "").replace("NSE:", "").replace("-EQ", ""),
            "side":         "BUY" if qty > 0 else "SELL",
            "qty":          abs(qty),
            "avgEntry":     round(avg, 2),
            "currentPrice": round(ltp, 2),
            "pnl":          round(pnl, 2),
            "pnlPct":       round((pnl / (avg * abs(qty))) * 100, 2) if avg and qty else 0,
            "algo":         "Manual",
        })
    return positions


def get_holdings(access_token: str | None = None) -> list:
    fyers = get_fyers(access_token)
    resp  = fyers.holdings()
    if resp.get("s") != "ok":
        return []
    return resp.get("holdings", [])


def get_funds(access_token: str | None = None) -> dict:
    fyers = get_fyers(access_token)
    resp  = fyers.funds()
    if resp.get("s") != "ok":
        return {}
    fund_limit = resp.get("fund_limit", [])
    result     = {}
    for item in fund_limit:
        result[item.get("title", "")] = item.get("equityAmount", 0)
    return result


def get_profile(access_token: str | None = None) -> dict:
    fyers = get_fyers(access_token)
    resp  = fyers.get_profile()
    if resp.get("s") != "ok":
        return {}
    d = resp.get("data", {})
    return {
        "name":     d.get("name", ""),
        "email":    d.get("emailId", ""),
        "mobile":   d.get("mobile_number", ""),
        "pan":      d.get("PAN", ""),
        "clientId": d.get("fy_id", ""),
    }