# PENN — Algorithmic Trading Platform

A full-stack algorithmic trading web platform built for NSE and global markets. Supports strategy backtesting, ML-powered strategy recommendation, paper trading simulation, and real-time market data — with a professional trading terminal UI.

---

## ✨ Features

- 📈 Backtesting with 21 trading strategies
- 🤖 ML-based strategy recommendation (Random Forest)
- 💹 Real-time paper trading terminal
- 🔍 Company name & symbol search
- 🔐 JWT Authentication
- 📊 Performance metrics (Return, Win Rate, Sharpe Ratio, Drawdown)
- ⚡ WebSocket live price updates

---

## 🛠 Tech Stack

**Frontend**
- Next.js
- TypeScript
- Tailwind CSS

**Backend**
- Flask
- PostgreSQL
- SQLAlchemy
- Flask-JWT-Extended
- yfinance
- scikit-learn

---

## 📂 Project Structure

```
backend/
├── routes/
├── models/
├── services/
├── live/
├── ml/

frontend/
├── app/
├── components/
└── lib/
```

---

## 🚀 Setup

### Backend

```bash
cd backend
python -m venv venv
pip install -r requirements.txt
python app.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Application

| Page | URL |
|------|------|
| Login | `/login` |
| Signup | `/signup` |
| Backtest | `/Backtest` |
| Paper Trading | `/terminal` |
| Recommendation | `/recommend` |
| Portfolio | `/Profile` |

---

## 📡 Main APIs

| Endpoint | Purpose |
|----------|---------|
| POST `/auth/login` | Login |
| POST `/auth/signup` | Register |
| POST `/backtest` | Run backtest |
| POST `/recommend` | Strategy recommendation |
| POST `/recommend-ml` | ML-assisted recommendation |
| GET `/market/candles/<symbol>` | Market data |
| POST `/live/start` | Start paper trading |
| POST `/live/stop` | Stop paper trading |

---

## 📊 Trading Strategies

The platform supports **21 technical trading strategies**, including:

- RSI
- MACD
- Golden Cross
- EMA Cross
- Bollinger Bands
- Donchian Breakout
- SuperTrend
- ATR Breakout
- VWAP
- Stochastic
- Momentum
- Price Breakout
- and more...

---

## 🤖 Machine Learning

- Random Forest Classifier
- 195 training samples
- 8 engineered features
- **59% test accuracy**
- Predicts the best strategy category before backtesting

---

## ⚠️ Limitations

- Paper trading only (no real money execution)
- Live market data depends on Yahoo Finance
- ML model accuracy can improve with larger datasets

---

## 📄 License

Developed as a Final Year B.Tech Project for academic purposes.