'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
} from 'lightweight-charts';

type Props = {
  symbol: string;
};

export default function LiveChart({ symbol }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: {
          type: ColorType.Solid,
          color: '#18181b',
        },
        textColor: '#d1d5db',
      },

      width: chartContainerRef.current.clientWidth,
      height: 500,

      grid: {
        vertLines: {
          color: '#27272a',
        },
        horzLines: {
          color: '#27272a',
        },
      },

      rightPriceScale: {
        borderColor: '#3f3f46',
      },

      timeScale: {
        borderColor: '#3f3f46',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addSeries(
      CandlestickSeries,
      {
        upColor: '#22c55e',
        downColor: '#ef4444',

        borderVisible: false,

        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      }
    );

    async function loadCandles() {
      try {
        const token =
          localStorage.getItem('token');

        const res = await fetch(
          `http://localhost:5000/market/candles/${symbol}?tf=15m`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        const formatted =
          data.candles.map((c: any) => ({
            time: Math.floor(
              c.time / 1000
            ),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
          }));

        candleSeries.setData(formatted);
      } catch (err) {
        console.error(
          'Chart error:',
          err
        );
      }
    }

    loadCandles();

    const interval = setInterval(
      loadCandles,
      5000
    );

    const handleResize = () => {
      chart.applyOptions({
        width:
          chartContainerRef.current
            ?.clientWidth || 800,
      });
    };

    window.addEventListener(
      'resize',
      handleResize
    );
    
    return () => {
      clearInterval(interval);

      window.removeEventListener(
        'resize',
        handleResize
      );

      chart.remove();
    };
  }, [symbol]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full h-[500px]"
    />
  );
}