'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './StatCounter.module.css';

function useCountUp(target: number, duration: number = 1800, started: boolean): number {
  const [val, setVal] = useState<number>(0);
  useEffect(() => {
    if (!started) return;
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(target * ease);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, started]);
  return val;
}

interface StatProps {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

function Stat({ value, label, prefix = '', suffix = '', decimals = 0 }: StatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState<boolean>(false);
  const count = useCountUp(value, 1800, started);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={styles.stat} ref={ref}>
      <div className={styles.value}>
        <span className={styles.prefix}>{prefix}</span>
        {count.toFixed(decimals)}
        <span className={styles.suffix}>{suffix}</span>
      </div>
      <div className={styles.label}>{label}</div>
    </div>
  );
}

export default function StatCounter() {
  return (
    <div className={styles.grid}>
      <Stat value={2.4} suffix="B+" prefix="$" decimals={1} label="Volume Executed Daily" />
      <Stat value={847} suffix="μs" decimals={0} label="Median Execution Latency" />
      <Stat value={99.98} suffix="%" decimals={2} label="Platform Uptime" />
      <Stat value={12400} suffix="+" decimals={0} label="Active Strategies Running" />
    </div>
  );
}
