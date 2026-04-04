"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TogglePill, TradeModal, P, ease, spring } from "../shared";
import type { TradeStock } from "../shared";
import { MARKET, STOCK_COLORS, logoUrl, useSettings } from "../store";

/* ─── AI Recommendations ─── */
const RECOMMENDATIONS = [
  {
    id: 1, type: "buy" as const, ticker: "NVDA", confidence: 87,
    headline: "NVIDIA — Strong buy signal",
    reasoning: "Q4 earnings beat Wall Street estimates by 12%, with data center revenue up 409% YoY driven by H100/H200 GPU demand. XGBoost model detects a breakout above the $174 resistance level with strong volume confirmation (3.2x average). Sentiment model scores +0.92 across 847 articles — analysts from Goldman Sachs, Morgan Stanley, and JP Morgan all raised price targets post-earnings. Macro model flags the AI infrastructure capex supercycle: Microsoft, Google, and Amazon announced $150B+ combined AI spend for 2026. RSI sits at 62 — bullish but not overbought, leaving room for continuation. Risk: valuation at 35x forward P/E is elevated, but justified by 90%+ revenue growth.",
    amount: 150,
  },
  {
    id: 2, type: "sell" as const, ticker: "TSLA", confidence: 71,
    headline: "Tesla — Take partial profit",
    reasoning: "RSI hit 74 — firmly in overbought territory after a 28% run in 3 weeks. XGBoost flags bearish divergence on the daily MACD: price making higher highs while MACD makes lower highs, a classic reversal signal. Volume has been declining on up-days, suggesting weakening buyer conviction. Sentiment model reads neutral — positive delivery numbers (+6% QoQ) are offset by Musk's political controversies dragging brand sentiment in Europe (-15% registrations in Germany). Macro model identifies auto sector rotation as fund managers reallocate to AI infrastructure. Recommendation: sell 20% of position ($200) to lock in gains. If price holds above $340 support, we can re-enter.",
    amount: 200,
  },
  {
    id: 3, type: "buy" as const, ticker: "AMZN", confidence: 79,
    headline: "Amazon — Dip opportunity",
    reasoning: "Stock dropped 2.3% on a single headline about rising logistics costs in Q1. XGBoost identifies strong support at $207 — the 50-day EMA that has held on 4 previous tests this quarter. Digging deeper: AWS revenue actually grew 19% YoY and is reaccelerating as enterprise AI workloads ramp up. Sentiment model scores the sell-off as an overreaction: 73% of analyst reports remain bullish, and the logistics cost increase is seasonal and already priced into forward guidance. Macro model is bullish on consumer discretionary — real wages are growing, consumer confidence at 14-month high. At $209, the stock trades at 28x forward earnings vs. its 5-year average of 35x.",
    amount: 100,
  },
  {
    id: 4, type: "hold" as const, ticker: "AAPL", confidence: 68,
    headline: "Apple — Hold position",
    reasoning: "Consolidating in a tight $250-260 range for the past 18 trading days. XGBoost sees neutral momentum: Bollinger Bands are squeezing, indicating a breakout is coming but direction is unclear. iPhone 17 pre-orders are tracking +8% vs. iPhone 16 at this stage, but the market has largely priced this in. Sentiment model is waiting for WWDC (June 9) where Apple Intelligence 2.0 is expected — this could be the catalyst. Macro model says the tech sector is in a holding pattern ahead of the Fed's June meeting. Your current 20% allocation is right on target for a Growth profile. No action needed — but flag for review post-WWDC.",
    amount: 0,
  },
  {
    id: 5, type: "buy" as const, ticker: "MSFT", confidence: 82,
    headline: "Microsoft — AI tailwind",
    reasoning: "Azure AI revenue grew 40% quarter-over-quarter, now representing 12% of total Azure revenue. XGBoost identifies a bullish flag pattern forming on the daily chart after the post-earnings gap-up: 8 days of consolidation on declining volume, textbook continuation setup. Sentiment model scores +0.85 — Copilot enterprise adoption doubled to 1.4M paid seats, and LinkedIn revenue hit record highs. Macro model strongly favors enterprise software: companies are increasing IT budgets by 7% on average in 2026, with AI tools as the #1 spend category. At 31x forward P/E, it's trading at a 10% discount to its 3-year average. The risk/reward is compelling here.",
    amount: 120,
  },
];

