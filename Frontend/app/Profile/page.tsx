'use client';

import { useEffect, useState } from 'react';

const API   = 'http://localhost:5000';
const token = () => localStorage.getItem('access_token') ?? '';
const auth  = () => ({ Authorization: `Bearer ${token()}` });
const CURRENCY = '₹';
const fmtN = (n: number, d = 2) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d });

export default function PortfolioPage() {
  const [status,   setStatus]   = useState<any>(null);
  const [pnl,      setPnl]      = useState<any>(null);
  const [trades,   setTrades]   = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const [sr, pr, tr, posr,ur] = await Promise.all([
          fetch(`${API}/live/status`,    { headers: auth() }),
          fetch(`${API}/live/pnl`,       { headers: auth() }),
          fetch(`${API}/live/trades`,    { headers: auth() }),
          fetch(`${API}/live/positions`, { headers: auth() }),
          fetch(`${API}/auth/me`, { headers: auth() }),
        ]);
        const [sd, pd, td, posd, ud] = await Promise.all([
          sr.json(), pr.json(), tr.json(), posr.json(), ur.json(),
        ]);
        setStatus(sd);
        setPnl(pd);
        setTrades(td.trades || []);
        setPositions(posd.positions || []);
        setUser(ud.user);
      } catch (e) {
        console.log('Portfolio load failed', e);
      } finally {
        setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const totalPnl    = pnl?.pnl ?? 0;
  const totalEquity = pnl?.total_equity ?? 100000;
  const winTrades   = trades.filter((_, i) => i % 2 === 0).length; // simplified
  const winRate     = trades.length > 0 ? Math.round((winTrades / trades.length) * 100) : 0;

  return (
    <main style={{ background: '#05070D', minHeight: '100vh', color: '#E6EAF2', padding: '40px 24px' }}>

      {/* glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(600px circle at 15% 20%, rgba(0,255,136,0.06), transparent 60%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1000, margin: '0 auto' }}>

            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Portfolio</h1>
            <p style={{ color: '#8A93A8', marginBottom: 32, fontSize: 14 }}>
              Current session performance
            </p>
            <div
  style={{
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '24px',
    marginBottom: 28,
    display: 'flex',
    alignItems: 'center',
    gap: 24,
  }}
>
  {/* Avatar */}
  <div
    style={{
      width: 72,
      height: 72,
      borderRadius: '50%',
      background: 'linear-gradient(135deg,#00FF88,#00C26E)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 30,
      fontWeight: 700,
      color: '#05070D',
      flexShrink: 0,
    }}
  >
    {user?.name?.charAt(0).toUpperCase()}
  </div>

  {/* User Details */}
  <div style={{ flex: 1 }}>
    <h2
      style={{
        margin: 0,
        fontSize: 22,
        fontWeight: 700,
        color: '#E6EAF2',
      }}
    >
      {user?.name}
    </h2>

    <p
      style={{
        marginTop: 6,
        color: '#8A93A8',
        fontSize: 14,
      }}
    >
      {user?.email}
    </p>

    <div
      style={{
        display: 'flex',
        gap: 14,
        marginTop: 16,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          background: 'rgba(0,255,136,0.12)',
          color: '#00FF88',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        ● Demo Account
      </span>

      <span
        style={{
          background: 'rgba(90,200,250,0.12)',
          color: '#5AC8FA',
          padding: '6px 14px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        ● Active
      </span>
    </div>
  </div>
</div>
        {/* KPI cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total Equity',   value: `${CURRENCY}${fmtN(totalEquity)}`,              color: '#E6EAF2' },
            { label: 'Session P&L',    value: `${totalPnl >= 0 ? '+' : ''}${CURRENCY}${fmtN(Math.abs(totalPnl))}`, color: totalPnl >= 0 ? '#00FF88' : '#FF3B30' },
            { label: 'Total Trades',   value: String(trades.length),                           color: '#E6EAF2' },
            { label: 'Open Positions', value: String(positions.length),                        color: '#5AC8FA' },
            { label: 'Active Algos',   value: String(status?.engines?.length ?? 0),            color: '#00FF88' },
          ].map(k => (
            <div key={k.label} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '20px 24px',
            }}>
              <p style={{ fontSize: 11, color: '#8A93A8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</p>
              <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'monospace', color: k.color }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Running engines */}
        {status?.engines?.length > 0 && (
          <div style={{ marginBottom: 24, padding: 16, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 12 }}>
            <p style={{ fontSize: 12, color: '#8A93A8', marginBottom: 8 }}>RUNNING ALGORITHMS</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {status.engines.map((e: any) => (
                <span key={`${e.symbol}_${e.strategy}`} style={{
                  background: 'rgba(0,255,136,0.1)', color: '#00FF88',
                  padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                }}>
                  ● {e.strategy} on {e.symbol}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Open Positions */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#8A93A8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Open Positions</p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Symbol','Side','Qty','Entry','Current','P&L'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#8A93A8', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#5A6A8A' }}>
                    No open positions
                  </td></tr>
                ) : positions.map((p: any, i: number) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.symbol}</td>
                    <td style={{ padding: '12px 16px', color: p.side === 'BUY' ? '#00FF88' : '#FF3B30', fontWeight: 600 }}>{p.side}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{p.qty}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{CURRENCY}{fmtN(p.avgEntry || p.entry_price || 0)}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{CURRENCY}{fmtN(p.currentPrice || p.current_price || 0)}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: (p.pnl || 0) >= 0 ? '#00FF88' : '#FF3B30', fontWeight: 600 }}>
                      {(p.pnl || 0) >= 0 ? '+' : ''}{CURRENCY}{fmtN(Math.abs(p.pnl || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trade History */}
        <div>
          <p style={{ fontSize: 12, color: '#8A93A8', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
            Trade History ({trades.length} trades)
          </p>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {['Time','Symbol','Side','Qty','Price','Total'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#8A93A8', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#5A6A8A' }}>
                    No trades yet this session
                  </td></tr>
                ) : [...trades].reverse().map((t: any, i: number) => (
                  <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#8A93A8', fontSize: 12 }}>{t.time}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{t.symbol}</td>
                    <td style={{ padding: '12px 16px', color: t.side === 'BUY' ? '#00FF88' : '#FF3B30', fontWeight: 600 }}>{t.side}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{t.qty}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{CURRENCY}{fmtN(t.price)}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>{CURRENCY}{fmtN(t.price * t.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}