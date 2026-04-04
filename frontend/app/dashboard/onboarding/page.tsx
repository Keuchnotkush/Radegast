"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { P, ease, spring } from "../shared";
import { usePortfolio, MARKET, STOCK_COLORS, logoUrl } from "../store";

/* ─── Steps ─── */
type Step = "welcome" | "profile" | "fund" | "pick" | "done";

const PROFILES = [
  { key: "conservative", label: "Conservative", desc: "Steady growth, lower risk", icon: "M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10Z" },
  { key: "moderate", label: "Moderate", desc: "Balanced risk & return", icon: "M2 12h4l3-9 6 18 3-9h4" },
  { key: "growth", label: "Growth", desc: "Higher risk, higher reward", icon: "M22 12 18 6l-4 4-4-4-4 4L2 6" },
  { key: "aggressive", label: "Aggressive", desc: "Maximum growth potential", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8Z" },
] as const;

const POPULAR_STOCKS = ["TSLA", "AAPL", "NVDA", "GOOGL", "AMZN", "META", "MSFT", "SPY"];

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

export default function OnboardingPage() {
  const router = useRouter();
  const { addFunds, buy } = usePortfolio();
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState("");
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [fundStep, setFundStep] = useState<"input" | "processing" | "done">("input");

  const fundPresets = [50, 100, 250, 500];
  const usd = parseFloat(fundAmount) || 0;

  const toggleStock = (ticker: string) => {
    setSelectedStocks((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) next.delete(ticker);
      else next.add(ticker);
      return next;
    });
  };

  const handleFund = useCallback(() => {
    if (usd <= 0) return;
    setFundStep("processing");
    setTimeout(() => {
      addFunds(usd);
      setFundStep("done");
      setTimeout(() => setStep("pick"), 1000);
    }, 1800);
  }, [usd, addFunds]);

  const handleFinish = useCallback(() => {
    // Split funds equally across selected stocks
    if (selectedStocks.size > 0 && usd > 0) {
      const perStock = usd / selectedStocks.size;
      selectedStocks.forEach((ticker) => buy(ticker, perStock));
    }
    setStep("done");
    setTimeout(() => router.push("/dashboard"), 2000);
  }, [selectedStocks, usd, buy, router]);

  const stepIndex = ["welcome", "profile", "fund", "pick", "done"].indexOf(step);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>

      {/* Progress bar */}
      {step !== "done" && (
        <div className="fixed top-0 left-0 right-0 h-1 z-50">
          <motion.div
            className="h-full"
            style={{ background: P.jade }}
            animate={{ width: `${((stepIndex + 1) / 4) * 100}%` }}
            transition={{ duration: 0.5, ease }}
          />
        </div>
      )}

      <div className="w-full max-w-2xl px-8">
        <AnimatePresence mode="wait">

          {/* ═══ STEP 1: WELCOME ═══ */}
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, ...spring }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
                style={{ background: `${P.jade}15` }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </motion.div>

              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Welcome to <span style={{ color: P.jade }}>Radegast</span>
              </h1>
              <p className="text-lg mb-2" style={{ color: P.gray }}>
                Invest in US stocks from anywhere, 24/7.
              </p>
              <p className="text-[14px] mb-12" style={{ color: P.gray }}>
                No fees. Fractional shares from $1. AI-powered portfolio management.
              </p>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                onClick={() => setStep("profile")}
                className="py-4 px-16 rounded-full text-[16px] font-bold cursor-pointer"
                style={{ background: P.jade, color: P.white }}
              >
                Get started
              </motion.button>

              <p className="text-[12px] mt-4" style={{ color: P.gray }}>Takes less than 2 minutes</p>
            </motion.div>
          )}

          {/* ═══ STEP 2: INVESTOR PROFILE ═══ */}
          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                What kind of investor are you?
              </h2>
              <p className="text-[15px] mb-10" style={{ color: P.gray }}>
                This helps our AI tailor recommendations to your style.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {PROFILES.map((p) => {
                  const selected = profile === p.key;
                  return (
                    <motion.button
                      key={p.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      onClick={() => setProfile(p.key)}
                      className="flex flex-col items-start p-6 rounded-2xl text-left cursor-pointer"
                      style={{
                        background: selected ? `${P.jade}10` : `${P.border}12`,
                        border: `1.5px solid ${selected ? P.jade : "transparent"}`,
                      }}
                    >
                      <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
                        style={{ background: selected ? `${P.jade}20` : `${P.border}25` }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                          stroke={selected ? P.jade : P.gray} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d={p.icon} />
                        </svg>
                      </div>
                      <span className="text-[15px] font-semibold mb-1">{p.label}</span>
                      <span className="text-[12px]" style={{ color: P.gray }}>{p.desc}</span>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                onClick={() => profile && setStep("fund")}
                className="w-full py-4 rounded-full text-[15px] font-bold cursor-pointer"
                style={{ background: P.jade, color: P.white, opacity: profile ? 1 : 0.4 }}
              >
                Continue
              </motion.button>
            </motion.div>
          )}

          {/* ═══ STEP 3: ADD FUNDS ═══ */}
          {step === "fund" && (
            <motion.div
              key="fund"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                Add your first funds
              </h2>
              <p className="text-[15px] mb-10" style={{ color: P.gray }}>
                Start with any amount — you can always add more later.
              </p>

              <AnimatePresence mode="wait">
                {fundStep === "input" && (
                  <motion.div key="fund-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="relative mb-4">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold" style={{ color: P.gray }}>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="0.00"
                        className="w-full py-4 pl-9 pr-4 rounded-xl text-2xl font-bold outline-none"
                        style={{ background: `${P.border}15`, color: P.dark, border: `1.5px solid ${P.border}40` }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}40`)}
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 mb-8">
                      {fundPresets.map((p) => {
                        const selected = fundAmount === p.toString();
                        return (
                          <motion.button
                            key={p}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            onClick={() => setFundAmount(p.toString())}
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
                    <div className="mb-8">
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ fontFamily: "Lexend", color: P.gray }}>Payment method</div>
                      <div className="flex gap-3">
                        <div className="flex-1 flex items-center gap-3 py-3 px-4 rounded-xl" style={{ border: `1.5px solid ${P.jade}`, background: `${P.jade}08` }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                          <span className="text-[13px] font-semibold">Card</span>
                          <div className="ml-auto w-4 h-4 rounded-full" style={{ background: P.jade }} />
                        </div>
                        <div className="flex-1 flex items-center gap-3 py-3 px-4 rounded-xl" style={{ border: `1.5px solid ${P.border}40` }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                          </svg>
                          <span className="text-[13px] font-semibold">Apple Pay</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      onClick={handleFund}
                      className="w-full py-4 rounded-full text-[15px] font-bold cursor-pointer"
                      style={{ background: P.jade, color: P.white, opacity: usd > 0 ? 1 : 0.4 }}
                    >
                      Add ${usd > 0 ? usd.toFixed(2) : "0.00"}
                    </motion.button>

                    <p className="text-[11px] text-center mt-3" style={{ color: P.gray }}>
                      No fees · Instant · Secured by 256-bit encryption
                    </p>

                    <button
                      onClick={() => setStep("pick")}
                      className="w-full text-center mt-4 text-[13px] font-medium cursor-pointer"
                      style={{ color: P.gray }}
                    >
                      Skip for now
                    </button>
                  </motion.div>
                )}

                {fundStep === "processing" && (
                  <motion.div key="fund-processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-16">
                    <div className="w-10 h-10 rounded-full animate-spin mb-4" style={{ border: `3px solid ${P.border}30`, borderTopColor: P.jade }} />
                    <p className="text-[15px] font-semibold">Adding funds...</p>
                    <p className="text-[12px] mt-1" style={{ color: P.gray }}>Verifying payment</p>
                  </motion.div>
                )}

                {fundStep === "done" && (
                  <motion.div key="fund-done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-16">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="text-[18px] font-bold">${usd.toFixed(2)} added</p>
                    <p className="text-[13px] mt-1" style={{ color: P.gray }}>Let&apos;s pick your first stocks</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ═══ STEP 4: PICK STOCKS ═══ */}
          {step === "pick" && (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                Pick your first stocks
              </h2>
              <p className="text-[15px] mb-8" style={{ color: P.gray }}>
                {usd > 0
                  ? `Your $${usd.toFixed(0)} will be split equally across your picks.`
                  : "Select the stocks you're interested in. You can invest later."}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10">
                {POPULAR_STOCKS.map((ticker) => {
                  const stock = MARKET.find((s) => s.ticker === ticker);
                  if (!stock) return null;
                  const selected = selectedStocks.has(ticker);
                  const color = STOCK_COLORS[ticker] || P.jade;
                  return (
                    <motion.button
                      key={ticker}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring}
                      onClick={() => toggleStock(ticker)}
                      className="flex items-center gap-4 p-4 rounded-2xl text-left cursor-pointer"
                      style={{
                        background: selected ? `${color}10` : `${P.border}12`,
                        border: `1.5px solid ${selected ? color : "transparent"}`,
                      }}
                    >
                      <StockLogo ticker={ticker} name={stock.name} color={color} size={40} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-semibold">{stock.name}</div>
                        <div className="text-[12px]" style={{ color: P.gray }}>
                          ${stock.price.toFixed(2)}
                        </div>
                      </div>
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{
                          background: selected ? color : `${P.border}30`,
                          border: selected ? "none" : `1.5px solid ${P.border}50`,
                        }}
                      >
                        {selected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                onClick={handleFinish}
                className="w-full py-4 rounded-full text-[15px] font-bold cursor-pointer"
                style={{ background: P.jade, color: P.white, opacity: selectedStocks.size > 0 ? 1 : 0.4 }}
              >
                {usd > 0 && selectedStocks.size > 0
                  ? `Invest $${(usd / selectedStocks.size).toFixed(0)} in each`
                  : selectedStocks.size > 0
                    ? `Add ${selectedStocks.size} to watchlist`
                    : "Select at least one stock"}
              </motion.button>

              <button
                onClick={() => { setStep("done"); setTimeout(() => router.push("/dashboard"), 2000); }}
                className="w-full text-center mt-4 text-[13px] font-medium cursor-pointer"
                style={{ color: P.gray }}
              >
                Skip for now
              </button>
            </motion.div>
          )}

          {/* ═══ STEP 5: DONE ═══ */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease }}
              className="flex flex-col items-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
                style={{ background: `${P.jade}15` }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>

              <h2 className="text-3xl lg:text-4xl font-bold mb-3">
                You&apos;re all set!
              </h2>
              <p className="text-[15px]" style={{ color: P.gray }}>
                Taking you to your portfolio...
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
