"""
routes/fyers_auth.py
--------------------
Fyers OAuth 2.0 flow:
  GET  /auth/fyers/login     → redirect user to Fyers login page
  GET  /auth/fyers/callback  → Fyers redirects here with auth_code
  GET  /auth/fyers/status    → check if token exists and is valid
  POST /auth/fyers/logout    → delete saved token
"""

from flask import Blueprint, jsonify, redirect, request
from services.fyers_service import (
    get_auth_url, exchange_code_for_token,
    load_token, clear_token, get_profile,
)
import os

fyers_auth_bp = Blueprint("fyers_auth", __name__, url_prefix="/auth/fyers")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


@fyers_auth_bp.route("/login")
def login():
    """
    Step 1: Redirect user to Fyers OAuth page.
    Frontend calls: window.location.href = '/auth/fyers/login'
    """
    try:
        auth_url = get_auth_url()
        return redirect(auth_url)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@fyers_auth_bp.route("/callback")
def callback():
    """
    Only reachable if FYERS_REDIRECT_URI points directly at this server
    (works when deployed with a real public HTTPS domain, since Fyers
    rejects localhost URLs in the dashboard).

    For local development, Fyers redirects to their own placeholder page
    instead (see FYERS_REDIRECT_URI in .env). In that case, use
    POST /auth/fyers/submit-code with the auth_code copied from the
    browser URL bar — see that route below.
    """
    auth_code = request.args.get("auth_code") or request.args.get("code")
    if not auth_code:
        error = request.args.get("error", "No auth_code received")
        return redirect(f"{FRONTEND_URL}/terminal?fyers_error={error}")

    try:
        access_token = exchange_code_for_token(auth_code)
        return redirect(f"{FRONTEND_URL}/terminal?fyers_auth=success")
    except Exception as e:
        return redirect(f"{FRONTEND_URL}/terminal?fyers_error={str(e)}")


@fyers_auth_bp.route("/submit-code", methods=["POST"])
def submit_code():
    """
    Manual fallback for local development.

    Flow:
      1. User clicks "Connect Fyers" → redirected to Fyers login
      2. After login, Fyers redirects to FYERS_REDIRECT_URI
         (e.g. https://trade.fyers.in/api-login/redirect-uri/index.html)
      3. That page displays the auth_code in the URL, e.g.:
         https://trade.fyers.in/api-login/redirect-uri/index.html?auth_code=eyJ0eXAi...&state=
      4. User copies the auth_code value and pastes it into the frontend,
         which POSTs it here.

    Body: { "auth_code": "eyJ0eXAi..." }
    """
    body = request.get_json(silent=True) or {}
    auth_code = body.get("auth_code", "").strip()

    if not auth_code:
        return jsonify({"error": "auth_code is required"}), 400

    try:
        access_token = exchange_code_for_token(auth_code)
        return jsonify({"ok": True, "message": "Fyers connected successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@fyers_auth_bp.route("/status")
def status():
    """
    Returns whether a valid token exists.
    Frontend polls this on terminal load to show auth state.
    """
    token = load_token()
    if not token:
        return jsonify({"authenticated": False, "profile": None})

    try:
        profile = get_profile(token)
        return jsonify({"authenticated": True, "profile": profile})
    except Exception:
        # Token might be expired
        clear_token()
        return jsonify({"authenticated": False, "profile": None})


@fyers_auth_bp.route("/logout", methods=["POST"])
def logout():
    """Clear the saved Fyers token."""
    clear_token()
    return jsonify({"ok": True, "message": "Logged out from Fyers"})