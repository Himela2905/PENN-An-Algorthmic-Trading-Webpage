"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Shield,
  ShieldCheck,
  Calendar,
  Globe,
  Key,
  Copy,
  Check,
  Pencil,
  TrendingUp,
  TrendingDown,
  Link2,
  LogOut,
  Play,
  Pause,
  Square,
  Webhook,
  RefreshCw,
  ActivitySquare,
  Gauge,
} from "lucide-react";

/**
 * Penn — Trader Profile
 * Palette pulled from the marketing site: near-black canvas, mint/teal
 * signature accent, monospace used for anything numeric or system-generated
 * (prices, keys, logs) — sans-serif reserved for labels and prose.
 */

// ---------------------------------------------------------------------------
// Mock data — replace with real account/session/strategy data on integration.
// ---------------------------------------------------------------------------

const USER = {
  name: "Arindam Basak",
  handle: "@arindam.b",
  email: "arindam.basak@pennquant.io",
  plan: "Quant Pro",
  memberSince: "Feb 2025",
  timezone: "Asia/Kolkata (UTC+5:30)",
  baseCurrency: "USD",
  kycStatus: "Verified",
  twoFactor: true,
};

const PERFORMANCE = [
  { label: "Portfolio Value", value: "$284,912.40", delta: "+2.4%", up: true },
  { label: "Net P&L (30d)", value: "$18,204.10", delta: "+6.8%", up: true },
  { label: "Sharpe Ratio", value: "1.94", delta: "+0.12", up: true },
  { label: "Max Drawdown", value: "-4.7%", delta: "limit -8.0%", up: true },
  { label: "Win Rate", value: "63.2%", delta: "-1.1%", up: false },
  { label: "Avg Fill Latency", value: "38ms", delta: "-6ms", up: true },
];

const STRATEGIES = [
  {
    name: "BTC Momentum v3",
    instrument: "BTC/USDT",
    status: "running" as const,
    pnl: "+$4,812.20",
    up: true,
    allocation: "22%",
    sharpe: "2.1",
  },
  {
    name: "NVDA Mean Reversion",
    instrument: "NASDAQ",
    status: "running" as const,
    pnl: "+$2,340.55",
    up: true,
    allocation: "18%",
    sharpe: "1.6",
  },
  {
    name: "ETH Breakout",
    instrument: "ETH/USDT",
    status: "paused" as const,
    pnl: "-$310.00",
    up: false,
    allocation: "9%",
    sharpe: "0.8",
  },
  {
    name: "SPY Pairs Hedge",
    instrument: "SPY / QQQ",
    status: "stopped" as const,
    pnl: "+$980.40",
    up: true,
    allocation: "0%",
    sharpe: "1.1",
  },
];

const EXCHANGES = [
  { name: "Binance", status: "Connected", latency: "42ms" },
  { name: "NASDAQ (via IBKR)", status: "Connected", latency: "11ms" },
  { name: "Coinbase", status: "Not connected", latency: "—" },
];

const RISK_LIMITS = [
  { label: "Max drawdown limit", value: "-8.0%" },
  { label: "Max position size", value: "$50,000" },
  { label: "Max leverage", value: "3.0x" },
  { label: "Slippage tolerance", value: "0.15%" },
];

const LOG_LINES = [
  "SIGNAL BUY BTC/USDT @ 67,842.50 QTY: 0.15",
  "ORDER SENT exchange=BINANCE id=ord_8a2f",
  "FILL 100% price=67,843.10 slippage=+0.60",
  "SIGNAL SELL NVDA @ 875.30 QTY: 120",
  "ORDER SENT exchange=NASDAQ id=ord_9c1e",
  "FILL 100% price=875.25 slippage=-0.05",
  "RISK CHECK drawdown=-1.2% limit=-8.0% OK",
  "SIGNAL BUY ETH/USDT @ 3,521.18 QTY: 2.5",
  "STRATEGY paused ETH Breakout — manual override",
  "SIGNAL SELL SPY @ 538.72 QTY: 40",
];

// ---------------------------------------------------------------------------

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timestamp() {
  const d = new Date();
  return d.toTimeString().slice(0, 8);
}

