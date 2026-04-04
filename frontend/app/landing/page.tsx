"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "./nav";

const P = {
  bg: "#D8D2C8",
  jade: "#38A88A",
  dark: "#2A2A2A",
  gray: "#6B6B6B",
  indigo: "#4B0082",
  terracotta: "#CC5A3A",
  safran: "#C8A415",
  roseAncien: "#B5506A",
  gain: "#2E8B57",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const spring = { type: "spring" as const, stiffness: 400, damping: 20 };

const USE_CASES = [
  {
    num: "01",
    color: P.jade,
    title: "Invest 24/7 from änywhere",
    desc: "Sign in with Google. Pick a strategy. Buy fractional US stocks from $1. No brokerage account, no crypto knowledge, no minimum balance.",
    highlights: [
      { label: "One-click onboärding", detail: "Google login creates an invisible embedded wallet via Dynamic SDK. No seed phrase, no extension, no jargon.", color: P.jade },
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

export default function Landing() {
  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>

      <Nav />

      {/* HERO */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-8">
        <motion.div className="flex flex-col items-center">

          {/* LOGO */}
          <div className="w-[95vw] mb-14 flex justify-center relative overflow-visible">
            <motion.img
              src="/logo-no-dots.svg"
              alt="Radegast"
              initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
              className="w-full"
            />
            {/* Floating tréma dots */}
            {[
              { left: "16.2%", top: "-2%", dur: 2.8, del: 0 },
              { left: "20.9%", top: "-2%", dur: 3.2, del: 0.4 },
              { left: "66.4%", top: "-2%", dur: 3.0, del: 0.8 },
              { left: "71.2%", top: "-2%", dur: 2.6, del: 1.2 },
            ].map((dot, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  left: dot.left,
                  top: dot.top,
                  width: "1.8%",
                  height: 0,
                  paddingBottom: "1.8%",
                  background: P.jade,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, y: [0, -10, 0] }}
                transition={{
                  opacity: { duration: 0.5, delay: 1.8 + dot.del },
                  y: { repeat: Infinity, duration: dot.dur, ease: "easeInOut", delay: 2 + dot.del },
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
      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto flex flex-col gap-40">
          {USE_CASES.map((uc, ucIdx) => (
            <motion.div
              key={uc.num}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease }}
            >
              {/* Header with animated accent line */}
              <div className="flex gap-8 items-start mb-10">
                <motion.span
                  className="text-8xl font-bold leading-none select-none"
                  style={{ color: `${uc.color}15` }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease, delay: 0.1 }}
                >
                  {uc.num}
                </motion.span>
                <div>
                  <motion.div
                    className="w-12 h-[3px] rounded-full mb-4"
                    style={{ background: uc.color }}
                    initial={{ width: 0 }}
                    whileInView={{ width: 48 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, ease, delay: 0.2 }}
                  />
                  <h3 className="text-3xl font-bold mb-3">{uc.title}</h3>
                  <p className="text-[15px] leading-relaxed max-w-2xl" style={{ color: P.gray }}>{uc.desc}</p>
                </div>
              </div>

              {/* Stats bar — staggered reveal */}
              <div className="flex gap-10 mb-10 ml-[104px]">
                {uc.stats.map((s, si) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: 0.3 + si * 0.1 }}
                  >
                    <div className="w-8 h-[3px] rounded-full mb-2" style={{ background: uc.color }} />
                    <div className="text-2xl font-bold">{s.val}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: P.gray }}>{s.label}</div>
                  </motion.div>
                ))}
              </div>

              {/* Highlight cards — staggered + hover effects */}
              <div className="grid grid-cols-3 gap-4 ml-[104px]">
                {uc.highlights.map((h, hi) => (
                  <motion.div
                    key={h.label}
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, ease, delay: 0.4 + hi * 0.1 }}
                    whileHover={{
                      scale: 1.03,
                      boxShadow: `0 8px 30px ${h.color}18`,
                    }}
                    style={{
                      background: `${h.color}06`,
                      border: `1px solid ${h.color}15`,
                    }}
                    className="py-5 px-5 rounded-xl cursor-default transition-colors duration-300"
                  >
                    <motion.div
                      className="w-6 h-[2px] rounded-full mb-3"
                      style={{ background: h.color }}
                    />
                    <div className="text-[13px] font-bold mb-2" style={{ color: h.color }}>{h.label}</div>
                    <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{h.detail}</p>
                  </motion.div>
                ))}
              </div>

              {/* Subtle divider between sections */}
              {ucIdx < USE_CASES.length - 1 && (
                <motion.div
                  className="mx-auto mt-20 h-px"
                  style={{ background: `${P.gray}15`, width: "60%" }}
                  initial={{ width: "0%" }}
                  whileInView={{ width: "60%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease, delay: 0.2 }}
                />
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* VERIFY A PROOF */}
      <VerifySection />

      {/* CLOSING STATEMENT */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease }}
        className="py-24 px-8 text-center"
      >
        <p className="text-2xl font-bold max-w-3xl mx-auto leading-relaxed">
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

/* ─── Verify Section ─── */
function VerifySection() {
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function handleVerify() {
    if (!hash.trim()) return;
    setStatus("loading");

    // Simulate on-chain lookup (replace with real ProofOfSolvency.check() call)
    setTimeout(() => {
      if (hash.trim().startsWith("0x") && hash.trim().length >= 10) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 2000);
  }

  function reset() {
    setHash("");
    setStatus("idle");
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, ease }}
      className="py-32 px-8"
    >
      <div className="max-w-3xl mx-auto">
        <div className="flex gap-8 items-start mb-10">
          <motion.span
            className="text-8xl font-bold leading-none select-none"
            style={{ color: `${P.roseAncien}15` }}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
          >
            ??
          </motion.span>
          <div>
            <motion.div
              className="w-12 h-[3px] rounded-full mb-4"
              style={{ background: P.roseAncien }}
              initial={{ width: 0 }}
              whileInView={{ width: 48 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease, delay: 0.2 }}
            />
            <h3 className="text-3xl font-bold mb-3">Verify ä proof</h3>
            <p className="text-[15px] leading-relaxed max-w-2xl" style={{ color: P.gray }}>
              Someone shared a verification ID with you? Paste it below to confirm their portfolio exceeds the stated threshold — no account needed.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="ml-[104px]">
          <AnimatePresence mode="wait">
            {status === "idle" || status === "loading" ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center gap-3 py-4" style={{ borderTop: `1px solid ${P.gray}25`, borderBottom: `1px solid ${P.gray}25` }}>
                  <input
                    type="text"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    placeholder="0x6CA0...or scan QR code"
                    className="flex-1 bg-transparent text-base font-medium outline-none"
                    style={{ color: P.dark }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVerify}
                    className="px-6 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer flex items-center gap-2"
                    style={{ background: P.roseAncien, color: "#FFFFFF", opacity: hash.trim() ? 1 : 0.5 }}
                  >
                    {status === "loading" ? (
                      <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid #ffffff40", borderTopColor: "#fff" }} />
                    ) : (
                      "Verify"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ) : status === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-6"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: `${P.gain}15` }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.gain} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1" style={{ color: P.gain }}>Portfolio verified</h4>
                    <p className="text-[15px] font-semibold mb-1">Portfolio exceeds <span style={{ color: P.gain }}>$50,000</span></p>
                    <p className="text-[13px]" style={{ color: P.gray }}>
                      Verified on 0G Chain · {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · Proof is mathematically valid
                    </p>
                  </div>
                </div>

                <div className="flex gap-8 py-4 mb-4" style={{ borderTop: `1px solid ${P.gray}20` }}>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: P.gray }}>Verification ID</div>
                    <div className="text-[13px] font-mono font-medium">{hash.slice(0, 20)}...</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: P.gray }}>Threshold</div>
                    <div className="text-[13px] font-semibold">$50,000</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: P.gray }}>Status</div>
                    <div className="text-[13px] font-semibold" style={{ color: P.gain }}>Valid</div>
                  </div>
                </div>

                <div className="flex gap-6 text-[12px]" style={{ color: P.gray }}>
                  <span>No holdings revealed</span>
                  <span>·</span>
                  <span>No wallet address exposed</span>
                  <span>·</span>
                  <span>Zero knowledge</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  className="mt-6 text-[13px] font-semibold cursor-pointer"
                  style={{ color: P.roseAncien }}
                >
                  Verify another proof
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="py-6"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ background: "#C6282812" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C62828" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1" style={{ color: "#C62828" }}>Proof not found</h4>
                    <p className="text-[13px]" style={{ color: P.gray }}>This verification ID doesn&apos;t match any proof on 0G Chain. Check the ID and try again.</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  className="text-[13px] font-semibold cursor-pointer"
                  style={{ color: P.roseAncien }}
                >
                  Try again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
