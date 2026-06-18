'use client';
import { useEffect, useRef } from 'react';
import styles from './LiveChart.module.css';

interface Candle {
  open: number;
  close: number;
  high: number;
  low: number;
}

function generateCandles(count: number): Candle[] {
  const candles: Candle[] = [];
  let price = 42850;
  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 280;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 120;
    const low  = Math.min(open, close) - Math.random() * 120;
    candles.push({ open, close, high, low });
    price = close;
  }
  return candles;
}

export default function LiveChart() {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const candlesRef = useRef<Candle[]>(generateCandles(60));
  const frameRef   = useRef<number>(0);
  const tickRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width  = W;
      canvas.height = H;

      tickRef.current++;
      if (tickRef.current % 60 === 0) {
        const candles = candlesRef.current;
        const last = candles[candles.length - 1];
        const change = (Math.random() - 0.48) * 280;
        const open  = last.close;
        const close = open + change;
        candles.push({
          open, close,
          high: Math.max(open, close) + Math.random() * 120,
          low:  Math.min(open, close) - Math.random() * 120,
        });
        if (candles.length > 70) candles.shift();
      }

      const candles  = candlesRef.current;
      const visible  = candles.slice(-40);
      const allPrices = visible.flatMap(c => [c.high, c.low]);
      const minP  = Math.min(...allPrices);
      const maxP  = Math.max(...allPrices);
      const range = maxP - minP || 1;
      const padTop    = H * 0.08;
      const padBottom = H * 0.12;
      const chartH  = H - padTop - padBottom;
      const candleW = (W - 48) / visible.length;

      ctx.clearRect(0, 0, W, H);

      // Grid
      const gridLines = 5;
      for (let i = 0; i <= gridLines; i++) {
        const y     = padTop + (chartH / gridLines) * i;
        const price = maxP - (range / gridLines) * i;
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(30, 45, 74, 0.7)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(90, 106, 138, 0.6)';
        ctx.font = "10px 'JetBrains Mono', monospace";
        ctx.textAlign = 'right';
        ctx.fillText(price.toFixed(0), W - 4, y - 3);
      }

      // EMA
      const ema: number[] = [];
      const k = 2 / (14 + 1);
      visible.forEach((c, i) => {
        if (i === 0) ema.push(c.close);
        else ema.push(c.close * k + ema[i - 1] * (1 - k));
      });

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(10, 132, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ema.forEach((v, i) => {
        const x = 24 + i * candleW + candleW / 2;
        const y = padTop + ((maxP - v) / range) * chartH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Candles
      visible.forEach((c, i) => {
        const x       = 24 + i * candleW;
        const cx      = x + candleW / 2;
        const isGreen = c.close >= c.open;
        const color   = isGreen ? '#00FF88' : '#FF3B30';
        const bodyTop = padTop + ((maxP - Math.max(c.open, c.close)) / range) * chartH;
        const bodyBot = padTop + ((maxP - Math.min(c.open, c.close)) / range) * chartH;
        const wickTop = padTop + ((maxP - c.high) / range) * chartH;
        const wickBot = padTop + ((maxP - c.low)  / range) * chartH;
        const bodyH   = Math.max(bodyBot - bodyTop, 1);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;
        ctx.moveTo(cx, wickTop);
        ctx.lineTo(cx, wickBot);
        ctx.stroke();

        ctx.globalAlpha = isGreen ? 0.85 : 0.75;
        ctx.fillStyle   = isGreen ? 'rgba(0,255,136,0.15)' : 'rgba(255,59,48,0.15)';
        ctx.fillRect(x + 1.5, bodyTop, candleW - 4, bodyH);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x + 1.5, bodyTop, candleW - 4, bodyH);
        ctx.globalAlpha = 1;
      });

      // Last price line
      const lastC  = visible[visible.length - 1];
      const lastY  = padTop + ((maxP - lastC.close) / range) * chartH;
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 5]);
      ctx.moveTo(0, lastY);
      ctx.lineTo(W - 60, lastY);
      ctx.stroke();
      ctx.setLineDash([]);

      const tagW = 58;
      const tagH = 20;
      ctx.fillStyle   = 'rgba(0,255,136,0.15)';
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth   = 1;
      ctx.fillRect  (W - tagW - 2, lastY - tagH / 2, tagW, tagH);
      ctx.strokeRect(W - tagW - 2, lastY - tagH / 2, tagW, tagH);
      ctx.fillStyle = '#00FF88';
      ctx.font      = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillText(lastC.close.toFixed(1), W - tagW / 2 - 2, lastY + 4);

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.pair}>BTC / USDT</span>
        <span className={styles.tf}>15m</span>
        <span className={styles.live}><span className={styles.dot}></span>LIVE</span>
      </div>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