/* ─── Auto trades log ─── */
const AUTO_TRADES = [
  { id: 1, action: "buy" as const, ticker: "NVDA", amount: 150, shares: "0.85", time: "4m ago", reason: "Earnings beat — 3/3 models agree" },
  { id: 2, action: "sell" as const, ticker: "TSLA", amount: 300, shares: "0.83", time: "12m ago", reason: "RSI overbought — 2/3 models agree" },
  { id: 3, action: "buy" as const, ticker: "AMZN", amount: 75, shares: "0.36", time: "1h ago", reason: "Dip below fair value — 2/3 models agree" },
  { id: 4, action: "buy" as const, ticker: "MSFT", amount: 120, shares: "0.32", time: "2h ago", reason: "AI tailwind — 3/3 models agree" },
];

/* ─── AI Models ─── */
const MODELS: { name: string; desc: string; vote: "bullish" | "bearish" | "neutral" }[] = [
  { name: "XGBoost", desc: "Technical — RSI, MACD, volume, price patterns", vote: "bullish" },
  { name: "Sentiment", desc: "NLP — news, social, earnings call analysis", vote: "neutral" },
  { name: "Macro", desc: "Economics — Fed rates, CPI, sector rotation", vote: "bullish" },
];

function StockLogo({ ticker, color }: { ticker: string; color: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0"
        style={{ background: `${color}15`, color }}>
        {ticker.slice(0, 2)}
      </div>
    );
  }
  return (
    <img src={logoUrl(ticker)} alt={ticker}
      className="w-11 h-11 rounded-xl object-contain shrink-0"
      style={{ background: P.white }}
      onError={() => setFailed(true)} />
  );
}

