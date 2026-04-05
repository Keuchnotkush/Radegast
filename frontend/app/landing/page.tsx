"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "./nav";
import { P, ease, spring } from "../lib/theme";

const USE_CASES = [
  {
    num: "01",
    color: P.jade,
    title: "Invest 24/7 from änywhere",
    desc: "Sign in with Google. Pick a strategy. Buy fractional US stocks from $1. No brokerage account, no crypto knowledge, no minimum balance.",
    highlights: [
      { label: "One-click onboärding", detail: "Google login creates an invisible embedded wallet. No seed phrase, no extension, no järgon.", color: P.jade },
      { label: "Fräctional from $1", detail: "Own 0.003 shares of NVIDIA. A student in Lagos can build a US portfolio from their phone.", color: P.indigo },
      { label: "Fiat onrämp", detail: "Apple Pay, card, or bank transfer. Coinbase converts to USDC — the user never sees a single crypto term.", color: P.terracotta },
    ],
    stats: [
      { val: "5B+", label: "smartphone users worldwide" },
      { val: "< 300M", label: "have access to US stocks" },
      { val: "$0", label: "minimum to start" },
    ],
  },
  {
    num: "02",
    color: P.indigo,
    title: "AI portfolio ädvisor",
    desc: "3 independent AI models on 0G Compute analyze your positions and vote. Majority wins. No single AI controls your money. Every decision is settled on-chain.",
    highlights: [
      { label: "XGBoost (ONNX)", detail: "37 statistical features — momentum, RSI, Bollinger bands, cross-asset correlation matrices. Pure math.", color: P.jade },
      { label: "LLM A + LLM B", detail: "Two independent language models analyze news, earnings, macro sentiment. Different architectures to avoid single-model bias.", color: P.indigo },
      { label: "Advisory or Träde", detail: "Advisory: AI suggests, you decide. Trade: AI auto-executes — rebalances, takes profit, cuts losses. You choose your autonomy.", color: P.terracotta },
    ],
    stats: [
      { val: "3", label: "independent AI models" },
      { val: "2/3", label: "majority vote required" },
      { val: "100%", label: "decisions auditable on-chain" },
    ],
  },
  {
    num: "03",
    color: P.roseAncien,
    title: "ZK proof of solvency",
    desc: "Prove your portfolio exceeds $50K to any bank — without revealing a single holding. Zero-knowledge proof generated in your browser, verified on-chain. Just a QR code.",
    highlights: [
      { label: "Client-side ZK", detail: "Noir.js runs in the browser via WASM. Your balances never leave your device. The proof is the only output.", color: P.roseAncien },
      { label: "On-chain verification", detail: "UltraPlonk smart contract on 0G Chain verifies the proof. Stored permanently. Verifiable by anyone, anytime.", color: P.safran },
      { label: "Reäl-world impäct", detail: "Fannie Mae accepts crypto for mortgages since March 2026. But they require full disclosure. Radegast proves wealth without revealing it.", color: P.jade },
    ],
    stats: [
      { val: "~10s", label: "proof generation time" },
      { val: "0", label: "private data revealed" },
      { val: "∞", label: "proof validity on-chain" },
    ],
  },
];

