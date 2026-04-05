"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TradeModal, P, ease, spring } from "./shared";
import type { TradeStock } from "./shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortfolio, MARKET, STOCK_COLORS, logoUrl, useSettings, useLiveMarket, useUser } from "./store";

/* ─── Stock logo with fallback ─── */
function StockLogo({ ticker, name, color, size = 48 }: { ticker: string; name: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="rounded-xl flex items-center justify-center text-[14px] font-bold" style={{ width: size, height: size, background: color, color: "#FFFFFF" }}>
        {ticker.slice(0, 2)}
      </div>
    );
  }
  const dark = ticker === "AAPL";
  return (
    <img src={logoUrl(ticker)} alt={name} style={{ width: size, height: size, background: dark ? "#FFFFFF" : undefined, padding: dark ? 6 : undefined }} className="rounded-xl object-contain" onError={() => setFailed(true)} />
  );
}


export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const onboarded = localStorage.getItem("radegast_onboarded");
    const isNew = localStorage.getItem("radegast_isNew");
    if (isNew && !onboarded) {
      router.replace("/dashboard/onboarding");
    }
  }, [router]);

  const { firstName: userName, initial } = useUser();
  const { holdings, cash, totalValue, totalWithCash, addFunds } = usePortfolio();
  const { aiSuggestions, autoSession } = useSettings();
  const liveMarket = useLiveMarket();
  const isAutonomous = autoSession.active;
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showAddFunds, setShowAddFunds] = useState(false);

  // Build portfolio stocks from holdings + market data
  const portfolioStocks = holdings.map((h) => {
    const market = liveMarket.find((m) => m.ticker === h.ticker);
    if (!market) return null;
    const value = market.price * h.shares;
    return { ...market, shares: h.shares, value, color: STOCK_COLORS[h.ticker] || P.jade };
  }).filter(Boolean) as { ticker: string; name: string; price: number; change: number; sector: string; shares: number; value: number; color: string }[];

  const invested = totalValue();
  const total = totalWithCash();
  const totalAllocations = portfolioStocks.map((s) => ({ ...s, allocation: total > 0 ? (s.value / total) * 100 : 0 }));
  const cashAllocation = total > 0 ? (cash / total) * 100 : 0;

  const selectedStock = selectedTicker ? liveMarket.find((m) => m.ticker === selectedTicker) : null;
  const selectedHolding = selectedTicker ? holdings.find((h) => h.ticker === selectedTicker) : null;

  const tradeStock: TradeStock | null = selectedStock
    ? {
        symbol: selectedStock.ticker,
        name: selectedStock.name,
        price: selectedStock.price,
        change: selectedStock.change,
        color: STOCK_COLORS[selectedStock.ticker] || P.jade,
        held: selectedHolding?.shares,
        value: selectedHolding ? selectedStock.price * selectedHolding.shares : undefined,
      }
    : null;

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={initial} />

      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-16 pt-20 pb-16">

        {/* WELCOME */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-14"
        >
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Good to see you, <span style={{ color: P.jade }}>{userName}</span>.
          </h1>
          <p className="text-lg mt-3" style={{ color: P.gray }}>
            Your money never sleeps — here&apos;s how it&apos;s doing today.
          </p>
        </motion.div>

        {/* PORTFOLIO HERO */}
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.6, ease }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
            {/* Donut */}
            <div className="flex-shrink-0">
              <DonutChart stocks={totalAllocations} cashPct={cashAllocation} total={total} />
            </div>

            {/* Metrics + legend */}
            <div className="flex-1 flex flex-col gap-6 md:gap-8 w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                <MetricCard label="24h Return" value="—" sub="Coming soon" color={P.gray} />
                <MetricCard label="Invested" value={`$${invested.toLocaleString("en-US", { maximumFractionDigits: 0 })}`} sub={`${portfolioStocks.length} stocks`} color={P.dark} />
                <MetricCard label="Available" value={`$${cash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Ready to invest" color={P.jade} />
                <MetricCard label="All-time P&L" value="—" sub="Coming soon" color={P.gray} />
              </div>

              {/* Add Funds button */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                onClick={() => setShowAddFunds(true)}
                className="self-start flex items-center gap-2.5 py-3 px-7 rounded-full text-[14px] font-semibold cursor-pointer"
                style={{ background: P.jade, color: P.white }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add funds
              </motion.button>

              {/* Allocation bar */}
              <div>
                <div className="flex w-full h-3 rounded-full overflow-hidden gap-[1px]" style={{ background: `${P.border}30` }}>
                  {totalAllocations.map((s) => (
                    <div key={s.ticker} style={{ width: `${s.allocation}%`, background: s.color }} className="h-full first:rounded-l-full last:rounded-r-full" />
                  ))}
                  {cashAllocation > 0.5 && (
                    <div style={{ width: `${cashAllocation}%`, background: `${P.border}60` }} className="h-full last:rounded-r-full" />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                  {totalAllocations.map((s) => (
                    <div key={s.ticker} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span className="text-[13px] font-medium" style={{ color: P.gray }}>
                        {s.name} · {s.allocation.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {cashAllocation > 0.5 && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: `${P.border}60` }} />
                      <span className="text-[13px] font-medium" style={{ color: P.gray }}>
                        Cash · {cashAllocation.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* AI ACTIVITY */}
        {aiSuggestions && <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <SectionTitle>AI Activity</SectionTitle>
            </div>
            <Link href="/dashboard/advisor" className="text-[12px] font-semibold" style={{ color: P.jade }}>
              Configure
            </Link>
          </div>

          <AgentActivity isAutonomous={isAutonomous} />
        </motion.section>}

        {/* STOCKS LIST */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease }}
        >
          <SectionTitle>Your stocks</SectionTitle>
          {totalAllocations.length > 0 ? (
            <div className="mt-6 flex flex-col">
              {totalAllocations.map((s, i) => (
                <StockRow key={s.ticker} stock={s} index={i} onSelect={() => setSelectedTicker(s.ticker)} />
              ))}
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center text-center py-12">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </div>
              <p className="text-[14px] font-medium" style={{ color: P.dark }}>No stocks yet</p>
              <p className="text-[12px] mt-1 mb-5" style={{ color: P.gray }}>Add funds and start investing to see your portfolio here.</p>
              <Link href="/dashboard/invest">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="inline-flex items-center gap-2 py-3 px-7 rounded-full text-[14px] font-semibold cursor-pointer"
                  style={{ background: P.jade, color: P.white }}
                >
                  Browse stocks
                </motion.span>
              </Link>
            </div>
          )}
        </motion.section>
      </div>

      <AnimatePresence>
        {tradeStock && <TradeModal stock={tradeStock} onClose={() => setSelectedTicker(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} onAdd={addFunds} />}
      </AnimatePresence>
    </div>
  );
}

/* ═══ SUB-COMPONENTS ═══ */

function DonutChart({ stocks, cashPct, total }: { stocks: { ticker: string; allocation: number; color: string }[]; cashPct: number; total: number }) {
  const r = 68;
  const c = 2 * Math.PI * r;
  let cum = 0;

  return (
    <div className="relative w-52 h-52 md:w-80 md:h-80">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <circle cx="100" cy="100" r={r} fill="none" stroke={`${P.border}30`} strokeWidth="14" />
        {stocks.map((s, i) => {
          const off = (cum / 100) * c;
          const len = (s.allocation / 100) * c;
          cum += s.allocation;
          return (
            <motion.circle
              key={s.ticker}
              cx="100" cy="100" r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${c}`, strokeDashoffset: -off }}
              animate={{ strokeDasharray: `${len - 2} ${c - len + 2}`, strokeDashoffset: -off }}
              transition={{ duration: 0.8, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })}
        {cashPct > 0.5 && (() => {
          const off = (cum / 100) * c;
          const len = (cashPct / 100) * c;
          return (
            <motion.circle
              cx="100" cy="100" r={r}
              fill="none"
              stroke={`${P.border}80`}
              strokeWidth="14"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${c}`, strokeDashoffset: -off }}
              animate={{ strokeDasharray: `${len - 2} ${c - len + 2}`, strokeDashoffset: -off }}
              transition={{ duration: 0.8, delay: 0.15 * stocks.length, ease: [0.22, 1, 0.36, 1] }}
            />
          );
        })()}
      </svg>
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="text-4xl font-bold" style={{ color: P.dark }}>
          ${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </span>
        <span className="text-[13px] font-medium mt-1.5" style={{ color: P.gray }}>Total balance</span>
      </motion.div>
    </div>
  );
}

/* ─── Add Funds Modal ─── */
function AddFundsModal({ onClose, onAdd }: { onClose: () => void; onAdd: (amount: number) => void }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "done">("input");
  const [payMethod, setPayMethod] = useState<"card" | "apple">("card");
  const presets = [50, 100, 250, 500];
  const usd = parseFloat(amount) || 0;

  const handleAdd = useCallback(() => {
    if (usd <= 0) return;
    setStep("processing");
    // TODO: replace with Dynamic onramp (Coinbase)
    setTimeout(() => {
      onAdd(usd);
      setStep("done");
      setTimeout(onClose, 1200);
    }, 1800);
  }, [usd, onAdd, onClose]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(42,42,42,0.4)", backdropFilter: "blur(4px)" }}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl"
        style={{ background: P.surface }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-16 pt-6 pb-10">
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 rounded-full" style={{ background: P.border }} />
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Add funds</h2>
            <button onClick={onClose} className="p-2 rounded-full cursor-pointer" style={{ background: `${P.border}30` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === "input" && (
              <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <p className="text-[13px] mb-5" style={{ color: P.gray }}>
                  Add money from your card or Apple Pay. Funds are available instantly.
                </p>

                <div className="relative mb-4">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: P.gray }}>$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0.00"
                    className="w-full py-4 pl-9 pr-4 rounded-xl text-2xl font-bold outline-none"
                    style={{ background: `${P.border}15`, color: P.dark, border: `1.5px solid ${P.border}40` }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}40`)}
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 mb-6">
                  {presets.map((p) => {
                    const selected = amount === p.toString();
                    return (
                      <motion.button
                        key={p}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={spring}
                        onClick={() => setAmount(p.toString())}
                        className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
                        style={{
                          background: selected ? P.jade : `${P.border}20`,
                          color: selected ? P.white : P.dark,
                        }}
                      >
                        ${p}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Payment methods */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: "Lexend", color: P.gray }}>Payment method</div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      onClick={() => setPayMethod("card")}
                      className="flex-1 flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer"
                      style={{ border: `1.5px solid ${payMethod === "card" ? P.jade : `${P.border}40`}`, background: payMethod === "card" ? `${P.jade}08` : "transparent" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      <span className="text-[13px] font-semibold">Card</span>
                      {payMethod === "card" && <div className="ml-auto w-4 h-4 rounded-full" style={{ background: P.jade }} />}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      onClick={() => setPayMethod("apple")}
                      className="flex-1 flex items-center gap-3 py-3 px-4 rounded-xl cursor-pointer"
                      style={{ border: `1.5px solid ${payMethod === "apple" ? P.jade : `${P.border}40`}`, background: payMethod === "apple" ? `${P.jade}08` : "transparent" }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                      </svg>
                      <span className="text-[13px] font-semibold">Apple Pay</span>
                      {payMethod === "apple" && <div className="ml-auto w-4 h-4 rounded-full" style={{ background: P.jade }} />}
                    </motion.button>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={handleAdd}
                  className="w-full py-4 rounded-xl text-[15px] font-bold cursor-pointer"
                  style={{ background: P.jade, color: P.white, opacity: usd > 0 ? 1 : 0.5 }}
                >
                  Add ${usd > 0 ? usd.toFixed(2) : "0.00"}
                </motion.button>

                <p className="text-[11px] text-center mt-3" style={{ color: P.gray }}>
                  No fees · Instant · Secured by 256-bit encryption
                </p>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-12">
                <div className="w-10 h-10 rounded-full animate-spin mb-4" style={{ border: `3px solid ${P.border}30`, borderTopColor: P.jade }} />
                <p className="text-[15px] font-semibold">Adding funds...</p>
                <p className="text-[12px] mt-1" style={{ color: P.gray }}>Verifying payment</p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[18px] font-bold">${usd.toFixed(2)} added</p>
                <p className="text-[13px] mt-1" style={{ color: P.gray }}>Funds are ready to invest</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

function StockRow({ stock, index, onSelect }: { stock: { ticker: string; name: string; price: number; change: number; shares: number; value: number; color: string; allocation: number }; index: number; onSelect: () => void }) {
  const isUp = stock.change >= 0;
  return (
    <motion.button
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.38 + index * 0.05, duration: 0.35, ease }}
      whileHover={{ x: 6 }}
      className="flex items-center justify-between py-5 w-full text-left cursor-pointer"
      style={{ borderBottom: `1px solid ${P.border}25` }}
    >
      <div className="flex items-center gap-5">
        <StockLogo ticker={stock.ticker} name={stock.name} color={stock.color} size={48} />
        <div>
          <div className="text-[16px] font-semibold">{stock.name}</div>
          <div className="text-[12px]" style={{ color: P.gray }}>
            {stock.shares.toFixed(2)} shares · {stock.allocation.toFixed(0)}%
          </div>
        </div>
      </div>
      <div className="flex items-center gap-8">
        <div className="hidden md:block"><MiniChart color={stock.color} trend={isUp ? "up" : "down"} /></div>
        <div className="text-right w-28">
          <div className="text-[16px] font-semibold">${stock.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
          <div className="text-[13px] font-medium" style={{ color: isUp ? P.gain : P.loss }}>
            {isUp ? "+" : ""}{stock.change.toFixed(2)}%
          </div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </motion.button>
  );
}

function MiniChart({ color, trend }: { color: string; trend: "up" | "down" }) {
  const pts = trend === "up"
    ? "0,28 18,24 36,26 54,18 72,20 90,12 108,14 126,6 140,8"
    : "0,8 18,12 36,10 54,18 72,16 90,22 108,20 126,26 140,24";
  const id = `chart-${color.replace("#", "")}`;
  return (
    <svg width="140" height="32" viewBox="0 0 140 32" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${pts} 140,32`} fill={`url(#${id})`} />
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="py-4">
      <div className="w-8 h-[3px] rounded-full mb-3" style={{ background: color }} />
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ fontFamily: "Lexend", color: P.gray }}>{label}</div>
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-[13px] font-medium mt-1" style={{ color: P.gray }}>{sub}</div>
    </div>
  );
}

/* ─── Agent Activity ─── */
function AgentActivity({ isAutonomous }: { isAutonomous: boolean }) {
  const [data, setData] = useState<{
    consensus_label: string;
    consensus_score: number;
    suggestions: string[];
    moves: { token: string; action: string; pct: number }[];
    trade_results: { token: string; action: string; pct: number; tx_hash: string; success: boolean }[];
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const poll = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/agent/latest/default`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setData(d); })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col items-center text-center py-10">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <p className="text-[14px] font-medium" style={{ color: P.dark }}>No AI activity yet</p>
        <p className="text-[12px] mt-1" style={{ color: P.gray }}>
          {isAutonomous ? "Autonomous trading is active — trades will appear here." : "Enable the AI advisor to see recommendations."}
        </p>
      </div>
    );
  }

  const riskColor = data.consensus_label === "HIGH" ? P.loss : data.consensus_label === "LOW" ? P.gain : "#C8A415";
  const items = data.trade_results.length > 0 ? data.trade_results : data.moves;
  const ago = Math.round((Date.now() / 1000 - data.timestamp) / 60);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
          style={{ background: `${riskColor}18`, color: riskColor }}>
          {data.consensus_label} — {data.consensus_score.toFixed(0)}
        </span>
        <span className="text-[11px]" style={{ color: P.gray }}>{ago < 1 ? "just now" : `${ago}m ago`}</span>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((m, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 px-4 rounded-xl" style={{ background: P.surface, border: `1px solid ${P.border}30` }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold"
                style={{ background: m.action === "buy" ? `${P.gain}15` : `${P.loss}15`, color: m.action === "buy" ? P.gain : P.loss }}>
                {m.action === "buy" ? "+" : "−"}
              </div>
              <span className="text-[13px] font-semibold">{m.token}</span>
              <span className="text-[12px]" style={{ color: P.gray }}>{m.action.toUpperCase()} {m.pct.toFixed(1)}%</span>
              {"tx_hash" in m && (
                <span className="ml-auto text-[10px] font-mono" style={{ color: P.gray }}>
                  {(m as { tx_hash: string }).tx_hash?.slice(0, 12)}...
                </span>
              )}
            </div>
          ))}
        </div>
      ) : data.suggestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          {data.suggestions.slice(0, 3).map((s, i) => (
            <p key={i} className="text-[13px] py-2 px-4 rounded-xl" style={{ background: P.surface, color: P.dark }}>{s}</p>
          ))}
        </div>
      ) : (
        <p className="text-[13px]" style={{ color: P.gray }}>Portfolio is balanced — no action needed.</p>
      )}
    </div>
  );
}
