'use client';
import { useEffect, useState } from 'react';
import styles from './Ticker.module.css';

interface Asset {
  sym: string;
  price: number;
  chg: number;
}

const ASSETS: Asset[] = [
  { sym: 'BTC/USDT', price: 67842.50, chg: +2.34 },
  { sym: 'ETH/USDT', price: 3521.18, chg: +1.87 },
  { sym: 'SPY',      price: 538.72,   chg: -0.41 },
  { sym: 'AAPL',     price: 214.85,   chg: +0.92 },
  { sym: 'NVDA',     price: 875.30,   chg: +3.14 },
  { sym: 'TSLA',     price: 188.42,   chg: -1.23 },
  { sym: 'EUR/USD',  price: 1.0842,   chg: +0.08 },
  { sym: 'GLD',      price: 2318.60,  chg: +0.55 },
  { sym: 'SOL/USDT', price: 172.34,   chg: +4.21 },
  { sym: 'QQQ',      price: 463.18,   chg: -0.28 },
];

export default function Ticker() {
  const [prices, setPrices] = useState<Asset[]>(ASSETS);

  useEffect(() => {
    const id = setInterval(() => {
      setPrices(prev => prev.map(a => ({
        ...a,
        price: a.price * (1 + (Math.random() - 0.5) * 0.001),
        chg: a.chg + (Math.random() - 0.5) * 0.05,
      })));
    }, 1200);
    return () => clearInterval(id);
  }, []);

  const doubled: Asset[] = [...prices, ...prices];

  return (
    <div className={styles.ticker}>
      <div className={styles.track}>
        {doubled.map((a, i) => (
          <div key={i} className={styles.item}>
            <span className={styles.sym}>{a.sym}</span>
            <span className={styles.price}>
              {a.price < 100 ? a.price.toFixed(4) : a.price.toFixed(2)}
            </span>
            <span className={`${styles.chg} ${a.chg >= 0 ? styles.up : styles.down}`}>
              {a.chg >= 0 ? '▲' : '▼'} {Math.abs(a.chg).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
