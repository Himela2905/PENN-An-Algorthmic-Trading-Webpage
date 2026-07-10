'use client';
import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import Navbar from '@/components/Navigation';
import Ticker from '@/components/Ticker';
import StatCounter from '@/components/StatCounter';
import styles from './page.module.css';
import Link from "next/link";


const LiveChart = dynamic(() => import('@/components/LiveChart'), { ssr: false });

<Link
  href="/terminal"
  className={styles.ctaPrimary}
>
  🖥 Open Paper Trading Terminal
</Link>


interface Feature {
  icon: ReactNode;
  title: string;
  desc: string;
  tag: string;
}

interface Strategy {
  name: string;
  type: string;
  returns: string;
  drawdown: string;
  sharpe: string;
  status: 'active' | 'paused';
}

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  highlight: boolean;
}

interface FooterColumn {
  heading: string;
  links: string[];
}

const FEATURES: Feature[] = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Sub-Millisecond Execution',
    desc: 'Co-located servers in 12 global data centers. Direct market access with 847μs median round-trip on major exchanges.',
    tag: 'Execution',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 10l3 3 3-4 3 3 3-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Strategy Backtester',
    desc: 'Test against 15+ years of tick-level data. Realistic slippage modeling, commission structures, and market impact simulation.',
    tag: 'Research',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Risk Management Engine',
    desc: 'Real-time drawdown limits, position sizing, and kill-switch controls. VaR and CVaR monitoring across all open positions.',
    tag: 'Risk',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    title: 'Market Data Feeds',
    desc: 'Level 2 order book, trade flow, and options chain data. 150+ exchanges and data sources consolidated into one normalized API.',
    tag: 'Data',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Portfolio Analytics',
    desc: 'Sharpe, Sortino, Calmar ratios. Attribution analysis, factor exposure, and custom benchmark comparisons in real time.',
    tag: 'Analytics',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'Python & REST API',
    desc: 'First-class Python SDK with async support. Webhooks, WebSocket streams, and FIX protocol for institutional integrations.',
    tag: 'Developer',
  },
];

const STRATEGIES: Strategy[] = [
  { name: 'Momentum Alpha',     type: 'Trend Following',       returns: '+142%', drawdown: '-8.2%',  sharpe: '2.41', status: 'active' },
  { name: 'Statistical Arb v3', type: 'Mean Reversion',        returns: '+89%',  drawdown: '-5.1%',  sharpe: '3.12', status: 'active' },
  { name: 'Vol Surface Edge',   type: 'Options Market Making', returns: '+67%',  drawdown: '-3.8%',  sharpe: '2.87', status: 'active' },
  { name: 'Cross-Asset Macro',  type: 'Global Macro',          returns: '+203%', drawdown: '-14.6%', sharpe: '1.93', status: 'paused' },
];

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '2499/-',
    period: '      /mo',
    desc: 'For independent traders exploring algo execution.',
    features: ['5 live strategies', '5 years backtest data', '1M API calls/month', 'Standard execution', 'Community support'],
    cta: 'Start Free Trial',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '5000/-',
    period: '      /mo',
    desc: 'For serious traders who need institutional-grade tools.',
    features: ['Unlimited strategies', '15 years tick data', 'Unlimited API calls', 'Co-location access', 'Priority support', 'Risk engine + VaR', 'Custom indicators'],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Institutional',
    price: 'Custom',
    period: '',
    desc: 'White-label infrastructure for funds and prop desks.',
    features: ['Dedicated infra', 'FIX protocol access', 'Prime brokerage integration', 'SLA guarantee', 'Dedicated engineer', 'Custom data feeds', 'Compliance reporting'],
    cta: 'Contact Sales',
    highlight: false,
  },
];

const LOGLINES: string[] = [
  '[08:42:31.004] SIGNAL BUY  BTC/USDT @ 67,842.50  QTY: 0.15',
  '[08:42:31.006] ORDER  SENT  exchange=BINANCE  id=ord_8a2f',
  '[08:42:31.009] FILL   100%  price=67,843.10  slippage=+0.60',
  '[08:42:55.118] SIGNAL SELL NVDA      @ 875.30    QTY: 120',
  '[08:42:55.120] ORDER  SENT  exchange=NASDAQ   id=ord_9c1e',
  '[08:42:55.124] FILL   100%  price=875.25    slippage=-0.05',
  '[08:43:12.882] RISK   CHECK drawdown=-1.2%  limit=-8.0%  OK',
  '[08:43:30.001] SIGNAL BUY  ETH/USDT @ 3,521.18  QTY: 2.5',
];

