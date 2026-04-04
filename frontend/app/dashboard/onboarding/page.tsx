"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { P, ease, spring } from "../shared";
import { usePortfolio, MARKET, STOCK_COLORS, logoUrl } from "../store";

type Step = "welcome" | "discover" | "profile" | "fund" | "pick" | "done";

const PROFILES = [
  { key: "conservative", label: "Conservative", desc: "Steady growth, lower risk. Blue-chips, bonds." },
  { key: "moderate", label: "Moderate", desc: "Balanced risk and return. Diversified mix." },
  { key: "growth", label: "Growth", desc: "Higher returns, tech-heavy, momentum-driven." },
  { key: "aggressive", label: "Aggressive", desc: "Maximum growth potential. Concentrated bets." },
] as const;

const POPULAR_STOCKS = ["TSLA", "AAPL", "NVDA", "GOOGL", "AMZN", "META", "MSFT", "SPY"];

function StockLogo({ ticker, name, color, size = 56 }: { ticker: string; name: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="rounded-2xl flex items-center justify-center text-[16px] font-bold" style={{ width: size, height: size, background: color, color: "#FFFFFF" }}>
        {ticker.slice(0, 2)}
      </div>
    );
  }
  const dark = ticker === "AAPL";
  return (
    <img src={logoUrl(ticker)} alt={name} style={{ width: size, height: size, background: dark ? "#FFFFFF" : undefined, padding: dark ? 8 : undefined }} className="rounded-2xl object-contain" onError={() => setFailed(true)} />
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
  const [firstName, setFirstName] = useState("");
  const [payMethod, setPayMethod] = useState<"card" | "apple">("card");

  useEffect(() => {
    const stored = localStorage.getItem("radegast_firstName");
    if (stored) setFirstName(stored);
  }, []);

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
      setTimeout(() => setStep("pick"), 1200);
    }, 1800);
  }, [usd, addFunds]);

  const handleFinish = useCallback(() => {
    if (selectedStocks.size > 0 && usd > 0) {
      const perStock = usd / selectedStocks.size;
      selectedStocks.forEach((ticker) => buy(ticker, perStock));
    }
    setStep("done");
    localStorage.removeItem("radegast_isNew");
    localStorage.setItem("radegast_onboarded", "true");
    setTimeout(() => router.push("/dashboard"), 2500);
  }, [selectedStocks, usd, buy, router]);

  const stepIndex = ["welcome", "discover", "profile", "fund", "pick", "done"].indexOf(step);

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>

      {/* Progress */}
      {step !== "welcome" && step !== "done" && (
        <div className="fixed top-0 left-0 right-0 h-[2px] z-50" style={{ background: `${P.border}20` }}>
          <motion.div
            className="h-full"
            style={{ background: P.jade }}
            animate={{ width: `${(stepIndex / 5) * 100}%` }}
            transition={{ duration: 0.6, ease }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">

        {/* ═══ WELCOME ═══ */}
        {step === "welcome" && (
          <motion.section
            key="welcome"
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease }}
            className="h-screen flex flex-col items-center justify-center text-center px-8"
          >
            <motion.h1
              initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="text-[120px] font-bold leading-[0.9] tracking-tighter whitespace-nowrap"
            >
              Welcome, <span style={{ color: P.jade }}>{firstName || "investor"}</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.8, ease }}
              className="text-2xl mt-14 max-w-3xl leading-snug font-medium"
              style={{ color: P.gray }}
            >
              You&apos;re about to enter a new world.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.1, duration: 0.7, ease }}
              className="text-lg mt-6 max-w-2xl leading-relaxed"
              style={{ color: `${P.gray}80` }}
            >
              US stocks from änywhere. 24/7.
              <br />
              No brokerage. No minimum. No barriers.
              <br />
              AI watches your money. You watch your life.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.8, duration: 0.6, ease }}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStep("discover")}
              className="get-started-btn mt-20 py-5 px-28 rounded-full text-[18px] font-bold cursor-pointer text-white"
            >
              Invest!
            </motion.button>
          </motion.section>
        )}

        {/* ═══ DISCOVER ═══ */}
        {step === "discover" && (
          <motion.section
            key="discover"
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(6px)" }}
            transition={{ duration: 0.7, ease }}
            className="h-screen flex flex-col items-center justify-center text-center px-8"
          >
            <div className="w-full max-w-4xl">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease }}
                className="text-6xl font-bold mb-6 leading-tight whitespace-nowrap"
              >
                3 AI models <span style={{ color: P.jade }}>watch your money.</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
                className="text-xl mb-16 max-w-2xl mx-auto"
                style={{ color: P.gray }}
              >
                They analyze, vote, and act. Majority wins. You choose how much control to keep.
              </motion.p>

              <div className="grid grid-cols-2 gap-6 mb-16">
                {[
                  { label: "Advisory", desc: "AI suggests. You decide. Full transparency on every recommendation.", color: P.jade, tag: "You approve" },
                  { label: "Autonomous", desc: "AI trades for you. Set a budget, a time window, and let it work.", color: P.safran, tag: "AI executes" },
                ].map((m, i) => (
                  <motion.div
                    key={m.label}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.12, duration: 0.5, ease }}
                    whileHover={{ scale: 1.08 }}
                    className="p-8 rounded-2xl text-left cursor-default"
                    style={{ background: `${m.color}06`, border: `1.5px solid ${m.color}15` }}
                  >
                    <div className="w-10 h-[3px] rounded-full mb-5" style={{ background: m.color }} />
                    <h4 className="text-2xl font-bold mb-3">{m.label}</h4>
                    <p className="text-[15px] leading-relaxed mb-5" style={{ color: P.gray }}>{m.desc}</p>
                    <span className="text-[13px] font-semibold" style={{ color: m.color }}>{m.tag}</span>
                  </motion.div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4, ease }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("profile")}
                className="get-started-btn py-5 px-24 rounded-full text-[16px] font-bold cursor-pointer text-white"
              >
                Continue
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* ═══ PROFILE ═══ */}
        {step === "profile" && (
          <motion.section
            key="profile"
            initial={{ opacity: 0, y: 100, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -60, rotate: 1 }}
            transition={{ duration: 0.65, ease }}
            className="h-screen flex flex-col items-center justify-center text-center px-8"
          >
            <div className="w-full max-w-3xl">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease }}
                className="text-6xl font-bold mb-6 leading-tight"
              >
                What kind of investor <span style={{ color: P.jade }}>are you?</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
                className="text-xl mb-14"
                style={{ color: P.gray }}
              >
                This helps our AI tailor recommendations to your style.
              </motion.p>

              <div className="grid grid-cols-2 gap-5 mb-14">
                {PROFILES.map((p, i) => {
                  const selected = profile === p.key;
                  return (
                    <motion.button
                      key={p.key}
                      initial={{ opacity: 0, y: 30, scale: 0.92 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        background: selected ? `${P.jade}10` : `${P.border}08`,
                      }}
                      transition={{
                        delay: 0.4 + i * 0.1,
                        duration: 0.5,
                        ease,
                        background: { duration: 0.4, ease },
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setProfile(p.key)}
                      className="flex flex-col items-start p-7 rounded-2xl text-left cursor-pointer"
                      style={{ border: selected ? `2px solid ${P.jade}` : `2px solid transparent` }}
                    >
                      <motion.div
                        className="rounded-full mb-5"
                        animate={{ width: selected ? 48 : 40, height: 3, background: selected ? P.jade : P.border }}
                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      />
                      <span className="text-xl font-semibold mb-2">{p.label}</span>
                      <span className="text-[14px] leading-relaxed" style={{ color: P.gray }}>{p.desc}</span>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                          className="mt-4 flex items-center gap-2"
                        >
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: P.jade }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                          <span className="text-[12px] font-semibold" style={{ color: P.jade }}>Selected</span>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.75, duration: 0.4, ease }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => profile && setStep("fund")}
                className="get-started-btn py-5 px-24 rounded-full text-[16px] font-bold cursor-pointer text-white"
                style={{ opacity: profile ? 1 : 0.3 }}
              >
                Continue
              </motion.button>
            </div>
          </motion.section>
        )}

        {/* ═══ ADD FUNDS ═══ */}
        {step === "fund" && (
          <motion.section
            key="fund"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="h-screen flex flex-col items-center justify-center text-center px-8"
          >
            <div className="w-full max-w-2xl">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease }}
                className="text-6xl font-bold mb-6 leading-tight"
              >
                Add your first <span style={{ color: P.jade }}>funds</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
                className="text-xl mb-14"
                style={{ color: P.gray }}
              >
                Start with any amount. You can always add more later.
              </motion.p>

              <AnimatePresence mode="wait">
                {fundStep === "input" && (
                  <motion.div key="fund-input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.4, ease }}
                      className="relative mb-6"
                    >
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-bold" style={{ color: P.gray }}>$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                        placeholder="0.00"
                        className="w-full py-6 pl-14 pr-6 rounded-2xl text-4xl font-bold outline-none"
                        style={{ background: `${P.border}10`, color: P.dark, border: `1.5px solid ${P.border}25` }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}25`)}
                        autoFocus
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.4, ease }}
                      className="flex gap-4 mb-12"
                    >
                      {fundPresets.map((p) => {
                        const selected = fundAmount === p.toString();
                        return (
                          <motion.button
                            key={p}
                            whileHover={{ scale: 1.12 }}
                            whileTap={{ scale: 0.93 }}
                            transition={spring}
                            onClick={() => setFundAmount(p.toString())}
                            className="flex-1 py-4 rounded-xl text-[16px] font-semibold cursor-pointer"
                            style={{
                              background: selected ? P.jade : `${P.border}12`,
                              color: selected ? P.white : P.dark,
                            }}
                          >
                            ${p}
                          </motion.button>
                        );
                      })}
                    </motion.div>

                    {/* Payment */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4, ease }}
                      className="mb-12"
                    >
                      <div className="text-[11px] font-semibold uppercase tracking-wider mb-4" style={{ fontFamily: "Lexend", color: P.gray }}>Payment method</div>
                      <div className="flex gap-4">
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPayMethod("card")}
                          className="flex-1 flex items-center gap-4 py-5 px-6 rounded-2xl cursor-pointer"
                          animate={{
                            borderColor: payMethod === "card" ? P.jade : `${P.border}40`,
                            background: payMethod === "card" ? `${P.jade}08` : "transparent",
                          }}
                          transition={{ duration: 0.3, ease }}
                          style={{ border: "1.5px solid" }}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
                          </svg>
                          <span className="text-[15px] font-semibold">Card</span>
                          <AnimatePresence>
                            {payMethod === "card" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                className="ml-auto w-5 h-5 rounded-full"
                                style={{ background: P.jade }}
                              />
                            )}
                          </AnimatePresence>
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPayMethod("apple")}
                          className="flex-1 flex items-center gap-4 py-5 px-6 rounded-2xl cursor-pointer"
                          animate={{
                            borderColor: payMethod === "apple" ? P.jade : `${P.border}40`,
                            background: payMethod === "apple" ? `${P.jade}08` : "transparent",
                          }}
                          transition={{ duration: 0.3, ease }}
                          style={{ border: "1.5px solid" }}
                        >
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.dark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" />
                          </svg>
                          <span className="text-[15px] font-semibold">Apple Pay</span>
                          <AnimatePresence>
                            {payMethod === "apple" && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                className="ml-auto w-5 h-5 rounded-full"
                                style={{ background: P.jade }}
                              />
                            )}
                          </AnimatePresence>
                        </motion.button>
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.4, ease }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleFund}
                      className="get-started-btn py-5 px-20 rounded-full text-[16px] font-bold cursor-pointer text-white"
                      style={{ opacity: usd > 0 ? 1 : 0.3 }}
                    >
                      Add ${usd > 0 ? usd.toFixed(2) : "0.00"}
                    </motion.button>

                    <p className="text-[12px] mt-5" style={{ color: `${P.gray}70` }}>
                      No fees. Instant. Secured by 256-bit encryption.
                    </p>

                    <button
                      onClick={() => setStep("pick")}
                      className="block mx-auto mt-6 text-[14px] font-medium cursor-pointer"
                      style={{ color: P.gray }}
                    >
                      Skip for now
                    </button>
                  </motion.div>
                )}

                {fundStep === "processing" && (
                  <motion.div key="fund-proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-24">
                    <div className="w-12 h-12 rounded-full animate-spin mb-6" style={{ border: `3px solid ${P.border}20`, borderTopColor: P.jade }} />
                    <p className="text-xl font-semibold">Adding funds</p>
                    <p className="text-[14px] mt-2" style={{ color: P.gray }}>Verifying payment</p>
                  </motion.div>
                )}

                {fundStep === "done" && (
                  <motion.div key="fund-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-24">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: `${P.jade}10` }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="text-2xl font-bold">${usd.toFixed(2)} added</p>
                    <p className="text-[15px] mt-2" style={{ color: P.gray }}>Now let&apos;s pick your first stocks</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.section>
        )}

        {/* ═══ PICK STOCKS ═══ */}
        {step === "pick" && (
          <motion.section
            key="pick"
            initial={{ opacity: 0, x: 120, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: -80, filter: "blur(6px)" }}
            transition={{ duration: 0.6, ease }}
            className="h-screen flex flex-col items-center justify-center text-center px-8"
          >
            <div className="w-full max-w-3xl">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease }}
                className="text-6xl font-bold mb-6 leading-tight"
              >
                Pick your first <span style={{ color: P.jade }}>stocks</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
                className="text-xl mb-14"
                style={{ color: P.gray }}
              >
                {usd > 0
                  ? `Your $${usd.toFixed(0)} will be split equally across your picks.`
                  : "Select the stocks you want in your portfolio."}
              </motion.p>

              {/* Grid 2x4 — cards with hover scale */}
              <div className="grid grid-cols-2 gap-4 mb-14">
                {POPULAR_STOCKS.map((ticker, i) => {
                  const stock = MARKET.find((s) => s.ticker === ticker);
                  if (!stock) return null;
                  const selected = selectedStocks.has(ticker);
                  const color = STOCK_COLORS[ticker] || P.jade;
                  const isUp = stock.change >= 0;
                  return (
                    <motion.button
                      key={ticker}
                      initial={{ opacity: 0, y: 30, scale: 0.92 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                        background: selected ? `${P.jade}08` : `${P.border}06`,
                      }}
                      transition={{
                        delay: 0.4 + i * 0.06,
                        duration: 0.45,
                        ease,
                        background: { duration: 0.35, ease },
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggleStock(ticker)}
                      className="flex items-center gap-5 p-5 rounded-2xl text-left cursor-pointer"
                      style={{ border: selected ? `2px solid ${color}` : `2px solid transparent` }}
                    >
                      <motion.div
                        animate={{ scale: selected ? 1.1 : 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                      >
                        <StockLogo ticker={ticker} name={stock.name} color={color} size={48} />
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[16px] font-semibold">{stock.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[13px]" style={{ color: P.gray }}>${stock.price.toFixed(2)}</span>
                          <span className="text-[12px] font-medium" style={{ color: isUp ? P.gain : P.loss }}>
                            {isUp ? "+" : ""}{stock.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <motion.div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                        animate={{
                          background: selected ? color : "transparent",
                          borderColor: selected ? color : P.border,
                          scale: selected ? 1 : 0.9,
                        }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        style={{ border: "2px solid" }}
                      >
                        <AnimatePresence>
                          {selected && (
                            <motion.svg
                              initial={{ opacity: 0, scale: 0, rotate: -90 }}
                              animate={{ opacity: 1, scale: 1, rotate: 0 }}
                              exit={{ opacity: 0, scale: 0, rotate: 90 }}
                              transition={{ type: "spring", stiffness: 500, damping: 20 }}
                              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </motion.svg>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4, ease }}
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFinish}
                className="get-started-btn py-5 px-24 rounded-full text-[16px] font-bold cursor-pointer text-white"
                style={{ opacity: selectedStocks.size > 0 ? 1 : 0.3 }}
              >
                {usd > 0 && selectedStocks.size > 0
                  ? `Invest $${(usd / selectedStocks.size).toFixed(0)} in each`
                  : selectedStocks.size > 0
                    ? `Add ${selectedStocks.size} to portfolio`
                    : "Select at least one"}
              </motion.button>

              <button
                onClick={() => { setStep("done"); localStorage.removeItem("radegast_isNew");
    localStorage.setItem("radegast_onboarded", "true"); setTimeout(() => router.push("/dashboard"), 2500); }}
                className="block mx-auto mt-6 text-[14px] font-medium cursor-pointer"
                style={{ color: P.gray }}
              >
                Skip for now
              </button>
            </div>
          </motion.section>
        )}

        {/* ═══ DONE ═══ */}
        {step === "done" && (
          <motion.section
            key="done"
            initial={{ opacity: 0, scale: 1.15, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="h-screen flex flex-col items-center justify-center text-center px-8"
          >
            <motion.h2
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="text-6xl font-bold leading-tight tracking-tight"
            >
              You&apos;re all set,{" "}
              <span style={{ color: P.jade }}>{firstName || "investor"}</span>.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.6, ease }}
              className="text-xl mt-8"
              style={{ color: P.gray }}
            >
              Your portfolio is ready. The märkets never sleep.
            </motion.p>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 120 }}
              transition={{ delay: 1.6, duration: 1, ease }}
              className="h-[2px] rounded-full mt-14"
              style={{ background: `${P.jade}30` }}
            />
          </motion.section>
        )}

      </AnimatePresence>
    </div>
  );
}

