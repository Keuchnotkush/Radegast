"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TradeModal, StockLogo, P, ease, spring } from "./shared";
import type { TradeStock } from "./shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortfolio, MARKET, STOCK_COLORS, useSettings, useLiveMarket, useUser, useWallet } from "./store";
import { useFundWallet } from "@privy-io/react-auth";


/* ─── Compact number formatter ─── */
function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e5) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
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
  const wallet = useWallet();
  const { fundWallet } = useFundWallet();
  const isAutonomous = autoSession.active;

  // Use real wallet balance when available, fallback to mock cash
  const availableCash = wallet.address ? wallet.usdcBalance : cash;
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
        <div className="mb-14">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="text-3xl md:text-5xl font-bold leading-tight"
          >
            Good to see you,{" "}
            <motion.span
              style={{ color: P.jade }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4, ease }}
              className="inline-block"
            >
              {userName}
            </motion.span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4, ease }}
            className="text-lg mt-3" style={{ color: P.gray }}
          >
            Your money never sleeps — here&apos;s how it&apos;s doing today.
          </motion.p>
        </div>

        {/* PORTFOLIO HERO */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease }}
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 overflow-hidden">
            {/* Donut */}
            <DonutChart stocks={totalAllocations} cashPct={cashAllocation} total={total} />

            {/* Metrics + legend */}
            <div className="flex-1 flex flex-col gap-6 md:gap-8 w-full min-w-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                <MetricCard label="24h Return" value="—" sub="Coming soon" color={P.gray} index={0} />
                <MetricCard label="Invested" value={formatCompact(invested)} sub={`${portfolioStocks.length} stocks`} color={P.dark} index={1} />
                <MetricCard label="Available" value={formatCompact(availableCash)} sub="Ready to invest" color={P.jade} index={2} />
                <MetricCard label="All-time P&L" value="—" sub="Coming soon" color={P.gray} index={3} />
              </div>

              {/* Add Funds button */}
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, type: "spring", stiffness: 400, damping: 15 }}
                whileHover={{ scale: 1.08, y: -2 }}
                whileTap={{ scale: 0.9, rotate: -2 }}
                onClick={() => setShowAddFunds(true)}
                className="self-start flex items-center gap-2.5 py-3 px-7 rounded-full text-[14px] font-semibold cursor-pointer"
                style={{ background: P.jade, color: P.white }}
              >
                <motion.svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  animate={{ rotate: [0, 90, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                >
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </motion.svg>
                Add funds
              </motion.button>

              {/* Allocation bar */}
              <div>
                <div className="flex w-full h-3 rounded-full overflow-hidden gap-[1px]" style={{ background: `${P.border}30` }}>
                  {totalAllocations.map((s, i) => (
                    <motion.div
                      key={s.ticker}
                      initial={{ width: 0 }}
                      animate={{ width: `${s.allocation}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: s.color }}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                    />
                  ))}
                  {cashAllocation > 0.5 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${cashAllocation}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + totalAllocations.length * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: `${P.border}60` }}
                      className="h-full last:rounded-r-full"
                    />
                  )}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
                  {totalAllocations.map((s, i) => (
                    <motion.div
                      key={s.ticker}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                      <span className="text-[13px] font-medium" style={{ color: P.gray }}>
                        {s.name} · {s.allocation.toFixed(0)}%
                      </span>
                    </motion.div>
                  ))}
                  {cashAllocation > 0.5 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 + totalAllocations.length * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-3 h-3 rounded-full" style={{ background: `${P.border}60` }} />
                      <span className="text-[13px] font-medium" style={{ color: P.gray }}>
                        Cash · {cashAllocation.toFixed(0)}%
                      </span>
                    </motion.div>
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
        {showAddFunds && <AddFundsModal onClose={() => setShowAddFunds(false)} onAdd={addFunds} fundWallet={fundWallet} walletAddress={wallet.address} refreshBalance={wallet.refreshBalance} />}
      </AnimatePresence>
    </div>
  );
}

/* ═══ SUB-COMPONENTS ═══ */

function DonutChart({ stocks, cashPct, total }: { stocks: { ticker: string; allocation: number; color: string }[]; cashPct: number; total: number }) {
  const r = 68;
  const c = 2 * Math.PI * r;
  let cum = 0;

  // All stock colors for the animated rainbow ring
  const allColors = Object.values(STOCK_COLORS);
  const colorStops = allColors.map((color, i) => {
    const pct = (i / allColors.length) * 100;
    const nextPct = ((i + 1) / allColors.length) * 100;
    return `${color} ${pct}%, ${color} ${nextPct}%`;
  }).join(", ");

  return (
    <div className="relative w-48 h-48 md:w-72 md:h-72 flex-shrink-0">
      {/* Animated outer glow ring — all stock colors spinning */}
      <motion.div
        className="absolute inset-[-10px] rounded-full blur-[8px]"
        style={{
          background: `conic-gradient(${colorStops})`,
          mask: "radial-gradient(transparent 54%, black 58%, black 70%, transparent 74%)",
          WebkitMask: "radial-gradient(transparent 54%, black 58%, black 70%, transparent 74%)",
          opacity: 0.45,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />
      {/* Inner crisp rainbow ring (subtle, behind allocation) */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${colorStops})`,
          mask: "radial-gradient(transparent 60%, black 62%, black 70%, transparent 72%)",
          WebkitMask: "radial-gradient(transparent 60%, black 62%, black 70%, transparent 72%)",
          opacity: 0.18,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* SVG donut — actual allocation segments */}
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90 relative z-10">
        {/* Faint per-color base ring so all colors peek through */}
        {allColors.map((color, i) => {
          const segLen = c / allColors.length;
          const off = (i / allColors.length) * c;
          return (
            <motion.circle
              key={`bg-${i}`}
              cx="100" cy="100" r={r}
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeDasharray={`${segLen - 1} ${c - segLen + 1}`}
              strokeDashoffset={-off}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.12 }}
              transition={{ duration: 0.6, delay: 0.05 * i }}
            />
          );
        })}
        {/* Actual allocation segments */}
        {stocks.map((s, i) => {
          const off = (cum / 100) * c;
          const len = (s.allocation / 100) * c;
          cum += s.allocation;
          if (len < 0.5) return null;
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

      {/* Animated color dots orbiting the ring */}
      {allColors.slice(0, 6).map((color, i) => (
        <motion.div
          key={`dot-${i}`}
          className="absolute w-2.5 h-2.5 rounded-full z-20"
          style={{
            background: color,
            boxShadow: `0 0 8px ${color}80`,
            top: "50%",
            left: "50%",
          }}
          animate={{
            x: [
              Math.cos(((i * 60) * Math.PI) / 180) * (r + 8) - 5,
              Math.cos(((i * 60 + 360) * Math.PI) / 180) * (r + 8) - 5,
            ],
            y: [
              Math.sin(((i * 60) * Math.PI) / 180) * (r + 8) - 5,
              Math.sin(((i * 60 + 360) * Math.PI) / 180) * (r + 8) - 5,
            ],
            scale: [1, 1.4, 1],
          }}
          transition={{
            x: { duration: 12 + i * 2, repeat: Infinity, ease: "linear" },
            y: { duration: 12 + i * 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 },
          }}
        />
      ))}

      {/* Center text */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-20"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="text-xl md:text-3xl font-bold" style={{ color: P.dark }}>
          {formatCompact(total)}
        </span>
        <span className="text-[11px] md:text-[13px] font-medium mt-1" style={{ color: P.gray }}>Total balance</span>
      </motion.div>
    </div>
  );
}

/* ─── Add Funds Modal ─── */
function AddFundsModal({ onClose, onAdd, fundWallet, walletAddress, refreshBalance }: {
  onClose: () => void;
  onAdd: (amount: number) => void;
  fundWallet: (params: { address: string }) => Promise<unknown>;
  walletAddress: string | undefined;
  refreshBalance: () => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "done">("input");
  const [payMethod, setPayMethod] = useState<"card" | "apple">("card");
  const presets = [50, 100, 250, 500];
  const usd = parseFloat(amount) || 0;

  const handleAdd = useCallback(async () => {
    if (usd <= 0) return;

    if (walletAddress) {
      try {
        await fundWallet({ address: walletAddress });
        onAdd(usd);
        setStep("done");
        setTimeout(onClose, 1200);
        refreshBalance().catch(() => {});
      } catch (err) {
        console.error("[Fund] Error:", err);
        onAdd(usd);
        setStep("done");
        setTimeout(onClose, 1200);
      }
    } else {
      // Fallback: mock flow (no wallet connected)
      setStep("processing");
      setTimeout(() => {
        onAdd(usd);
        setStep("done");
        setTimeout(onClose, 1200);
      }, 1800);
    }
  }, [usd, onAdd, onClose, fundWallet, walletAddress, refreshBalance]);

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
        <div className="w-full max-w-[1440px] mx-auto px-5 md:px-16 pt-6 pb-10">
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
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 + index * 0.08, duration: 0.5, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ x: 10, scale: 1.01, backgroundColor: `${stock.color}06` }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-between py-5 w-full text-left cursor-pointer rounded-xl px-3 -mx-3"
      style={{ borderBottom: `1px solid ${P.border}25` }}
    >
      <div className="flex items-center gap-5">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5 + index * 0.08, type: "spring", stiffness: 500, damping: 18 }}
        >
          <StockLogo ticker={stock.ticker} name={stock.name} color={stock.color} size={48} />
        </motion.div>
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
        <motion.svg
          width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.border} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          whileHover={{ x: 4 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
        >
          <polyline points="9 18 15 12 9 6" />
        </motion.svg>
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
      <motion.polyline
        points={pts}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

function MetricCard({ label, value, sub, color, index = 0 }: { label: string; value: string; sub: string; color: string; index?: number }) {
  return (
    <motion.div
      className="py-4 min-w-0 overflow-hidden"
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.12, type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{ y: -4, scale: 1.03 }}
    >
      <motion.div
        className="h-[3px] rounded-full mb-3"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: 32 }}
        transition={{ duration: 0.6, delay: 0.5 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ fontFamily: "Lexend", color: P.gray }}>{label}</div>
      <motion.div
        className="text-lg md:text-2xl font-bold truncate"
        style={{ color }}
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, delay: 0.6 + index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        {value}
      </motion.div>
      <div className="text-[12px] md:text-[13px] font-medium mt-1 truncate" style={{ color: P.gray }}>{sub}</div>
    </motion.div>
  );
}

/* ─── Agent Activity ─── */
function AgentActivity({ isAutonomous }: { isAutonomous: boolean }) {
  const { address: walletAddress } = useWallet();
  const [data, setData] = useState<{
    consensus_label: string;
    consensus_score: number;
    suggestions: string[];
    moves: { token: string; action: string; pct: number }[];
    trade_results: { token: string; action: string; pct: number; tx_hash: string; success: boolean }[];
    timestamp: number;
  } | null>(null);

  useEffect(() => {
    const userId = walletAddress || "default";
    const poll = () => {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/agent/latest/${userId}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setData(d); })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => clearInterval(id);
  }, [walletAddress]);

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