const FOOTER_COLS: FooterColumn[] = [
  { heading: 'Platform', links: ['Execution Engine', 'Backtester', 'Risk Manager', 'Market Data', 'API Reference'] },
  { heading: 'Company',  links: ['About', 'Blog', 'Careers', 'Press', 'Security'] },
  { heading: 'Legal',    links: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'Risk Disclaimer'] },
];

function getLogClass(line: string): string {
  if (line.includes('SIGNAL')) return styles.logSignal;
  if (line.includes('FILL'))   return styles.logFill;
  if (line.includes('RISK'))   return styles.logRisk;
  return styles.logOrder;
}

export default function Home() {
  return (
    <main className={styles.main}>
      <Navbar />

      {/* HERO */}
      <section className={styles.hero} id="platform">
        <div className={styles.heroBg}>
          <div className={styles.heroGlow1} />
          <div className={styles.heroGlow2} />
          <div className={styles.grid} />
        </div>
        <div className={styles.container}>
          <div className={styles.heroLayout}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <span className={styles.badgeDot} />
                Production-ready infrastructure
              </div>
              <h1 className={styles.heroTitle}>
                Trade faster than<br />
                <span className={styles.heroAccent}>the market thinks.</span>
              </h1>
              <p className={styles.heroDesc}>
                Institutional-grade algorithmic trading infrastructure. Deploy, backtest, and execute
                strategies across equities, crypto, and derivatives — with sub-millisecond latency.
              </p>
              <div className={styles.heroCta}>
                <a href="/terminal" className={styles.ctaPrimary}>🖥 Open Terminal</a>
                <a href="/recommend" className={styles.ctaSecondary}> AI Strategy Recommendation</a>
              </div>
            </div>

            <div className={styles.heroChart}>
              <LiveChart />
              <div className={styles.orderLog}>
                {LOGLINES.map((line, i) => (
                  <div key={i} className={styles.logLine} style={{ animationDelay: `${i * 0.12}s` }}>
                    <span className={getLogClass(line)}>{line.slice(0, 8)}</span>
                    <span className={styles.logText}>{line.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <Ticker />



      {/* FEATURES */}
      <section className={styles.section} id="strategies">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Platform</span>
            <h2 className={styles.sectionTitle}>Everything you need to<br />run serious strategies</h2>
            <p className={styles.sectionDesc}>
              From signal generation to trade settlement — the full stack, engineered for speed and reliability.
            </p>
          </div>
          <div className={styles.featGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} className={styles.featCard}>
                <div className={styles.featIcon}>{f.icon}</div>
                <div className={styles.featTag}>{f.tag}</div>
                <h3 className={styles.featTitle}>{f.title}</h3>
                <p className={styles.featDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STRATEGY TABLE */}
      <section className={styles.section} id="performance">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Performance</span>
            <h2 className={styles.sectionTitle}>Strategies that perform<br />across market regimes</h2>
            <p className={styles.sectionDesc}>
              Live results from community strategies running on Penn infrastructure.
            </p>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Strategy Name</th>
                  <th>Type</th>
                  <th>Total Return</th>
                  <th>Max Drawdown</th>
                  <th>Sharpe Ratio</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {STRATEGIES.map((s, i) => (
                  <tr key={i}>
                    <td><span className={styles.stratName}>{s.name}</span></td>
                    <td><span className={styles.stratType}>{s.type}</span></td>
                    <td><span className={styles.positive}>{s.returns}</span></td>
                    <td><span className={styles.negative}>{s.drawdown}</span></td>
                    <td><span className={styles.neutral}>{s.sharpe}</span></td>
                    <td>
                      <span className={`${styles.statusBadge} ${s.status === 'active' ? styles.statusActive : styles.statusPaused}`}>
                        <span className={styles.statusDot} />
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CODE SECTION */}
      <section className={styles.section} style={{ paddingTop: 0 }}>
        <div className={styles.container}>
          <div className={styles.codeLayout}>
            <div className={styles.codeContent}>
              <span className={styles.eyebrow}>Developer First</span>
              <h2 className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>
                Build your edge in Python.<br />Deploy in minutes.
              </h2>
              <p className={styles.sectionDesc} style={{ textAlign: 'left', maxWidth: '420px', marginBottom: '1.5rem' }}>
                Our Python SDK abstracts away infrastructure complexity. Write strategy logic, we handle
                the rest — order routing, risk checks, position tracking, and reconciliation.
              </p>
              <ul className={styles.codeFeatures}>
                {[
                  'Async-native SDK with WebSocket support',
                  'Type-safe order and position objects',
                  'Built-in backtesting harness',
                  'One-line paper trading mode',
                ].map(item => <li key={item}>{item}</li>)}
              </ul>
              <a href="/docs/PENN.pdf" 
                  download="PENN_Documentation.pdf" 
                  className={styles.ctaPrimary} 
                  style={{ display: 'inline-block', marginTop: '2rem' }}>
                  Download Documentation
              </a>
              <a href="/docs/PENN.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={styles.ctaSecondary} 
                  style={{ display: 'inline-block', marginTop: '2rem' }}>
                  View Documentation
              </a>

            </div>
            <div className={styles.codeBlock}>
              <div className={styles.codeHeader}>
                <div className={styles.codeDots}>
                  <span /><span /><span />
                </div>
                <span className={styles.codeFilename}>momentum_strategy.py</span>
              </div>
              <pre className={styles.codePre}><code>{`from Penn import Strategy, Signal
from penn.indicators import EMA, RSI

class MomentumAlpha(Strategy):
    """
    Trend-following with RSI filter.
    Runs live on Penn infrastructure.
    """

    def on_init(self):
        self.ema_fast = EMA(period=12)
        self.ema_slow = EMA(period=26)
        self.rsi = RSI(period=14)

    async def on_bar(self, bar):
        fast = self.ema_fast.update(bar.close)
        slow = self.ema_slow.update(bar.close)
        rsi  = self.rsi.update(bar.close)

        if fast > slow and rsi < 65:
            await self.submit(Signal.BUY,
                qty=self.risk.size(bar, risk_pct=0.01),
                stop_loss=bar.close * 0.985,
            )
        elif fast < slow:
            await self.close_all()

# Deploy to live trading
strategy = MomentumAlpha(
    symbol="BTC/USDT",
    exchange="binance",
    timeframe="15m",
)
await strategy.deploy()`}</code></pre>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className={styles.section} id="pricing">
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Pricing</span>
            <h2 className={styles.sectionTitle}>Scale as your edge grows</h2>
            <p className={styles.sectionDesc}>
              No hidden fees. No per-trade charges. Flat monthly pricing so your profitability is yours.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {PLANS.map((plan, i) => (
              <div key={i} className={`${styles.pricingCard} ${plan.highlight ? styles.pricingHighlight : ''}`}>
                {plan.highlight && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planPrice}>
                  {plan.price}<span className={styles.planPeriod}>{plan.period}</span>
                </div>
                <p className={styles.planDesc}>{plan.desc}</p>
                <ul className={styles.planFeatures}>
                  {plan.features.map((f, j) => (
                    <li key={j}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke={plan.highlight ? '#00FF88' : '#5A6A8A'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a href="#" className={plan.highlight ? styles.ctaPrimary : styles.ctaOutline}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaBannerBg} />
        <div className={styles.container}>
          <div className={styles.ctaBannerInner}>
            <h2 className={styles.ctaBannerTitle}>
              Your alpha is only as fast<br />as your infrastructure.
            </h2>
            <p className={styles.ctaBannerDesc}>
              Join 12,400+ strategies running on Penn today. 14-day free trial, no credit card required.
            </p>
            <div className={styles.ctaBannerActions}>
              <a href="/login" className={styles.ctaPrimary}>Start Free Trial</a>
              <a href="#" className={styles.ctaGhost}>Talk to an Engineer</a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path d="M2 16L8 8L12 12L16 6L20 10" stroke="#00FF88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="20" cy="10" r="2" fill="#00FF88"/>
                </svg>
                <span>Penn</span>
              </div>
              <p className={styles.footerTagline}>
                Institutional-grade algorithmic<br />trading infrastructure.
              </p>
              <div className={styles.footerStatus}>
                <span className={styles.statusDotGreen} />
                All systems operational
              </div>
            </div>
            {FOOTER_COLS.map(col => (
              <div key={col.heading} className={styles.footerCol}>
                <h4 className={styles.footerColHead}>{col.heading}</h4>
                <ul>
                  {col.links.map(link => (
                    <li key={link}><a href="#">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 Penn Technologies, Inc. All rights reserved.</span>
            <span>Not financial advice. Trading involves substantial risk of loss.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}