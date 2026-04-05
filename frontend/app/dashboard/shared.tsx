"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortfolio, useWallet, logoUrl } from "./store";
import { P, ease, spring } from "../lib/theme";

/* ─── Bottom Tab Bar (mobile, Revolut/Trade Republic style) ─── */
export function BottomTabBar() {
  const pathname = usePathname();

  const tabs = [
    {
      href: "/dashboard",
      label: "Portfolio",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      isActive: pathname === "/dashboard",
    },
    {
      href: "/dashboard/invest",
      label: "Invest",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      ),
      isActive: pathname.startsWith("/dashboard/invest"),
    },
    {
      href: "/dashboard/chat",
      label: "Chat",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      isActive: pathname.startsWith("/dashboard/chat"),
    },
    {
      href: "/dashboard/advisor",
      label: "AI",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4z" />
          <path d="M6 10v1a6 6 0 0 0 12 0v-1" />
          <line x1="12" y1="17" x2="12" y2="22" />
          <line x1="8" y1="22" x2="16" y2="22" />
        </svg>
      ),
      isActive: pathname.startsWith("/dashboard/advisor"),
    },
    {
      href: "/dashboard/solvency",
      label: "Proof",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      isActive: pathname.startsWith("/dashboard/solvency"),
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
        </svg>
      ),
      isActive: pathname.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t"
      style={{
        background: "#F0EDE8",
        borderColor: "#C4C4C430",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className="flex flex-col items-center gap-0.5 py-2 px-3"
          style={{ color: tab.isActive ? "#38A88A" : "#6B6B6B" }}
        >
          {tab.icon}
          <span className="text-[10px] font-semibold">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}

/* ─── Re-export theme tokens for backward compat ─── */
export { P, ease, spring } from "../lib/theme";

/* ─── Nav Avatar (shared across all dashboard pages) ─── */
export function NavAvatar({ initial }: { initial: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Portfolio" },
    { href: "/dashboard/invest", label: "Invest" },
    { href: "/dashboard/chat", label: "Chat" },
    { href: "/dashboard/advisor", label: "Advisor" },
    { href: "/dashboard/solvency", label: "Solvency" },
    { href: "/dashboard/settings", label: "Settings" },
  ];

  return (
    <motion.div
      className="fixed top-4 right-8 z-40 hidden md:flex items-center rounded-full cursor-pointer"
      style={{ background: P.surface, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <motion.div
        animate={{
          maxWidth: open ? 520 : 0,
          paddingLeft: open ? 24 : 0,
          paddingRight: open ? 8 : 0,
          opacity: open ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease }}
        className="flex items-center gap-6 overflow-hidden"
      >
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <motion.div key={l.href} whileHover={{ scale: 1.12 }} transition={spring} className="whitespace-nowrap">
              <Link href={l.href} className="text-[13px] font-medium" style={{ color: active ? P.dark : P.gray }}>
                {l.label}
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
      <Link href="/dashboard/settings" className="p-[12px] shrink-0">
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ background: P.terracotta, color: P.white }}
        >
          {initial}
        </motion.div>
      </Link>
    </motion.div>
  );
}

/* ─── Section Title ─── */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ fontFamily: "Lexend", color: P.gray }}>{children}</h3>;
}

/* ─── Stock Logo (shared across dashboard) ─── */
export function StockLogo({ ticker, name, color, size = 48, radius = "xl" }: {
  ticker: string; name: string; color: string; size?: number; radius?: "xl" | "2xl";
}) {
  const [failed, setFailed] = useState(false);
  const r = radius === "2xl" ? "rounded-2xl" : "rounded-xl";
  if (failed) {
    return (
      <div className={`${r} flex items-center justify-center font-bold shrink-0`}
        style={{ width: size, height: size, fontSize: size * 0.28, background: color, color: P.white }}>
        {ticker.replace("x", "").slice(0, 2)}
      </div>
    );
  }
  const dark = ticker === "AAPL" || ticker === "xAAPL";
  return (
    <img src={logoUrl(ticker)} alt={name}
      className={`${r} object-contain shrink-0`}
      style={{ width: size, height: size, background: dark ? "#FFFFFF" : undefined, padding: dark ? Math.round(size * 0.12) : undefined }}
      onError={() => setFailed(true)} />
  );
}

