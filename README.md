# PENN — Algorithmic Trading Platform

A full-stack algorithmic trading web platform built for NSE and global markets. Supports strategy backtesting, ML-powered strategy recommendation, paper trading simulation, and real-time market data — with a professional trading terminal UI.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [API Reference](#api-reference)
- [Trading Strategies](#trading-strategies)
- [ML Recommendation System](#ml-recommendation-system)
- [Architecture](#architecture)


---

## Overview

QuantEdge is a web-based algorithmic trading platform targeting retail traders, HNIs (High Net-Worth Individuals), and institutional investors. It allows users to:

- **Backtest** any of 21 built-in strategies against historical stock data
- **Get ML-powered recommendations** for which strategy suits a given stock
- **Paper trade** in real time using live market prices with zero real capital at risk
- **Search stocks** by company name instead of needing to know ticker symbols

The platform focuses on **NSE-listed Indian stocks** and **US equities** via Yahoo Finance, with architecture prepared for live Fyers API integration.

---

## Features

### Backtest Module
- 21 trading strategies across 4 categories
- Equity curve visualization (SVG candlestick chart)
- Metrics: Total Return, Win Rate, Max Drawdown, Sharpe Ratio, Trade History
- Realistic simulation with position sizing

### ML Recommendation Engine
- Two modes: Full Scan (all 21 strategies) and ML-Assisted (category-predicted fast path)
- Random Forest classifier trained on 195 examples across 65 stocks × 3 time windows
- 59% test accuracy vs 33% random baseline
- Human-readable reasoning for every recommendation
- Scoring formula: Profit (35pts) + Win Rate (25pts) + Sharpe (20pts) − Drawdown (20pts)

### Paper Trading Terminal
- Real-time candlestick charts via yfinance
- Algorithm start/stop with live signal generation
- Positions, Trade History, and P&L tracking
- WebSocket price streaming (port 5001)
- Persistent custom watchlist (localStorage)
- All 21 strategies available for automated paper trading

### Symbol Search
- Search by company name (e.g. "Reliance Industries" → `RELIANCE.NS`)
- Works for both Indian (NSE) and US stocks
- Powered by yfinance Search API with 350ms debounce

### Authentication
- JWT-based authentication 
- bcrypt password hashing


---

## Tech Stack

### Backend
| Component | Technology |
|---|---|
| Web Framework | Flask (Python) |
| Database | PostgreSQL + SQLAlchemy |
| Authentication | Flask-JWT-Extended + Flask-Bcrypt |
| Market Data | yfinance |
| ML Model | scikit-learn (Random Forest) |
| WebSocket Server | websockets (asyncio, port 5001) |
| CORS | Flask-CORS |

### Frontend
| Component | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline styles |
| Charts | Custom SVG (no external chart library) |
| State | React useState / useEffect |
| Real-time | WebSocket (native browser API) |

---

## Project Structure

```
algotradingfinal1.0/
│
├── backend/
│   ├── app.py                          # Flask app factory, blueprint registration
│   ├── backtester.py                   # Core simulation engine
│   ├── strategy.py                     # All 21 strategy classes + STRATEGY_REGISTRY
│   ├── recommender.py                  # Scoring engine, ML prediction, feature extraction
│   ├── data_fetcher.py                 # yfinance data fetching wrapper
│   ├── extensions.py                   # db, bcrypt, jwt — initialized once
│   ├── config.py                       # DevelopmentConfig, ProductionConfig
│   ├── websocket_server.py             # WebSocket server (price + signal streaming)
│   ├── generate_training_data.py       # Builds ML training dataset (run once)
│   ├── relabel_categories.py           # Adds category column to training data
│   ├── train_model.py                  # Trains Random Forest, saves model.pkl
│   │
│   ├── ml/
│   │   ├── training_data.csv           # 195 training examples (65 stocks × 3 windows)
│   │   └── model_category.pkl          # Trained model file
│   │
│   ├── live/
│   │   ├── live_engine.py              # Paper trading execution engine
│   │   ├── strategy_runner.py          # Bridges strategies to live engine
│   │   ├── position_manager.py         # Position tracking
│   │   ├── risk_manager.py             # Risk management logic
│   │   └── state.py                    # Engine state management
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py                     # User database model
│   │
│   ├── routes/
│   │   ├── auth.py                     # POST /auth/login, /auth/signup
│   │   ├── backtest.py                 # POST /backtest/run, /backtest/ai-rank
│   │   ├── recommend.py                # POST /recommend, /recommend-ml
│   │   ├── symbol_search.py            # GET /search?q=
│   │   ├── market.py                   # GET /market/candles, /market/watchlist
│   │   ├── live.py                     # POST /live/start, /live/stop, GET /live/status
│   │   ├── orders.py                   # Order management (Fyers)
│   │   ├── algo.py                     # Algorithm management routes
│   │   └── fyers_auth.py               # Fyers OAuth flow
│   │
│   ├── services/
│   │   ├── yfinance_service.py         # Market data functions
│   │   ├── indicator_service.py        # Technical indicator calculations
│   │   ├── ranking_service.py          # Strategy ranking service
│   │   └── fyers_service.py            # Fyers API wrapper
│   │
│   ├── schema.sql                      # PostgreSQL schema (run once to set up DB)
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    ├── app/
    │   ├── page.tsx                    # Root redirect
    │   ├── login/page.tsx              # Login page
    │   ├── signup/page.tsx             # Signup page
    │   ├── Backtest/page.tsx           # Backtest terminal page
    │   ├── LiveTrading/page.tsx        # Landing page with navigation
    │   ├── terminal/page.tsx           # Paper trading terminal
    │   ├── recommend/page.tsx          # Strategy recommendation page
    │   └── Profile/page.tsx            # Portfolio overview page
    │
    ├── components/
    │   ├── BacktestSidebar.tsx         # Strategy config panel
    │   ├── BacktestChart.tsx           # Equity curve visualization
    │   ├── BacktestStats.tsx           # Performance metrics display
    │   ├── TradeHistory.tsx            # Trade list table
    │   ├── SymbolSearchInput.tsx       # Reusable symbol search with autocomplete
    │   ├── LiveTrading/
    │   │   └── LiveTrading.tsx         # Full paper trading terminal component
    │   ├── ProtectedRoute.tsx          # Auth guard for protected pages
    │   └── Navigation.tsx              # Navbar component
    │
    └── lib/
        └── liveApi.ts                  # All API functions (auth, backtest, market, live)
```

---

## Setup & Installation

### Prerequisites

- Python 3.11
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clone the repository

```bash
git clone https://github.com/your-username/algotradingfinal1.0.git
cd algotradingfinal1.0
```

### 2. Backend setup

```bash
cd backend

# Create virtual environment with Python 3.11
py -3.11 -m venv venv

# Activate it
# Windows:
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Database setup

Create a PostgreSQL database and run the schema:

```bash
createdb algo_trading
psql -U postgres -d algo_trading -f schema.sql
```

### 4. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

### 5. Frontend setup

```bash
cd frontend
npm install
```

### 6. Generate ML training data and train model (one-time setup)

```bash
cd backend

# Generate training data (takes 10-15 minutes, fetches 65 stocks)
python generate_training_data.py

# Add category labels
python relabel_categories.py

# Train the model
python train_model.py
# Expected output: Test accuracy ~59%
# Saves: ml/model_category.pkl
```



---

## Running the Project

You need **three terminals** running simultaneously:

### Terminal 1 — Flask backend

```bash
cd backend
python app.py
# Runs on http://localhost:5000
# WebSocket server auto-starts on ws://localhost:5001
```

### Terminal 2 — Next.js frontend

```bash
cd frontend
$env:NODE_OPTIONS="--max-old-space-size=4096"; npm run dev
# Runs on http://localhost:3000
```

### Terminal 3 — (optional) Monitor logs

Watch Flask terminal for trade execution logs:
```
[RELIANCE.NS_RSI] signal=1 price=2934.50
TRADE EXECUTED: {'symbol': 'RELIANCE.NS', 'side': 'BUY', 'price': 2934.50}
```

### Access the application

| Page | URL |
|---|---|
| Login | http://localhost:3000/login |
| Signup | http://localhost:3000/signup |
| Live Trading Terminal | http://localhost:3000/LiveTrading |
| Paper Trading | http://localhost:3000/terminal |
| Backtest | http://localhost:3000/Backtest |
| Recommendation | http://localhost:3000/recommend |
| Portfolio | http://localhost:3000/Profile |

---

## API Reference

All endpoints except `/auth/*` require:
```
Authorization: Bearer <jwt_token>
```

### Authentication

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/auth/signup` | `{name, email, password}` | Create account |
| POST | `/auth/login` | `{email, password}` | Login, returns JWT token |

### Backtest

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/backtest` | `{symbol, strategy, period, interval, initial_balance}` | Run single strategy backtest |

### Recommendation

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/recommend` | `{symbol, initial_balance, period}` | Full scan — all 21 strategies |
| POST | `/recommend-ml` | `{symbol, initial_balance, period}` | ML-assisted — category predicted first |

### Market Data

| Method | Endpoint | Description |
|---|---|---|
| GET | `/market/candles/<symbol>?tf=1h` | OHLCV candles for chart |
| POST | `/market/watchlist` | Batch quotes `{symbols: [...]}` |
| GET | `/market/quote/<symbol>` | Single symbol quote |
| GET | `/search?q=<query>` | Symbol search by company name |

### Paper Trading

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/live/start` | `{symbol, strategy, qty}` | Start algorithm |
| POST | `/live/stop` | `{symbol, strategy}` | Stop specific algorithm |
| GET | `/live/status` | — | All running engines |
| GET | `/live/positions` | — | Open positions |
| GET | `/live/trades` | — | Trade history |
| GET | `/live/pnl` | — | P&L summary |

### Example: Run a backtest

```bash
curl -X POST http://localhost:5000/backtest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "symbol": "TCS.NS",
    "strategy": "RSI",
    "period": "2y",
    "interval": "1d",
    "initial_balance": 10000
  }'
```

### Example: Get recommendation

```bash
curl -X POST http://localhost:5000/recommend-ml \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"symbol": "RELIANCE.NS", "initial_balance": 10000}'
```

---

## Trading Strategies

All 21 strategies are implemented in `backend/strategy.py` and registered in `STRATEGY_REGISTRY`. Every strategy follows the same interface — it receives a DataFrame of OHLCV data and returns the same DataFrame with a `signal` column added: `1` (BUY), `-1` (SELL), `0` (HOLD).

| # | Strategy | Category | Description |
|---|---|---|---|
| 1 | Golden Cross | Trend Following | 50-day MA crosses above 20-day MA |
| 2 | Death Cross | Trend Following | Bearish MA crossover — short bias |
| 3 | EMA Cross | Trend Following | Fast/slow exponential MA crossover |
| 4 | Triple MA | Trend Following | All three MAs aligned in same direction |
| 5 | EMA Ribbon | Trend Following | Multiple EMA trend confirmation |
| 6 | RSI | Mean Reversion | Overbought/oversold extremes (30/70) |
| 7 | MACD Cross | Trend Following | MACD line crosses signal line |
| 8 | MACD Zero Line | Trend Following | MACD crosses zero axis |
| 9 | Bollinger Bands | Mean Reversion | Price touches outer standard deviation bands |
| 10 | Bollinger Squeeze | Breakout | Low volatility followed by expansion |
| 11 | Stochastic | Mean Reversion | %K oscillator at overbought/oversold levels |
| 12 | ZScore Reversion | Mean Reversion | Price 2+ standard deviations from mean |
| 13 | ATR Breakout | Breakout | Price moves more than average daily range |
| 14 | Momentum Burst | Breakout | Short-term momentum surge detection |
| 15 | ROC Strategy | Breakout | Rate of change momentum signal |
| 16 | Price Breakout | Breakout | 20-day high/low channel breakout |
| 17 | Donchian Breakout | Breakout | Donchian channel price breakout |
| 18 | VWAP Cross | Breakout | Price crosses volume-weighted average price |
| 19 | VWAP Bounce | Mean Reversion | Bounce off VWAP as support/resistance |
| 20 | Volume Spike Breakout | Breakout | High-volume price breakout confirmation |
| 21 | SuperTrend | Trend Following | ATR-based dynamic trend direction |
| +1 | AI Ensemble | All | Majority vote across RSI, MACD, Golden Cross, Bollinger, ATR |

### AI Ensemble

The 21st strategy combines signals from 5 diverse strategies. On each trading day, all 5 voters cast a signal. Whichever direction gets more votes wins:

```
RSI:            BUY  (+1)
MACD Cross:     BUY  (+1)
Golden Cross:   HOLD  (0)
Bollinger Bands: SELL (-1)
ATR Breakout:   BUY  (+1)

Buy votes = 3, Sell votes = 1 → Signal = BUY
```

---

## ML Recommendation System

### Training Data

- **Stocks:** 65 (35 Indian NSE + 30 US)
- **Time windows per stock:** 3 (full 2y, recent 1y, recent 6mo)
- **Total examples:** 195
- **Features (X):** 8 numerical characteristics per stock/window
- **Label (y):** Which strategy category scored highest

### Features

| Feature | Description |
|---|---|
| `volatility` | Annualized standard deviation of daily returns (%) |
| `trend_strength` | Slope of 50-day MA normalized by current price |
| `avg_rsi` | Average RSI value over the entire period |
| `vol_trend` | Recent 20-day volume vs older 40-day volume (%) |
| `daily_range` | Average high-low range as % of closing price |
| `momentum_20d` | 20-day price change percentage |
| `return_consistency` | Mean daily return / std daily return |
| `historical_max_drawdown` | Worst peak-to-trough drop in raw price (%) |

### Strategy Categories

| Category | Strategies | Training Examples |
|---|---|---|
| Mean Reversion | RSI, Bollinger Bands, Stochastic, ZScore, VWAP Bounce, Bollinger Squeeze | 98 |
| Breakout/Momentum | ATR Breakout, Price Breakout, Donchian, Volume Spike, Momentum Burst, ROC, VWAP Cross | 60 |
| Trend Following | Golden Cross, Death Cross, EMA Cross, Triple MA, EMA Ribbon, MACD Cross, MACD Zero Line, SuperTrend | 37 |

### Model

```
Algorithm:      Random Forest Classifier
n_estimators:   150 trees
max_depth:      8 (prevents overfitting on small data)
min_samples_leaf: 2 (prevents single-example rules)
class_weight:   balanced (compensates for unequal category sizes)
train/test split: 80/20

Test accuracy:  59.0% (vs 33% random baseline)
Per-category recall:
  Mean Reversion:    75%
  Breakout/Momentum: 50%
  Trend Following:   29%
```

### Two-Stage Pipeline (`/recommend-ml`)

```
Stage 1 — ML (instant, ~5ms):
  8 features → Random Forest → predicted category + confidence %

Stage 2 — Scoring (fast, ~4-6 seconds):
  Only strategies within predicted category are backtested
  6-9 strategies instead of all 21
  Same scoring formula as full scan

Result: 65% fewer computations, same accuracy in most cases
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (port 3000)                  │
│              Next.js + TypeScript + Tailwind            │
│   Backtest │ Recommend │ Terminal │ Portfolio │ Search  │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP REST (port 5000)
                     │ WebSocket (port 5001)
┌────────────────────▼────────────────────────────────────┐
│                 FLASK BACKEND (port 5000)               │
│                                                         │
│  /auth/*      JWT authentication + bcrypt hashing      │
│  /backtest    21 strategies + backtester engine         │
│  /recommend   Scoring engine + ML model                 │
│  /recommend-ml Random Forest category prediction        │
│  /search      yfinance symbol search                    │
│  /market/*    Real-time price data                      │
│  /live/*      Paper trading engine                      │
│                                                         │
│  WebSocket (port 5001):                                 │
│    /ws/price/<symbol>  → price tick every 5s            │
│    /ws/signals         → trade signals instantly        │
└──────┬─────────────────────────────────┬────────────────┘
       │                                 │
┌──────▼──────┐                 ┌────────▼────────┐
│ PostgreSQL  │                 │    yfinance     │
│             │                 │ Historical data │
│ users       │                 │ Real-time quotes│
│ strategies  │                 │ Company search  │
│ live_trades │                 └─────────────────┘
│ backtest_   │
│ results     │                 ┌─────────────────┐
└─────────────┘                 │  ml/ directory  │
                                │ training_data   │
                                │ model_category  │
                                │ .pkl (trained)  │
                                └─────────────────┘
```


---

## Known Limitations

- **Paper trading signals** depend on real market conditions. Strategies like Golden Cross and RSI only fire when price indicators reach extreme values — this may not happen during a short demo session. Use `/live/inject-test` to demonstrate the full pipeline with a manually triggered trade.
- **ML model accuracy** is 59% with 195 training examples. This is documented honestly. Accuracy would improve significantly with 500+ stocks as training data.
- **Live Fyers trading** requires a funded demat account and Fyers API credentials. The integration is architecturally complete — auth flow, order routes, and WebSocket infrastructure are all built. Paper trading demonstrates the full system without real capital.
- **yfinance rate limiting** — heavy use (rapid repeated fetches) may temporarily return empty data for Indian stocks. Waiting 2-5 minutes resolves this.

---

## License

This project was built as a Final Year Project for academic evaluation purposes.