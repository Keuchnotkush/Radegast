"use client";

import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TogglePill, P, ease, spring } from "../shared";
import { useSettings, useUser } from "../store";

/* ─── AI Models (structure only — votes come from backend) ─── */
const MODELS: { name: string; desc: string }[] = [
  { name: "XGBoost", desc: "Technical — RSI, MACD, volume, price patterns" },
  { name: "Sentiment", desc: "NLP — news, social, earnings call analysis" },
  { name: "Macro", desc: "Economics — Fed rates, CPI, sector rotation" },
];

export default function AdvisorPage() {
  const { initial } = useUser();
  const { aiSuggestions, setAiSuggestions, autoSession } = useSettings();
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                {MODELS.map((m, i) => (
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
                      style={{ background: `${P.border}15`, color: P.gray }}>
                      —
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold">{m.name}</span>
                        <span className="text-[11px] font-semibold uppercase" style={{ color: P.gray }}>waiting</span>
                      </div>
                      <p className="text-[12px] mt-1 leading-relaxed" style={{ color: P.gray }}>{m.desc}</p>
                    </div>
                  </motion.div>
                ))}
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