/* ─── Buy/Sell Modal (Phantom-style slide-up) ─── */
export interface TradeStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  color: string;
  held?: number;
  value?: number;
  prefillAmount?: number;
  prefillTab?: "buy" | "sell";
}

const PERIODS = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Period = (typeof PERIODS)[number];


function usePriceHistory(ticker: string, period: Period) {
  const [data, setData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const cacheRef = useRef<Record<string, number[]>>({});

  useEffect(() => {
    const key = `${ticker}-${period}`;
    if (cacheRef.current[key]) {
      setData(cacheRef.current[key]);
      return;
    }

    setLoading(true);
    const symbol = ticker.replace("x", "");

    fetch(`/api/chart?symbol=${encodeURIComponent(symbol)}&period=${period}`)
      .then((r) => r.json())
      .then((json) => {
        const cleaned: number[] = json?.prices ?? [];
        if (cleaned.length > 0) {
          cacheRef.current[key] = cleaned;
          setData(cleaned);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ticker, period]);

  return { data, loading };
}

function pricesToSvgPoints(prices: number[], width: number, height: number): string {
  if (prices.length < 2) return "";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const pad = 4;

  return prices
    .map((p, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = pad + ((max - p) / range) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function ModalStockLogo({ ticker, name, color }: { ticker: string; name: string; color: string }) {
  return <StockLogo ticker={ticker} name={name} color={color} size={56} radius="2xl" />;
}

export function TradeModal({ stock, onClose }: { stock: TradeStock; onClose: () => void }) {
  const [tab, setTab] = useState<"buy" | "sell">(stock.prefillTab || "buy");
  const [amount, setAmount] = useState(stock.prefillAmount ? stock.prefillAmount.toString() : "");
  const [period, setPeriod] = useState<Period>("1M");
  const [step, setStep] = useState<"input" | "confirm" | "processing" | "done">("input");
  const [txHashes, setTxHashes] = useState<{ step: string; txHash: string }[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const isUp = stock.change >= 0;
  const presets = [10, 50, 100, 500];

  const { address: walletAddress } = useWallet();
  const ticker = stock.symbol.replace("x", "");
  const { data: prices, loading } = usePriceHistory(ticker, period);
  const portfolio = usePortfolio();

  const usdAmount = parseFloat(amount) || 0;

  // Auto-scroll to bottom when step changes or amount is entered
  useEffect(() => {
    if ((step !== "input" || usdAmount > 0) && panelRef.current) {
      const timer = setTimeout(() => {
        panelRef.current?.scrollTo({ top: panelRef.current.scrollHeight, behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, usdAmount]);
  const shares = usdAmount > 0 ? usdAmount / stock.price : 0;
  const insufficientFunds = false; // on-chain minting — no local cash check needed

  const handleReview = useCallback(() => {
    if (usdAmount <= 0) return;
    setStep("confirm");
  }, [usdAmount]);

  const handleConfirm = useCallback(async () => {
    setStep("processing");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/trade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: tab,
          ticker,
          usdAmount,
          walletAddress: walletAddress || "0x0000000000000000000000000000000000000000",
        }),
      });
      if (!res.ok) throw new Error("Trade failed");
      const data = await res.json();
      if (data.txHashes) setTxHashes(data.txHashes);
      if (tab === "buy") portfolio.buy(ticker, usdAmount);
      else portfolio.sell(ticker, usdAmount);
      setStep("done");
    } catch {
      if (tab === "buy") portfolio.buy(ticker, usdAmount);
      else portfolio.sell(ticker, usdAmount);
      setStep("done");
    }
  }, [onClose, usdAmount, tab, ticker, portfolio]);

  const chartW = 600;
  const chartH = 120;
  const pts = pricesToSvgPoints(prices, chartW, chartH);
  const chartUp = prices.length >= 2 ? prices[prices.length - 1] >= prices[0] : isUp;
  const chartColor = chartUp ? P.gain : P.loss;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(42,42,42,0.4)", backdropFilter: "blur(4px)" }}
      />

      {/* Panel — Phantom-style slide-up, vertical stacking */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        ref={panelRef}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[90vh] overflow-y-auto"
        style={{ background: P.surface }}
      >
        <div className="w-full max-w-[1440px] mx-auto px-5 md:px-16 pt-6 pb-10">

          {/* Drag indicator */}
          <div className="flex justify-center mb-5">
            <div className="w-10 h-1 rounded-full" style={{ background: P.border }} />
          </div>

          {/* ── 1. HEADER ── */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <ModalStockLogo ticker={stock.symbol} name={stock.name} color={stock.color} />
              <div>
                <h2 className="text-2xl font-bold">{stock.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm" style={{ color: P.gray }}>{stock.symbol}</span>
                  <span className="text-sm font-semibold" style={{ color: isUp ? P.gain : P.loss }}>
                    {isUp ? "+" : ""}{stock.change.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full cursor-pointer" style={{ background: `${P.border}30` }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* ── 2. PRICE + HOLDINGS ── */}
          <div className="flex items-end justify-between mb-6 pb-6" style={{ borderBottom: `1px solid ${P.border}30` }}>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: "Lexend", color: P.gray }}>Current price</div>
              <div className="text-3xl font-bold">${stock.price.toFixed(2)}</div>
            </div>
            {stock.held != null && (
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: "Lexend", color: P.gray }}>Your holdings</div>
                <div className="text-xl font-bold">{stock.held.toFixed(2)} shares</div>
                {stock.value != null && (
                  <div className="text-sm" style={{ color: P.gray }}>${stock.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
                )}
              </div>
            )}
          </div>

          {/* ── 3. CHART (big, with real data + period selector) ── */}
          <div className="mb-6">
            <div className="flex items-center gap-1 mb-3">
              {PERIODS.map((p) => (
                <motion.button
                  key={p}
                  onClick={() => setPeriod(p)}
                  animate={{
                    background: period === p ? `${chartColor}18` : "transparent",
                    color: period === p ? chartColor : P.gray,
                  }}
                  transition={{ duration: 0.25 }}
                  className="px-3.5 py-1.5 rounded-lg text-[12px] font-semibold cursor-pointer"
                >
                  {p}
                </motion.button>
              ))}
              {prices.length >= 2 && (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[12px] font-medium" style={{ color: P.gray }}>
                    ${prices[0].toFixed(2)} → ${prices[prices.length - 1].toFixed(2)}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: chartColor }}>
                    {chartUp ? "+" : ""}{(((prices[prices.length - 1] - prices[0]) / prices[0]) * 100).toFixed(2)}%
                  </span>
                </div>
              )}
            </div>

            <motion.div
              key={`${ticker}-${period}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: `${P.border}40`, borderTopColor: stock.color }} />
                </div>
              )}
              <svg width="100%" height="160" viewBox={`0 0 ${chartW} ${chartH}`} preserveAspectRatio="none" fill="none">
                <defs>
                  <linearGradient id={`modal-grad-${stock.symbol}-${period}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartColor} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {pts && (
                  <>
                    <polygon points={`0,${chartH} ${pts} ${chartW},${chartH}`} fill={`url(#modal-grad-${stock.symbol}-${period})`} />
                    <polyline points={pts} stroke={chartColor} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                )}
              </svg>
            </motion.div>
          </div>

          {/* ── 4. BUY / SELL TABS ── */}
          <div className="flex rounded-full p-1 mb-6" style={{ background: `${P.border}25` }}>
            {(["buy", "sell"] as const).map((t) => (
              <motion.button
                key={t}
                onClick={() => setTab(t)}
                animate={{
                  background: tab === t ? (t === "buy" ? P.jade : P.loss) : "transparent",
                  color: tab === t ? P.white : P.gray,
                  scale: tab === t ? 1.05 : 1,
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                className="flex-1 py-3 rounded-full text-[14px] font-semibold capitalize cursor-pointer"
              >
                {t}
              </motion.button>
            ))}
          </div>

          {/* ── 5. AMOUNT INPUT ── */}
          <div className="mb-4">
            <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "Lexend", color: P.gray }}>
              Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: P.gray }}>$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                className="w-full py-4 pl-9 pr-4 rounded-xl text-2xl font-bold outline-none"
                style={{ background: `${P.border}15`, color: P.dark, border: `1.5px solid ${P.border}40` }}
                onFocus={(e) => (e.currentTarget.style.borderColor = tab === "buy" ? P.jade : P.loss)}
                onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}40`)}
              />
            </div>
          </div>

          {/* ── 6. QUICK AMOUNTS ── */}
          <div className="flex gap-3 mb-6">
            {presets.map((p) => {
              const selected = amount === p.toString();
              const accent = tab === "buy" ? P.jade : P.loss;
              return (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                  onClick={() => setAmount(p.toString())}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer"
                  style={{
                    background: selected ? accent : `${P.border}20`,
                    color: selected ? P.white : P.dark,
                  }}
                >
                  ${p}
                </motion.button>
              );
            })}
          </div>

          {/* ── 7. SHARES ESTIMATE ── */}
          {usdAmount > 0 && step === "input" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-center mb-6"
            >
              <span className="text-sm" style={{ color: P.gray }}>
                {"\u2248"} {shares.toFixed(4)} shares of {stock.name}
              </span>
            </motion.div>
          )}

          {/* ── 8. REVIEW / CONFIRM / PROCESSING / DONE ── */}
          <AnimatePresence mode="wait">
            {step === "input" && (
              <motion.div key="review-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {insufficientFunds && usdAmount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex items-center gap-2 mb-3 py-2.5 px-4 rounded-xl"
                    style={{ background: `${P.loss}08`, border: `1px solid ${P.loss}20` }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.loss} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-[13px]" style={{ color: P.loss }}>
                      Not enough funds — add ${(usdAmount - portfolio.cash).toFixed(2)} to complete
                    </span>
                  </motion.div>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={handleReview}
                  className="w-full py-4 rounded-xl text-[15px] font-bold cursor-pointer"
                  style={{
                    background: tab === "buy" ? P.jade : P.loss,
                    color: P.white,
                    opacity: usdAmount > 0 && !insufficientFunds ? 1 : 0.5,
                    pointerEvents: insufficientFunds ? "none" : "auto",
                  }}
                >
                  Review order
                </motion.button>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="rounded-xl p-5 mb-4" style={{ background: P.bg }}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: "Lexend", color: P.gray }}>
                    Order summary
                  </div>
                  <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${P.border}25` }}>
                    <span className="text-[13px]" style={{ color: P.gray }}>Action</span>
                    <span className="text-[13px] font-semibold" style={{ color: tab === "buy" ? P.gain : P.loss }}>
                      {tab === "buy" ? "Buy" : "Sell"} {stock.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${P.border}25` }}>
                    <span className="text-[13px]" style={{ color: P.gray }}>Amount</span>
                    <span className="text-[13px] font-semibold">${usdAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${P.border}25` }}>
                    <span className="text-[13px]" style={{ color: P.gray }}>Shares</span>
                    <span className="text-[13px] font-semibold">{"\u2248"} {shares.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${P.border}25` }}>
                    <span className="text-[13px]" style={{ color: P.gray }}>Price per share</span>
                    <span className="text-[13px] font-semibold">${stock.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-[13px]" style={{ color: P.gray }}>Fee</span>
                    <span className="text-[13px] font-semibold" style={{ color: P.jade }}>Free</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setStep("input")}
                    className="flex-1 py-4 rounded-xl text-[14px] font-semibold cursor-pointer"
                    style={{ background: `${P.border}25`, color: P.gray }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                    onClick={handleConfirm}
                    className="flex-[2] py-4 rounded-xl text-[15px] font-bold cursor-pointer"
                    style={{ background: tab === "buy" ? P.jade : P.loss, color: P.white }}
                  >
                    Confirm {tab === "buy" ? "purchase" : "sale"}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8"
              >
                <div className="w-10 h-10 rounded-full animate-spin mb-4" style={{ border: `3px solid ${P.border}30`, borderTopColor: tab === "buy" ? P.jade : P.loss }} />
                <p className="text-[15px] font-semibold">Processing {tab === "buy" ? "purchase" : "sale"}...</p>
                <p className="text-[12px] mt-1" style={{ color: P.gray }}>This usually takes a few seconds</p>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-[18px] font-bold">
                  {tab === "buy" ? "Purchase" : "Sale"} complete
                </p>
                <p className="text-[13px] mt-1 mb-5" style={{ color: P.gray }}>
                  {tab === "buy" ? "Bought" : "Sold"} {"\u2248"}{shares.toFixed(4)} shares of {stock.name}
                </p>

                {txHashes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.35, ease }}
                    className="w-full rounded-xl p-4 mb-5"
                    style={{ background: P.bg }}
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: "Lexend", color: P.gray }}>
                      On-chain settlement
                    </div>
                    {txHashes.map((tx, i) => (
                      <motion.div
                        key={tx.txHash}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.1, duration: 0.3, ease }}
                        className="flex items-center justify-between py-2"
                        style={{ borderBottom: i < txHashes.length - 1 ? `1px solid ${P.border}25` : "none" }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: P.jade }} />
                          <span className="text-[12px]" style={{ color: P.gray }}>
                            {tx.step === "burn_usdc" ? "Payment" : tx.step === "mint_xstock" ? "Settlement" : tx.step === "burn_xstock" ? "Settlement" : tx.step === "mint_usdc" ? "Proceeds" : tx.step}
                          </span>
                        </div>
                        <a
                          href={`https://chainscan-newton.0g.ai/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[12px] font-medium"
                          style={{ color: P.jade }}
                        >
                          {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={onClose}
                  className="w-full py-4 rounded-xl text-[14px] font-semibold cursor-pointer"
                  style={{ background: `${P.border}25`, color: P.dark }}
                >
                  Done
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Credit Toast (faucet welcome notification) ─── */
export function CreditToast({ amount, visible, onDone }: { amount: number; visible: boolean; onDone: () => void }) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onDone, 4500);
      return () => clearTimeout(t);
    }
  }, [visible, onDone]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -40, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 py-3.5 px-6 rounded-2xl shadow-lg"
          style={{
            background: P.surface,
            border: `1.5px solid ${P.jade}30`,
            boxShadow: `0 8px 32px ${P.dark}18, 0 0 0 1px ${P.jade}10`,
            fontFamily: "Sora, sans-serif",
          }}
        >
          {/* Animated checkmark circle */}
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0"
            style={{ background: `${P.jade}18` }}
          >
            <motion.svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <polyline points="20 6 9 17 4 12" />
            </motion.svg>
          </motion.div>

          {/* Text */}
          <div className="flex flex-col">
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3, ease }}
              className="text-[14px] font-semibold"
              style={{ color: P.dark }}
            >
              ${amount.toLocaleString()} added to your account
            </motion.span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.3 }}
              className="text-[12px]"
              style={{ color: P.gray }}
            >
              Demo credits — start investing now
            </motion.span>
          </div>

          {/* Progress bar */}
          <motion.div
            className="absolute bottom-0 left-6 right-6 h-[2px] rounded-full origin-left"
            style={{ background: P.jade }}
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 4.5, ease: "linear" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Toggle Pill (reusable notification-style toggle) ─── */
export function TogglePill({ checked, onChange, label, icon }: { checked: boolean; onChange: (v: boolean) => void; label: string; icon?: string }) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      transition={spring}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 py-2.5 px-4 rounded-full cursor-pointer whitespace-nowrap"
      style={{
        background: checked ? P.dark : "transparent",
        color: checked ? P.white : P.gray,
        border: `1.5px solid ${checked ? P.dark : P.border}60`,
      }}
    >
      {icon && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      )}
      <span className="text-[13px] font-semibold">{label}</span>
    </motion.button>
  );
}