function UseCases() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-32 px-5 md:px-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-4 md:gap-5">
        {USE_CASES.map((uc, i) => {
          const isOpen = openIdx === i;
          return (
            <motion.div
              key={uc.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease, delay: i * 0.08 }}
              className="overflow-hidden"
            >
              {/* Number — always visible, centered */}
              <motion.button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex flex-col items-center cursor-pointer w-full group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
              >
                <motion.span
                  className="text-7xl md:text-[120px] font-bold leading-none select-none"
                  animate={{
                    color: isOpen ? uc.color : `${uc.color}30`,
                  }}
                  transition={{ duration: 0.4, ease }}
                >
                  {uc.num}
                </motion.span>
                <motion.div
                  animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -5 : 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="mt-1"
                >
                  <h3 className="text-lg md:text-xl font-bold text-center" style={{ color: P.dark }}>{uc.title}</h3>
                </motion.div>
              </motion.button>

              {/* Colored block — deploys from number */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, borderRadius: 40 }}
                    animate={{ height: "auto", opacity: 1, borderRadius: 20 }}
                    exit={{ height: 0, opacity: 0, borderRadius: 40 }}
                    transition={{ duration: 0.55, ease }}
                    className="overflow-hidden mt-3"
                    style={{ background: uc.color }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease, delay: 0.15 }}
                      className="p-6 md:p-10 text-center"
                    >
                      {/* Title + desc inside block */}
                      <h3 className="text-2xl md:text-4xl font-bold mb-3" style={{ color: "#FFFFFF" }}>{uc.title}</h3>
                      <p className="text-[15px] leading-relaxed max-w-2xl mx-auto mb-8" style={{ color: `rgba(255,255,255,0.75)` }}>
                        {uc.desc}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap justify-center gap-6 md:gap-10 mb-8">
                        {uc.stats.map((s, si) => (
                          <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease, delay: 0.25 + si * 0.08 }}
                          >
                            <div className="w-8 h-[3px] rounded-full mb-2" style={{ background: `rgba(255,255,255,0.4)` }} />
                            <div className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>{s.val}</div>
                            <div className="text-[12px] mt-0.5" style={{ color: `rgba(255,255,255,0.6)` }}>{s.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Highlight cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {uc.highlights.map((h, hi) => (
                          <motion.div
                            key={h.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease, delay: 0.35 + hi * 0.08 }}
                            whileHover={{ scale: 1.03, y: -3 }}
                            className="py-5 px-5 rounded-xl"
                            style={{ background: `rgba(255,255,255,0.12)`, border: `1px solid rgba(255,255,255,0.15)` }}
                          >
                            <div className="w-6 h-[2px] rounded-full mb-3" style={{ background: `rgba(255,255,255,0.5)` }} />
                            <div className="text-[13px] font-bold mb-2" style={{ color: "#FFFFFF" }}>{h.label}</div>
                            <p className="text-[13px] leading-relaxed" style={{ color: `rgba(255,255,255,0.7)` }}>{h.detail}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen pb-20 md:pb-0 relative" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>

      <Nav />

      {/* HERO */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-5 md:px-8 overflow-visible">
        <motion.div className="flex flex-col items-center overflow-visible">

          {/* LOGO */}
          <div className="w-full max-w-[1400px] mb-14 flex justify-center relative overflow-visible">
            <motion.img
              src="/logo-no-dots.svg"
              alt="Radegast"
              initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="w-full"
            />
            {/* Floating tréma dots — CSS keyframes for buttery smooth animation */}
            <style>{`
              @keyframes float0 {
                0%, 100% { transform: translate(0, 0); }
                17% { transform: translate(3px, -10px); }
                38% { transform: translate(-2px, 4px); }
                55% { transform: translate(5px, -6px); }
                72% { transform: translate(-1px, 8px); }
                89% { transform: translate(2px, -3px); }
              }
              @keyframes float1 {
                0%, 100% { transform: translate(0, 0); }
                14% { transform: translate(-4px, 7px); }
                33% { transform: translate(2px, -9px); }
                52% { transform: translate(-3px, 3px); }
                68% { transform: translate(4px, -5px); }
                85% { transform: translate(-1px, 6px); }
              }
              @keyframes float2 {
                0%, 100% { transform: translate(0, 0); }
                19% { transform: translate(2px, -8px); }
                36% { transform: translate(-4px, 5px); }
                58% { transform: translate(3px, -11px); }
                77% { transform: translate(-2px, 4px); }
                91% { transform: translate(1px, -6px); }
              }
              @keyframes float3 {
                0%, 100% { transform: translate(0, 0); }
                12% { transform: translate(-3px, 9px); }
                31% { transform: translate(4px, -7px); }
                49% { transform: translate(-2px, 5px); }
                71% { transform: translate(3px, -10px); }
                88% { transform: translate(-1px, 3px); }
              }
            `}</style>
            {[
              { left: "16.2%", top: "-2%", anim: "float0 7s ease-in-out infinite", del: 0 },
              { left: "20.9%", top: "-2%", anim: "float1 8.2s ease-in-out infinite", del: 0.4 },
              { left: "66.4%", top: "-2%", anim: "float2 7.6s ease-in-out infinite", del: 0.9 },
              { left: "71.2%", top: "-2%", anim: "float3 8.8s ease-in-out infinite", del: 1.3 },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: dot.left,
                  top: dot.top,
                  width: "clamp(12px, 1.8vw, 26px)",
                  height: "clamp(12px, 1.8vw, 26px)",
                  background: P.jade,
                  animation: dot.anim,
                  animationDelay: `${2.8 + dot.del}s`,
                  willChange: "transform",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  opacity: { duration: 0.6, delay: 2.0 + dot.del, ease: [0.16, 1, 0.3, 1] },
                  scale: { type: "spring", stiffness: 300, damping: 15, delay: 2.0 + dot.del },
                }}
              />
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7, ease }}
            className="text-lg max-w-xl leading-relaxed text-center"
            style={{ color: P.gray }}
          >
            Buy Tesla, NVIDIA, Apple as tokens. AI watches your portfolio.
            Prove your wealth to any bank — zero knowledge, zero trust needed.
          </motion.p>

        </motion.div>
      </section>

      {/* USE CASES */}
      <UseCases />

      {/* CLOSING STATEMENT */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="py-16 md:py-24 px-5 md:px-8 text-center"
      >
        <p className="text-xl md:text-2xl font-bold max-w-[1200px] mx-auto leading-relaxed">
          This is not ä crypto project pretending to be finänce.
          <br />
          <span style={{ color: P.jade }}>This is finänce, rebuilt from first principles.</span>
        </p>
      </motion.section>

      {/* FOOTER */}
      <footer className="py-10 text-center" style={{ borderTop: `1px solid ${P.gray}12` }}>
        <span className="text-[13px]" style={{ color: P.gray }}>ETHGlobal Cannes 2026</span>
      </footer>
    </div>
  );
}
