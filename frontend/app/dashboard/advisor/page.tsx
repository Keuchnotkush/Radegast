"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TogglePill, P, ease, spring } from "../shared";
import { useSettings, useUser } from "../store";

/* ─── AI Models (structure only — votes come from backend) ─── */
const MODELS: { name: string; color: string; desc: string; details: string[]; stats: { val: string; label: string }[] }[] = [
  {
    name: "XGBoost",
    color: "#2E8B57",
    desc: "Technical — RSI, MACD, volume, price patterns",
    details: [
      "37 statistical features computed per asset — momentum, RSI, Bollinger bands, cross-asset correlation matrices",
      "ONNX runtime for deterministic, reproducible inference across any environment",
      "Trained on 15 years of daily price data across 500+ equities",
    ],
    stats: [
      { val: "37", label: "features per asset" },
      { val: "15y", label: "training history" },
      { val: "<50ms", label: "inference time" },
    ],
  },
  {
    name: "Sentiment",
    color: "#4B0082",
    desc: "NLP — news, social, earnings call analysis",
    details: [
      "Processes real-time news feeds, social media signals, and earnings call transcripts",
      "Multi-source aggregation reduces single-platform bias and noise",
      "Detects sentiment shifts before they reflect in price action",
    ],
    stats: [
      { val: "50K+", label: "articles/day" },
      { val: "2", label: "independent LLMs" },
      { val: "~4h", label: "lead on price" },
    ],
  },
  {
    name: "Macro",
    color: "#CC5A3A",
    desc: "Economics — Fed rates, CPI, sector rotation",
    details: [
      "Tracks Fed interest rate decisions, CPI releases, unemployment, GDP revisions",
      "Models sector rotation cycles — defensive vs cyclical positioning",
      "Correlates macro regime changes with historical equity performance",
    ],
    stats: [
      { val: "12", label: "macro indicators" },
      { val: "4", label: "regime types" },
      { val: "60y", label: "cycle history" },
    ],
  },
];

export default function AdvisorPage() {
  const { initial } = useUser();
  const { aiSuggestions, setAiSuggestions, autoSession } = useSettings();
  const [openModel, setOpenModel] = useState<number | null>(null);
  const advisorOn = aiSuggestions;
  const tradingOn = autoSession.active;

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
              <div className="flex flex-row gap-4">
                {MODELS.map((m, i) => {
                  const isOpen = openModel === i;
                  return (
                    <motion.div
                      key={m.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.5, ease, delay: i * 0.08 }}
                      className="overflow-hidden flex-1"
                    >
                      {/* Clickable header */}
                      <motion.button
                        onClick={() => setOpenModel(isOpen ? null : i)}
                        className="flex flex-col items-center cursor-pointer w-full group"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                      >
                        <motion.span
                          className="text-4xl md:text-6xl font-bold leading-none select-none"
                          animate={{ color: isOpen ? m.color : `${m.color}30` }}
                          transition={{ duration: 0.4, ease }}
                        >
                          {m.name}
                        </motion.span>
                        <motion.div
                          animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -5 : 0 }}
                          transition={{ duration: 0.3, ease }}
                          className="mt-1"
                        >
                          <p className="text-sm text-center" style={{ color: P.gray }}>{m.desc}</p>
                        </motion.div>
                      </motion.button>

                      {/* Expanded block */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0, borderRadius: 40 }}
                            animate={{ height: "auto", opacity: 1, borderRadius: 20 }}
                            exit={{ height: 0, opacity: 0, borderRadius: 40 }}
                            transition={{ duration: 0.55, ease }}
                            className="overflow-hidden mt-3"
                            style={{ background: m.color }}
                          >
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.4, ease, delay: 0.15 }}
                              className="p-6 md:p-10 text-center"
                            >
                              <h3 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: "#FFFFFF" }}>{m.name}</h3>
                              <p className="text-[14px] leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.75)" }}>
                                {m.desc}
                              </p>

                              {/* Stats */}
                              <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8">
                                {m.stats.map((s, si) => (
                                  <motion.div
                                    key={s.label}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease, delay: 0.25 + si * 0.08 }}
                                  >
                                    <div className="w-8 h-[3px] rounded-full mb-2" style={{ background: "rgba(255,255,255,0.4)" }} />
                                    <div className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>{s.val}</div>
                                    <div className="text-[12px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Detail cards */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {m.details.map((d, di) => (
                                  <motion.div
                                    key={di}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, ease, delay: 0.35 + di * 0.08 }}
                                    whileHover={{ scale: 1.03, y: -3 }}
                                    className="py-5 px-5 rounded-xl text-left"
                                    style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)" }}
                                  >
                                    <div className="w-6 h-[2px] rounded-full mb-3" style={{ background: "rgba(255,255,255,0.5)" }} />
                                    <p className="text-[13px] leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{d}</p>
                                  </motion.div>
                                ))}
                              </div>

                              {/* Status badge */}
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full"
                                style={{ background: "rgba(255,255,255,0.15)" }}
                              >
                                <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
                                <span className="text-[11px] font-semibold uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>
                                  Waiting for backend
                                </span>
                              </motion.div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
              <div className="flex flex-col items-center text-center py-12 mt-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <p className="text-[15px] font-semibold" style={{ color: P.dark }}>No recommendations yet</p>
                <p className="text-[13px] mt-2 max-w-sm" style={{ color: P.gray }}>
                  When the AI backend is connected, buy/hold/sell recommendations from the 3 models will appear here.
                </p>
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

              <div className="flex flex-col items-center text-center py-10">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}15` }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-[14px] font-medium" style={{ color: P.dark }}>No autonomous trades yet</p>
                <p className="text-[12px] mt-1" style={{ color: P.gray }}>
                  Trades will appear here once the AI backend is connected.
                </p>
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

    </div>
  );
}
