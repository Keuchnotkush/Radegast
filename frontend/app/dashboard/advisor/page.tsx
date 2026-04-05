"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TogglePill, P, ease, spring } from "../shared";
import { useSettings, useUser, usePortfolio, useWallet, MARKET } from "../store";
import { useAI } from "@/lib/hooks/useAI";
import type { ConsensusResult } from "@/lib/hooks/useAI";

/* ─── Ticker → xStock symbol mapping ─── */
const TICKER_TO_XSTOCK: Record<string, string> = {
  TSLA: "TSLAx", AAPL: "AAPLx", NVDA: "NVDAx", GOOGL: "GOOGx",
  AMZN: "AMZNx", META: "METAx", SPY: "SPYx", QQQ: "NDXx",
  MSTR: "MSTRx", MSFT: "MSFTx", JPM: "JPMx", V: "Vx",
  XOM: "XOMx", LLY: "LLYx", "MC.PA": "LVMHx",
};

/* ─── AI Models (structure only — votes come from backend) ─── */
const MODELS: { name: string; desc: string; key: string }[] = [
  { name: "XGBoost", desc: "Technical — RSI, MACD, volume, price patterns", key: "xgboost" },
  { name: "Sentiment", desc: "NLP — news, social, earnings call analysis", key: "llm_a" },
  { name: "Macro", desc: "Economics — Fed rates, CPI, sector rotation", key: "llm_b" },
];

/* ─── Label color helper ─── */
function labelColor(label: string) {
  if (label === "LOW") return P.gain;
  if (label === "HIGH") return P.loss;
  return "#C8A415";
}