export default function AdvisorPage() {
  const userName = "Kassim"; // TODO: from Dynamic auth
  const { aiSuggestions, setAiSuggestions, autoSession } = useSettings();
  const advisorOn = aiSuggestions;
  const tradingOn = autoSession.active;
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [tradeStock, setTradeStock] = useState<TradeStock | null>(null);
  const [confirmTrade, setConfirmTrade] = useState<typeof RECOMMENDATIONS[number] | null>(null);

  function openTrade(rec: typeof RECOMMENDATIONS[number]) {
    setConfirmTrade(rec);
  }

  function executeTrade() {
    if (!confirmTrade) return;
    const stock = MARKET.find((s) => s.ticker === confirmTrade.ticker);
    if (!stock) return;
    // TODO: Dynamic SDK embedded wallet signature
    setTradeStock({
      symbol: stock.ticker,
      name: stock.name,
      price: stock.price,
      change: stock.change,
      color: STOCK_COLORS[stock.ticker] || P.jade,
    });
    setConfirmTrade(null);
  }

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={userName.charAt(0).toUpperCase()} />

      <div className="w-full px-8 lg:px-16 xl:px-24 pt-20 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-14"
        >
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
            Your AI, <span style={{ color: P.jade }}>your rules</span>.
          </h1>
          <p className="text-lg lg:text-xl mt-3" style={{ color: P.gray }}>
            3 models vote on every decision. You choose how much control to give.
          </p>
        </motion.div>

        {/* ═══ MODE TOGGLES ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="mb-16"
        >
          <SectionTitle>Active modes</SectionTitle>
          <div className="flex gap-3 mt-4">
            <TogglePill checked={advisorOn} onChange={setAiSuggestions} label="AI Advisor"
              icon="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            <TogglePill checked={tradingOn} onChange={() => {}} label={tradingOn ? "Autonomous Trading — Active" : "Autonomous Trading — Configure in Settings"}
              icon="M13 10V3L4 14h7v7l9-11h-7z" />
          </div>
          <AnimatePresence>
            {!advisorOn && !tradingOn && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-[13px] mt-4" style={{ color: P.gray }}>
                Enable at least one mode to receive AI insights.
              </motion.p>
            )}
          </AnimatePresence>
        </motion.section>

        {/* ═══ MODEL CONSENSUS ═══ */}
        {(advisorOn || tradingOn) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-16"
          >
              <div className="flex items-center gap-3 mb-6">
                <SectionTitle>Model consensus</SectionTitle>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: P.jade }} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {MODELS.map((m, i) => {
                  const color = m.vote === "bullish" ? P.gain : m.vote === "bearish" ? P.loss : P.gray;
                  return (
                    <motion.div
                      key={m.name}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.03, y: -2 }}
                      transition={{ delay: 0.2 + i * 0.08, duration: 0.4, ease }}
                      className="flex items-start gap-4 p-5 rounded-2xl cursor-default"
                      style={{ background: P.surface, border: `1px solid ${P.border}30` }}
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold"
                        style={{ background: `${color}15`, color }}>
                        {m.vote === "bullish" ? "↑" : m.vote === "bearish" ? "↓" : "—"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold">{m.name}</span>
                          <span className="text-[11px] font-semibold uppercase" style={{ color }}>{m.vote}</span>
                        </div>
                        <p className="text-[12px] mt-1 leading-relaxed" style={{ color: P.gray }}>{m.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
        )}

        {/* ═══ AI RECOMMENDATIONS — advisor mode ═══ */}
        {advisorOn && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-16"
          >
              <SectionTitle>Recommendations</SectionTitle>
              <div className="flex flex-col gap-4 mt-6">
                {RECOMMENDATIONS.map((rec, i) => {
                  const stock = MARKET.find((s) => s.ticker === rec.ticker);
                  const color = STOCK_COLORS[rec.ticker] || P.jade;
                  const typeColor = rec.type === "buy" ? P.gain : rec.type === "sell" ? P.loss : P.gray;
                  const isExpanded = expandedId === rec.id;

                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06, duration: 0.4, ease }}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className="rounded-2xl overflow-hidden"
                      style={{ background: P.surface, border: `1px solid ${P.border}30` }}
                    >
                      {/* Header row */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : rec.id)}
                        className="w-full flex items-center gap-5 p-5 cursor-pointer text-left"
                      >
                        <StockLogo ticker={rec.ticker} color={color} />
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-bold mb-0.5">{rec.headline}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full"
                              style={{ background: `${typeColor}15`, color: typeColor }}>
                              {rec.type}
                            </span>
                            <span className="text-[12px]" style={{ color: P.gray }}>
                              {stock?.name} · ${stock?.price.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 mr-2">
                          <div className="text-[20px] font-bold">{rec.confidence}%</div>
                          <div className="text-[10px] uppercase tracking-wider" style={{ color: P.gray }}>confidence</div>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </motion.div>
                      </button>

                      {/* Expanded reasoning + confirm */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5" style={{ borderTop: `1px solid ${P.border}20` }}>
                              <p className="text-[13px] leading-[1.8] pt-4 mb-4" style={{ color: P.gray }}>
                                {rec.reasoning}
                              </p>
                              {rec.type !== "hold" && (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.97 }}
                                  transition={spring}
                                  onClick={() => openTrade(rec)}
                                  className="px-6 py-3 rounded-xl text-[13px] font-semibold cursor-pointer"
                                  style={{ background: typeColor, color: P.white }}
                                >
                                  {rec.type === "buy" ? "Buy" : "Sell"} {stock?.name} · ${rec.amount}
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
        )}

        {/* ═══ AUTONOMOUS TRADES ═══ */}
        {tradingOn && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="mb-16"
          >
              <div className="flex items-center gap-3 mb-6">
                <SectionTitle>Autonomous trades</SectionTitle>
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase"
                  style={{ background: `${P.jade}15`, color: P.jade }}>
                  Live
                </motion.div>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={spring}
                className="flex gap-3 mb-6 origin-left"
              >
                <TogglePill checked={true} onChange={() => {}} label="Max $500 / trade"
                  icon="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                <TogglePill checked={true} onChange={() => {}} label="Max 3 trades / day"
                  icon="M3 12h18M3 6h18M3 18h18" />
                <TogglePill checked={false} onChange={() => {}} label="Sell protection"
                  icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </motion.div>

              <div className="flex flex-col gap-3">
                {AUTO_TRADES.map((t, i) => {
                  const color = STOCK_COLORS[t.ticker] || P.jade;
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.015, y: -3 }}
                      transition={spring}
                      className="flex items-center gap-5 py-4 px-5 rounded-2xl cursor-default"
                      style={{ background: P.surface, border: `1px solid ${P.border}30` }}
                    >
                      <StockLogo ticker={t.ticker} color={color} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[14px] font-semibold">{t.ticker}</span>
                          <span className="text-[11px] font-semibold uppercase"
                            style={{ color: t.action === "buy" ? P.gain : P.loss }}>
                            {t.action}
                          </span>
                          <span className="text-[12px] font-semibold">${t.amount}</span>
                          <span className="text-[11px]" style={{ color: P.gray }}>· {t.shares} shares</span>
                        </div>
                        <p className="text-[12px]" style={{ color: P.gray }}>{t.reason}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="px-3 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: `${P.jade}15`, color: P.jade }}>
                          executed
                        </div>
                        <div className="text-[11px] mt-1" style={{ color: P.gray }}>{t.time}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
        )}

        {/* ═══ EXPLAINER ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease }}
        >
          <motion.div whileHover={{ scale: 1.01 }} transition={spring} className="p-6 rounded-2xl" style={{ background: P.surface, border: `1px solid ${P.border}30` }}>
            <div className="flex items-center gap-3 mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[16px] font-semibold">How does the AI work?</span>
            </div>
            <p className="text-[14px] leading-relaxed" style={{ color: P.gray }}>
              Three independent models — XGBoost (technical), Sentiment (NLP), and Macro (economics) — analyze your portfolio in real-time. Each model votes buy, hold, or sell. In Advisor mode, you see their reasoning and approve each trade with your wallet. In Autonomous mode, trades execute automatically when at least 2 of 3 models agree, within your configured limits. All inference runs on 0G Compute for verifiable, decentralized AI.
            </p>
          </motion.div>
        </motion.section>
      </div>

      {/* ═══ WALLET CONFIRMATION MODAL ═══ */}
      <AnimatePresence>
        {confirmTrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={() => setConfirmTrade(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="w-full max-w-md rounded-2xl p-6"
              style={{ background: P.surface }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Wallet icon */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: `${P.jade}15` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12V7H5a2 2 0 010-4h14v4" />
                    <path d="M3 5v14a2 2 0 002 2h16v-5" />
                    <path d="M18 12a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <h3 className="text-[18px] font-bold mb-1">Confirm transaction</h3>
                <p className="text-[13px]" style={{ color: P.gray }}>
                  Review and sign with your embedded wallet.
                </p>
              </div>

              {/* Trade details */}
              <div className="flex flex-col gap-3 mb-6 p-4 rounded-xl" style={{ background: `${P.dark}06` }}>
                <div className="flex justify-between">
                  <span className="text-[12px]" style={{ color: P.gray }}>Action</span>
                  <span className="text-[13px] font-semibold uppercase"
                    style={{ color: confirmTrade.type === "buy" ? P.gain : P.loss }}>
                    {confirmTrade.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px]" style={{ color: P.gray }}>Stock</span>
                  <span className="text-[13px] font-semibold">
                    {MARKET.find((s) => s.ticker === confirmTrade.ticker)?.name} ({confirmTrade.ticker})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px]" style={{ color: P.gray }}>Amount</span>
                  <span className="text-[13px] font-semibold">${confirmTrade.amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px]" style={{ color: P.gray }}>Confidence</span>
                  <span className="text-[13px] font-semibold">{confirmTrade.confidence}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[12px]" style={{ color: P.gray }}>Gas</span>
                  <span className="text-[13px] font-semibold" style={{ color: P.jade }}>Sponsored (free)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmTrade(null)}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold cursor-pointer"
                  style={{ background: `${P.dark}08`, color: P.dark }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={executeTrade}
                  className="flex-1 py-3 rounded-xl text-[13px] font-semibold cursor-pointer"
                  style={{
                    background: confirmTrade.type === "buy" ? P.jade : P.loss,
                    color: P.white,
                  }}
                >
                  Sign &amp; {confirmTrade.type === "buy" ? "Buy" : "Sell"}
                </motion.button>
              </div>

              {/* Wallet note */}
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span className="text-[11px]" style={{ color: P.gray }}>Signed by your embedded wallet — no gas fees</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trade modal (after confirmation) */}
      <AnimatePresence>
        {tradeStock && <TradeModal stock={tradeStock} onClose={() => setTradeStock(null)} />}
      </AnimatePresence>
    </div>
  );
}