function PerfCard({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between">
        <span className="font-mono text-xl text-slate-100">{value}</span>
        <span
          className={`flex items-center gap-1 text-xs font-mono ${
            up ? "text-[#2FE6A6]" : "text-rose-400"
          }`}
        >
          {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </span>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-3 last:border-0">
      <div className="flex items-center gap-2.5 text-slate-500">
        <Icon size={15} strokeWidth={1.75} />
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-mono text-slate-200">{value}</span>
    </div>
  );
}

function StatusPill({ status }: { status: "running" | "paused" | "stopped" }) {
  const map = {
    running: { icon: Play, cls: "bg-[#2FE6A6]/10 text-[#2FE6A6]", label: "Running" },
    paused: { icon: Pause, cls: "bg-amber-400/10 text-amber-300", label: "Paused" },
    stopped: { icon: Square, cls: "bg-slate-500/10 text-slate-400", label: "Stopped" },
  }[status];
  const Icon = map.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${map.cls}`}
    >
      <Icon size={10} />
      {map.label}
    </span>
  );
}

export default function ProfilePage() {
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedHook, setCopiedHook] = useState(false);
  const [lines, setLines] = useState(
    LOG_LINES.slice(0, 5).map((l) => ({ time: timestamp(), text: l }))
  );
  const logRef = useRef<HTMLDivElement>(null);
  const apiKey = "pk_live_8f2c1d4a9e7b0031";
  const webhookUrl = "https://hooks.pennquant.io/v1/signals/8a2f9c1e";

  // Lightweight ambient tick to echo the live signal feed from the homepage.
  useEffect(() => {
    let i = 5;
    const id = setInterval(() => {
      setLines((prev) => {
        const next = [
          ...prev,
          { time: timestamp(), text: LOG_LINES[i % LOG_LINES.length] },
        ].slice(-8);
        i += 1;
        return next;
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines]);

  const copy = (text: string, setter: (v: boolean) => void) => {
    setter(true);
    window.setTimeout(() => setter(false), 1500);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0d0f] text-slate-100">
      {/* Top bar — mirrors the marketing site header */}
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 sm:px-10">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-[#2FE6A6]" />
          <span className="text-lg font-semibold tracking-tight">Penn</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-slate-400 sm:flex">
          <a href="#" className="hover:text-slate-200 transition-colors">
            Backtest
          </a>
          <a href="#" className="hover:text-slate-200 transition-colors">
            About
          </a>
        </nav>
        <button className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-sm text-slate-300 hover:border-white/20 hover:text-white transition-colors">
          <LogOut size={14} />
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        {/* Identity card */}
        <section className="flex flex-col gap-6 rounded-xl border border-white/10 bg-white/[0.02] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2FE6A6]/20 to-[#2FE6A6]/5 text-lg font-semibold text-[#2FE6A6] ring-1 ring-[#2FE6A6]/30">
              {initials(USER.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">{USER.name}</h1>
                <span className="rounded-full bg-[#2FE6A6]/10 px-2 py-0.5 text-[11px] font-medium text-[#2FE6A6] ring-1 ring-[#2FE6A6]/20">
                  {USER.plan}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{USER.handle}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                <Calendar size={12} />
                Member since {USER.memberSince}
              </p>
            </div>
          </div>
          <button className="flex items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5 transition-colors">
            <Pencil size={14} />
            Edit profile
          </button>
        </section>

        {/* Performance overview */}
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-slate-500">
            <Gauge size={14} />
            <h2 className="text-sm font-semibold text-slate-300">
              Performance overview
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {PERFORMANCE.map((s) => (
              <PerfCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Strategies */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Active strategies
                  </h2>
                  <p className="text-xs text-slate-500">
                    Deployed algorithms currently allocated capital.
                  </p>
                </div>
                <button className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:border-white/20 hover:text-white transition-colors">
                  Deploy new
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="pb-2 font-medium">Strategy</th>
                      <th className="pb-2 font-medium">Instrument</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium">Alloc.</th>
                      <th className="pb-2 font-medium">Sharpe</th>
                      <th className="pb-2 text-right font-medium">P&amp;L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STRATEGIES.map((s) => (
                      <tr
                        key={s.name}
                        className="border-t border-white/[0.06]"
                      >
                        <td className="py-2.5 text-slate-200">{s.name}</td>
                        <td className="py-2.5 font-mono text-xs text-slate-400">
                          {s.instrument}
                        </td>
                        <td className="py-2.5">
                          <StatusPill status={s.status} />
                        </td>
                        <td className="py-2.5 font-mono text-xs text-slate-400">
                          {s.allocation}
                        </td>
                        <td className="py-2.5 font-mono text-xs text-slate-400">
                          {s.sharpe}
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono text-xs ${
                            s.up ? "text-[#2FE6A6]" : "text-rose-400"
                          }`}
                        >
                          {s.pnl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Risk & execution settings */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="mb-1 text-sm font-semibold text-slate-200">
                Risk &amp; execution limits
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Global guardrails enforced across every strategy before an
                order reaches the exchange.
              </p>
              <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
                {RISK_LIMITS.map((r) => (
                  <div key={r.label} className="py-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      {r.label}
                    </p>
                    <p className="mt-1 font-mono text-sm text-slate-200">
                      {r.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Exchanges */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">
                    Connected exchanges
                  </h2>
                  <p className="text-xs text-slate-500">
                    Live venues linked to your execution account.
                  </p>
                </div>
                <button className="text-xs text-[#2FE6A6] hover:text-[#5cf0bd]">
                  Manage
                </button>
              </div>
              <div className="space-y-2">
                {EXCHANGES.map((ex) => (
                  <div
                    key={ex.name}
                    className="flex items-center justify-between rounded-md border border-white/[0.06] px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <Link2 size={14} className="text-slate-500" />
                      <span className="text-sm text-slate-200">{ex.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-slate-500">
                        {ex.latency}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          ex.status === "Connected"
                            ? "text-[#2FE6A6]"
                            : "text-slate-500"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* API & webhooks */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="mb-1 text-sm font-semibold text-slate-200">
                API &amp; webhooks
              </h2>
              <p className="mb-3 text-xs text-slate-500">
                Credentials used by your bots and signal sources.
              </p>

              <div className="py-2">
                <div className="mb-2 flex items-center gap-2.5 text-slate-500">
                  <Key size={15} strokeWidth={1.75} />
                  <span className="text-sm">API key</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-black/40 px-3 py-2 font-mono text-xs text-slate-300">
                  <span>{apiKey}</span>
                  <button
                    onClick={() => copy(apiKey, setCopiedKey)}
                    className="text-slate-500 hover:text-[#2FE6A6] transition-colors"
                    aria-label="Copy API key"
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <div className="py-2">
                <div className="mb-2 flex items-center gap-2.5 text-slate-500">
                  <Webhook size={15} strokeWidth={1.75} />
                  <span className="text-sm">Signal webhook</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-black/40 px-3 py-2 font-mono text-xs text-slate-300">
                  <span className="truncate">{webhookUrl}</span>
                  <button
                    onClick={() => copy(webhookUrl, setCopiedHook)}
                    className="ml-2 shrink-0 text-slate-500 hover:text-[#2FE6A6] transition-colors"
                    aria-label="Copy webhook URL"
                  >
                    {copiedHook ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              <button className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-white/10 py-2 text-xs text-slate-300 hover:border-white/20 hover:text-white transition-colors">
                <RefreshCw size={12} />
                Rotate credentials
              </button>
            </section>

            {/* Security */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="mb-1 text-sm font-semibold text-slate-200">
                Security
              </h2>
              <InfoRow icon={Mail} label="Email" value={USER.email} />
              <InfoRow icon={Globe} label="Timezone" value={USER.timezone} />
              <InfoRow
                icon={User}
                label="Base currency"
                value={USER.baseCurrency}
              />
              <InfoRow
                icon={ShieldCheck}
                label="KYC status"
                value={USER.kycStatus}
              />
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2.5 text-slate-500">
                  <Shield size={15} strokeWidth={1.75} />
                  <span className="text-sm">Two-factor auth</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    USER.twoFactor
                      ? "bg-[#2FE6A6]/10 text-[#2FE6A6]"
                      : "bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {USER.twoFactor ? "Enabled" : "Disabled"}
                </span>
              </div>
            </section>

            {/* Live execution log — signature element, echoes homepage feed */}
            <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <div className="mb-2 flex items-center gap-2 text-slate-500">
                <ActivitySquare size={14} />
                <h2 className="text-sm font-semibold text-slate-200">
                  Live execution log
                </h2>
              </div>
              <div
                ref={logRef}
                className="h-48 space-y-1.5 overflow-y-auto rounded-md bg-black/40 p-3 font-mono text-[11px] leading-relaxed"
              >
                {lines.map((l, i) => (
                  <p key={i} className="text-slate-400">
                    <span className="text-[#2FE6A6]/70">[{l.time}]</span>{" "}
                    <span className="text-slate-300">{l.text}</span>
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}