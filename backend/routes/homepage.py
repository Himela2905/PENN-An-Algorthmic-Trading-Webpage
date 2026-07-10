from flask import Blueprint, jsonify
import yfinance as yf
from services.news_service import get_market_news

homepage_bp = Blueprint("homepage", __name__)

# Indian market indices
INDICES = {
    "NIFTY 50": "^NSEI",
    "SENSEX": "^BSESN",
    "BANK NIFTY": "^NSEBANK",
    "FINNIFTY": "NIFTY_FIN_SERVICE.NS",   # We'll improve this if needed
    "INDIA VIX": "^INDIAVIX"
}


def get_index_data(symbol):
    try:
        ticker = yf.Ticker(symbol)
        hist = ticker.history(period="2d")

        if len(hist) < 2:
            return None

        current = round(float(hist["Close"].iloc[-1]), 2)
        previous = round(float(hist["Close"].iloc[-2]), 2)

        change = round(current - previous, 2)
        percent = round((change / previous) * 100, 2)

        return {
            "price": current,
            "change": change,
            "percent": percent
        }

    except Exception as e:
        print(e)
        return None


@homepage_bp.route("/homepage/overview", methods=["GET"])
def market_overview():

    data = []

    for name, symbol in INDICES.items():

        result = get_index_data(symbol)

        if result:

            data.append({
                "name": name,
                **result
            })

    return jsonify(data)


def get_top_movers():
    """
    Returns top gainers and losers from a predefined basket
    of popular NSE stocks.
    """

    symbols = [
        "RELIANCE.NS",
        "TCS.NS",
        "INFY.NS",
        "HDFCBANK.NS",
        "ICICIBANK.NS",
        "SBIN.NS",
        "LT.NS",
        "TMCV.NS",
        "BHARTIARTL.NS",
        "ITC.NS",
        "HINDUNILVR.NS",
        "AXISBANK.NS",
        "KOTAKBANK.NS",
        "BAJFINANCE.NS",
        "MARUTI.NS",
        "ASIANPAINT.NS",
        "BEL.NS",
        "HAL.NS",
        "NTPC.NS",
        "POWERGRID.NS"
    ]

    stocks = []

    for symbol in symbols:

        try:

            hist = yf.Ticker(symbol).history(period="2d")

            if len(hist) < 2:
                continue

            previous = float(hist["Close"].iloc[-2])
            current = float(hist["Close"].iloc[-1])

            change = current - previous
            percent = (change / previous) * 100

            stocks.append({
                "symbol": symbol.replace(".NS", ""),
                "price": round(current, 2),
                "change": round(change, 2),
                "percent": round(percent, 2)
            })

        except Exception:
            continue

    gainers = sorted(
        stocks,
        key=lambda x: x["percent"],
        reverse=True
    )[:5]

    losers = sorted(
        stocks,
        key=lambda x: x["percent"]
    )[:5]

    return gainers, losers

@homepage_bp.route("/homepage/movers", methods=["GET"])
def movers():

    gainers, losers = get_top_movers()

    return jsonify({
        "gainers": gainers,
        "losers": losers
    })

@homepage_bp.route("/homepage/news")
def homepage_news():

    return jsonify(get_market_news())