export default function AdvisorPage() {
  const { initial } = useUser();
  const { address: walletAddress } = useWallet();
  const { aiSuggestions, setAiSuggestions, autoSession } = useSettings();
  const { holdings, totalValue } = usePortfolio();
  const { runConsensus, loading, error } = useAI();
  const [result, setResult] = useState<ConsensusResult | null>(null);
  const advisorOn = aiSuggestions;
  const tradingOn = autoSession.active;

  /* Convert holdings to xStock positions (percentages) */
  const buildPositions = useCallback((): Record<string, number> => {
    const total = totalValue();
    if (total === 0) return {};
    const positions: Record<string, number> = {};
    for (const h of holdings) {
      const stock = MARKET.find((s) => s.ticker === h.ticker);
      if (!stock) continue;
      const xSymbol = TICKER_TO_XSTOCK[h.ticker];
      if (!xSymbol) continue;
      positions[xSymbol] = (stock.price * h.shares / total) * 100;
    }
    return positions;
  }, [holdings, totalValue]);

  const handleAnalyze = useCallback(async () => {
    const positions = buildPositions();
    if (Object.keys(positions).length === 0) return;
    const mode = tradingOn ? "trade" : "conseil";
    const consensus = await runConsensus({
      user: walletAddress || "frontend_user",
      positions,
      strategy: "balanced",
      mode,
    });
    if (consensus) setResult(consensus);
  }, [buildPositions, tradingOn, runConsensus]);

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={initial} />

      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-16 pt-20 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-14"
        >
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Your AI, <span style={{ color: P.jade }}>your rules</span>.
          </h1>
          <p className="text-lg mt-3" style={{ color: P.gray }}>
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

        {/* ═══ ANALYZE BUTTON ═══ */}
        {(advisorOn || tradingOn) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-10"
          >
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-3 rounded-xl text-[14px] font-semibold transition-all"
              style={{
                background: loading ? P.border : P.jade,
                color: "#fff",
                cursor: loading ? "wait" : "pointer",
              }}
            >
              {loading ? "Analyzing portfolio…" : "Analyze my portfolio"}
            </button>
            {error && (
              <p className="text-[13px] mt-3" style={{ color: P.loss }}>
                AI service unavailable: {error}
              </p>
            )}
          </motion.section>
        )}

        {/* ═══ CONSENSUS SUMMARY ═══ */}
        {result && (advisorOn || tradingOn) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="mb-16"
          >
            <SectionTitle>Consensus result</SectionTitle>
            <div className="flex flex-wrap gap-6 mt-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: P.gray }}>Risk score</span>
                <span className="text-3xl font-bold mt-1" style={{ color: labelColor(result.consensus_label) }}>
                  {result.consensus_score.toFixed(1)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: P.gray }}>Risk level</span>
                <span
                  className="text-[14px] font-bold mt-2 px-3 py-1 rounded-full"
                  style={{ background: `${labelColor(result.consensus_label)}18`, color: labelColor(result.consensus_label) }}
                >
                  {result.consensus_label}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: P.gray }}>Confidence</span>
                <span className="text-3xl font-bold mt-1">{(result.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: P.gray }}>Models agreed</span>
                <span className="text-3xl font-bold mt-1">{result.providers_agreed}</span>
              </div>
            </div>
            {(result.da_hash || result.tx_hash) && (
              <div className="flex flex-wrap gap-4 mt-4">
                {result.da_hash && (
                  <span className="text-[11px] font-mono" style={{ color: P.gray }}>
                    DA: {result.da_hash.slice(0, 10)}…{result.da_hash.slice(-6)}
                  </span>
                )}
                {result.tx_hash && (
                  <span className="text-[11px] font-mono" style={{ color: P.gray }}>
                    TX: {result.tx_hash.slice(0, 10)}…{result.tx_hash.slice(-6)}
                  </span>
                )}
              </div>
            )}
          </motion.section>
        )}

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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {MODELS.map((m, i) => {
                  const hasResult = !!result;
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
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-[13px] font-bold"
                        style={{
                          background: hasResult ? `${labelColor(result.consensus_label)}15` : `${P.border}15`,
                          color: hasResult ? labelColor(result.consensus_label) : P.gray,
                        }}
                      >
                        {hasResult ? result.consensus_score.toFixed(0) : "—"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] font-semibold">{m.name}</span>
                          <span
                            className="text-[11px] font-semibold uppercase"
                            style={{ color: hasResult ? labelColor(result.consensus_label) : P.gray }}
                          >
                            {hasResult ? result.consensus_label : "waiting"}
                          </span>
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
              {result && result.suggestions.length > 0 ? (
                <div className="flex flex-col gap-3 mt-4">
                  {result.suggestions.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3, ease }}
                      className="flex items-start gap-3 p-4 rounded-xl"
                      style={{ background: P.surface, border: `1px solid ${P.border}30` }}
                    >
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5"
                        style={{ background: `${P.jade}15`, color: P.jade }}
                      >
                        {i + 1}
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: P.dark }}>{s}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-12 mt-4">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <p className="text-[15px] font-semibold" style={{ color: P.dark }}>No recommendations yet</p>
                  <p className="text-[13px] mt-2 max-w-sm" style={{ color: P.gray }}>
                    Click &quot;Analyze my portfolio&quot; to get buy/hold/sell recommendations from the 3 AI models.
                  </p>
                </div>
              )}
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

              {result && result.moves.length > 0 ? (
                <div className="flex flex-col gap-2 mt-4">
                  {result.moves.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.3, ease }}
                      className="flex items-center justify-between p-4 rounded-xl"
                      style={{ background: P.surface, border: `1px solid ${P.border}30` }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="text-[11px] font-bold uppercase px-2 py-0.5 rounded"
                          style={{
                            background: m.action === "buy" ? `${P.gain}18` : `${P.loss}18`,
                            color: m.action === "buy" ? P.gain : P.loss,
                          }}
                        >
                          {m.action}
                        </span>
                        <span className="text-[14px] font-semibold">{m.token}</span>
                      </div>
                      <span className="text-[14px] font-mono" style={{ color: P.gray }}>{m.pct.toFixed(1)}%</span>
                    </motion.div>
                  ))}
                  {result.trade_results && result.trade_results.length > 0 && (
                    <p className="text-[11px] mt-2" style={{ color: P.gray }}>
                      {result.trade_results.filter(t => t.success).length}/{result.trade_results.length} trades executed on-chain
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium" style={{ color: P.dark }}>No autonomous trades yet</p>
                  <p className="text-[12px] mt-1" style={{ color: P.gray }}>
                    Click &quot;Analyze my portfolio&quot; in trade mode to trigger autonomous rebalancing.
                  </p>
                </div>
              )}
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

    </div>
  );
}
