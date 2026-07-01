'use client';

import { useState } from 'react';
import Navbar from '@/components/Navigation';
import { getRecommendation, getRecommendationML } from '@/lib/liveApi';

interface StrategyResult {
  strategy: string;
  score: number;
  profit_pct: number;
  win_ratio: number;
  sharpe: number;
  max_drawdown: number;
  total_trades: number;
  risk: string;
  best_for: string;
}

interface RecommendationResponse {
  symbol: string;
  recommended_strategy: string;
  score: number;
  risk: string;
  best_for: string;
  reasoning: string[];
  all_strategies: StrategyResult[];
  ml_used?: boolean;
  ml_prediction?: {
    predicted_category: string;
    confidence_pct: number;
    model_test_accuracy: number;
    probability_breakdown: Record<string, number>;
  };
  error?: string;
}

export default function RecommendPage() {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [useML, setUseML] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<RecommendationResponse | null>(null);

  async function handleAnalyze() {
    if (!symbol.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = useML
        ? await getRecommendationML({ symbol: symbol.trim().toUpperCase(), initial_balance: 10000 })
        : await getRecommendation({ symbol: symbol.trim().toUpperCase(), initial_balance: 10000 });

      if (data.error) {
        setError(data.error);
      } else {
        setResult(data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  const riskColor = (risk: string) =>
    risk === 'Low' ? '#00FF88' : risk === 'Medium' ? '#FFB800' : '#FF3B30';

  return (
    <main style={{ background: '#05070D', minHeight: '100vh', color: '#E6EAF2' }}>
      <Navbar />

      {/* ===== HERO / INPUT SECTION ===== */}
      <section
        style={{
          position: 'relative',
          padding: '120px 24px 64px',
          overflow: 'hidden',
        }}
      >
        {/* glow background, matches Penn hero aesthetic */}
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 0,
            background:
              'radial-gradient(600px circle at 20% 20%, rgba(0,255,136,0.08), transparent 60%), radial-gradient(500px circle at 80% 0%, rgba(90,198,250,0.08), transparent 60%)',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 14px', borderRadius: 20,
              border: '1px solid rgba(0,255,136,0.3)',
              background: 'rgba(0,255,136,0.06)',
              fontSize: 13, color: '#00FF88', marginBottom: 24,
              fontFamily: 'monospace',
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00FF88', display: 'inline-block' }} />
            ML-assisted strategy selection
          </div>

          <h1 style={{ fontSize: 44, fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
            Don&apos;t guess the strategy.<br />
            <span style={{ color: '#00FF88' }}>Let the data pick it.</span>
          </h1>

          <p style={{ color: '#8A93A8', fontSize: 16, maxWidth: 560, margin: '0 auto 40px' }}>
            We backtest every strategy in our library against this stock&apos;s real
            historical data, score each one, and recommend the best fit — with full
            transparency into why.
          </p>

          {/* ===== Search bar ===== */}
          <div
            style={{
              display: 'flex', gap: 12, maxWidth: 560, margin: '0 auto',
              flexWrap: 'wrap', justifyContent: 'center',
            }}
          >
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="e.g. RELIANCE.NS or TSLA"
              style={{
                flex: '1 1 260px', padding: '14px 18px', borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#E6EAF2', fontSize: 15, fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !symbol.trim()}
              style={{
                padding: '14px 28px', borderRadius: 10, border: 'none',
                background: loading ? 'rgba(0,255,136,0.3)' : '#00FF88',
                color: '#05070D', fontWeight: 600, fontSize: 15,
                cursor: loading ? 'default' : 'pointer',
                opacity: !symbol.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>

          <label
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              marginTop: 16, fontSize: 13, color: '#8A93A8', cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={useML}
              onChange={(e) => setUseML(e.target.checked)}
            />
            Use ML fast-path (predicts category first, then scores only relevant strategies)
          </label>

          {error && (
            <p style={{ color: '#FF3B30', marginTop: 20, fontSize: 14 }}>{error}</p>
          )}
        </div>
      </section>

      {/* ===== RESULTS SECTION ===== */}
      {result && (
        <section style={{ padding: '0 24px 96px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>

            {/* ML banner */}
            {result.ml_used && result.ml_prediction && (
              <div
                style={{
                  background: 'rgba(90,198,250,0.08)',
                  border: '1px solid rgba(90,198,250,0.25)',
                  borderRadius: 12, padding: '14px 20px', marginBottom: 24,
                  fontSize: 14, color: '#B8C4DB',
                }}
              >
                <span style={{ color: '#5AC8FA', fontWeight: 600 }}>
                  ML predicted &quot;{result.ml_prediction.predicted_category}&quot;
                </span>
                {' '}with {result.ml_prediction.confidence_pct}% confidence
                <span style={{ color: '#5A6A8A' }}>
                  {' '}(model test accuracy: {result.ml_prediction.model_test_accuracy}%)
                </span>
              </div>
            )}

            {/* Top recommendation card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(90,198,250,0.04))',
                border: '1px solid rgba(0,255,136,0.25)',
                borderRadius: 16, padding: 28, marginBottom: 32,
                display: 'flex', flexWrap: 'wrap', gap: 24,
                justifyContent: 'space-between', alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: '#8A93A8', marginBottom: 6 }}>
                  Recommended for {result.symbol}
                </div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#00FF88' }}>
                  {result.recommended_strategy}
                </div>
                <div style={{ fontSize: 13, color: '#8A93A8', marginTop: 4 }}>
                  {result.best_for}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 32 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#8A93A8' }}>Score</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>{result.score}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: '#8A93A8' }}>Risk</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: riskColor(result.risk) }}>
                    {result.risk}
                  </div>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            {result.reasoning?.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, color: '#8A93A8', marginBottom: 10, fontFamily: 'monospace' }}>
                  WHY THIS STRATEGY
                </div>
                <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 0, margin: 0 }}>
                  {result.reasoning.map((r, i) => (
                    <li
                      key={i}
                      style={{
                        listStyle: 'none', display: 'flex', gap: 10,
                        fontSize: 14, color: '#C8D0E0', alignItems: 'flex-start',
                      }}
                    >
                      <span style={{ color: '#00FF88', marginTop: 2 }}>→</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Full ranked table */}
            <div>
              <div style={{ fontSize: 13, color: '#8A93A8', marginBottom: 10, fontFamily: 'monospace' }}>
                ALL STRATEGIES TESTED ({result.all_strategies?.length ?? 0})
              </div>
              <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      {['Strategy', 'Score', 'Return', 'Win Rate', 'Sharpe', 'Max DD', 'Trades', 'Risk'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left', padding: '12px 16px',
                            color: '#8A93A8', fontWeight: 500, fontSize: 12,
                            textTransform: 'uppercase', letterSpacing: 0.5,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.all_strategies?.map((s, i) => (
                      <tr
                        key={i}
                        style={{
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                          background: s.strategy === result.recommended_strategy
                            ? 'rgba(0,255,136,0.05)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.strategy}</td>
                        <td style={{ padding: '12px 16px' }}>{s.score}</td>
                        <td style={{ padding: '12px 16px', color: s.profit_pct >= 0 ? '#00FF88' : '#FF3B30' }}>
                          {s.profit_pct >= 0 ? '+' : ''}{s.profit_pct}%
                        </td>
                        <td style={{ padding: '12px 16px' }}>{s.win_ratio}%</td>
                        <td style={{ padding: '12px 16px' }}>{s.sharpe}</td>
                        <td style={{ padding: '12px 16px', color: '#FF3B30' }}>{s.max_drawdown}%</td>
                        <td style={{ padding: '12px 16px', color: '#5A6A8A' }}>{s.total_trades}</td>
                        <td style={{ padding: '12px 16px', color: riskColor(s.risk) }}>{s.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Empty state before first search */}
      {!result && !loading && !error && (
        <section style={{ padding: '0 24px 96px', textAlign: 'center' }}>
          <p style={{ color: '#5A6A8A', fontFamily: 'monospace', fontSize: 14 }}>
            Enter a symbol above to see ranked strategy recommendations.
          </p>
        </section>
      )}
    </main>
  );
}