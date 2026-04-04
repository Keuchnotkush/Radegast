"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "../landing/nav";

const P = {
  jade: "#38A88A",
  jadeDark: "#2D8E74",
  jadeLight: "#45BA9A",
  dark: "#2A2A2A",
  white: "#FFFFFF",
  cream: "#D8D2C8",
  gain: "#2E8B57",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STEPS = [
  {
    num: "1", title: "Pick a threshold", bg: "#2D8E74",
    desc: "Choose the amount you want to prove — $10K, $50K, $100K.",
    detail: "The threshold is the only public input. It tells the circuit what to prove: that your total portfolio value exceeds this number. You never reveal the actual value.",
  },
  {
    num: "2", title: "ZK proof runs locally", bg: "#257A63",
    desc: "Noir.js generates a proof in your browser. Nothing leaves your device.",
    detail: "The Noir circuit takes your private inputs (balances, prices, a secret nonce), computes the total value, asserts it exceeds the threshold, and produces an UltraPlonk proof — all in WASM, entirely client-side.",
  },
  {
    num: "3", title: "Verified on-chain", bg: "#1E6B55",
    desc: "UltraVerifier on 0G Chain validates the proof and stores the attestation.",
    detail: "The proof is sent to the ProofOfSolvency smart contract. It calls the UltraVerifier with a staticcall. If valid, it stores an attestation: threshold, Poseidon commitment, timestamp, and a unique verifyId.",
  },
  {
    num: "4", title: "Get your ID", bg: "#175C48",
    desc: "A unique verification ID is generated. Share it, print it, embed it.",
    detail: "The verifyId is a keccak256 hash of your address, threshold, commitment, and block number. It's embedded in a PDF certificate with a QR code pointing to radegast.app/verify/{id}.",
  },
  {
    num: "5", title: "Anyone can check", bg: "#114D3C",
    desc: "Paste the ID here. They see the result — nothing else.",
    detail: "The verifier calls ProofOfSolvency.check(verifyId) on-chain. They get back: threshold, timestamp, and validity. No holdings, no wallet address, no transaction history. Pure zero-knowledge.",
  },
];

export default function Verify() {
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

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
    <div className="min-h-screen relative overflow-hidden" style={{ background: P.jade, fontFamily: "Sora, sans-serif", color: P.white }}>
      {/* ═══ Origami background shapes ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top-right triangle */}
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] opacity-[0.06]" style={{
          background: P.cream,
          clipPath: "polygon(100% 0%, 0% 0%, 100% 100%)",
        }} />
        {/* Left mid triangle */}
        <div className="absolute top-[30%] -left-16 w-[300px] h-[300px] opacity-[0.05]" style={{
          background: P.cream,
          clipPath: "polygon(0% 0%, 100% 50%, 0% 100%)",
        }} />
        {/* Bottom-right diamond */}
        <div className="absolute top-[55%] -right-10 w-[250px] h-[250px] opacity-[0.04]" style={{
          background: P.cream,
          clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
        }} />
        {/* Bottom-left large triangle */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] opacity-[0.05]" style={{
          background: P.cream,
          clipPath: "polygon(0% 100%, 100% 100%, 0% 0%)",
        }} />
        {/* Small accent triangle center-right */}
        <div className="absolute top-[80%] right-[20%] w-[120px] h-[120px] opacity-[0.07]" style={{
          background: P.cream,
          clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
        }} />
      </div>

      <Nav />

      {/* ═══ HERO — giant "Verify" with floating i dot ═══ */}
      <section className="flex flex-col items-center justify-center text-center px-5 md:px-8 pt-24 pb-12 md:pt-32 md:pb-16">
        <motion.div className="w-full max-w-[900px] relative select-none flex justify-center">
          {"Verify".split("").map((letter, i) => (
            <motion.span
              key={i}
              className="inline-block text-[18vw] md:text-[140px] font-bold leading-none"
              style={{ color: P.white }}
              initial={{ opacity: 0, y: -300 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15 + i * 0.08,
                duration: 0.8,
                type: "spring",
                stiffness: 300,
                damping: 12,
                mass: 1.2,
              }}
            >
              {letter}
            </motion.span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease }}
          className="text-base md:text-lg mt-6 max-w-xl leading-relaxed"
          style={{ color: `${P.white}CC` }}
        >
          Paste a verification ID to confirm a portfolio exceeds the stated threshold — no account needed, no data revealed.
        </motion.p>
      </section>

      {/* ═══ VERIFY INPUT ═══ */}
      <section className="px-5 md:px-8 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {(status === "idle" || status === "loading") && (
              <motion.div
                key="input"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease }}
              >
                <div
                  className="flex items-center gap-3 rounded-2xl px-6 py-4"
                  style={{ background: `${P.white}18`, backdropFilter: "blur(10px)", border: `1px solid ${P.white}25` }}
                >
                  <input
                    type="text"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    placeholder="0x6CA0f3b2..."
                    className="flex-1 bg-transparent text-base font-medium outline-none placeholder-white/40"
                    style={{ color: P.white }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVerify}
                    className="px-7 py-2.5 rounded-full text-[13px] font-bold cursor-pointer flex items-center gap-2 shrink-0"
                    style={{
                      background: P.white,
                      color: P.jade,
                      opacity: hash.trim() ? 1 : 0.5,
                    }}
                  >
                    {status === "loading" ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 rounded-full"
                        style={{ border: `2px solid ${P.jade}40`, borderTopColor: P.jade }}
                      />
                    ) : (
                      "Verify"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease }}
                className="rounded-2xl p-8"
                style={{ background: `${P.white}15`, backdropFilter: "blur(10px)", border: `1px solid ${P.white}20` }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: `${P.white}20` }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Portfolio verified</h2>
                    <p className="text-lg font-semibold mb-1">
                      Exceeds <span style={{ color: P.cream }}>$50,000</span>
                    </p>
                    <p className="text-[13px]" style={{ color: `${P.white}AA` }}>
                      Verified on 0G Chain &middot; {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} &middot; Mathematically valid
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 py-5 mb-4" style={{ borderTop: `1px solid ${P.white}15`, borderBottom: `1px solid ${P.white}15` }}>
                  {[
                    { label: "Verification ID", value: hash.slice(0, 18) + "..." },
                    { label: "Threshold", value: "$50,000" },
                    { label: "Circuit", value: "UltraPlonk" },
                    { label: "Chain", value: "0G Chain" },
                    { label: "Status", value: "Valid", accent: true },
                  ].map((d) => (
                    <div key={d.label}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: `${P.white}70` }}>{d.label}</div>
                      <div className="text-[13px] font-semibold" style={{ color: d.accent ? P.cream : P.white }}>{d.value}</div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-5 text-[12px] mb-6" style={{ color: `${P.white}90` }}>
                  <span>No holdings revealed</span>
                  <span>&middot;</span>
                  <span>No wallet exposed</span>
                  <span>&middot;</span>
                  <span>Zero knowledge</span>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  className="text-[13px] font-bold cursor-pointer px-5 py-2.5 rounded-full"
                  style={{ background: `${P.white}20`, color: P.white }}
                >
                  Verify another proof
                </motion.button>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease }}
                className="rounded-2xl p-8"
                style={{ background: `${P.white}12`, backdropFilter: "blur(10px)", border: `1px solid ${P.white}15` }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0" style={{ background: `${P.white}15` }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.cream} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1" style={{ color: P.cream }}>Proof not found</h2>
                    <p className="text-[13px]" style={{ color: `${P.white}AA` }}>
                      This verification ID doesn&apos;t match any proof on 0G Chain. Check the ID and try again.
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={reset}
                  className="text-[13px] font-bold cursor-pointer px-5 py-2.5 rounded-full"
                  style={{ background: `${P.white}20`, color: P.white }}
                >
                  Try again
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ═══ HOW IT WORKS — 5 colored blocks with expand ═══ */}
      <section className="px-5 md:px-8 pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="text-2xl font-bold mb-10"
          >
            How it works
          </motion.h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {STEPS.map((s, i) => {
              const isOpen = expandedStep === i;
              const hasOpen = expandedStep !== null;
              const isOther = hasOpen && !isOpen;
              return (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease }}
                  onClick={() => setExpandedStep(isOpen ? null : i)}
                  layout
                  className={`rounded-2xl p-5 flex flex-col cursor-pointer ${i === 4 ? "col-span-2 md:col-span-1" : ""} ${isOpen ? "col-span-2 md:col-span-3 row-span-2" : ""}`}
                  style={{ background: s.bg }}
                  animate={{
                    scale: isOther ? 0.97 : 1,
                    opacity: isOther ? 0.7 : 1,
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                      style={{ background: `${P.white}18`, color: P.white }}
                    >
                      {s.num}
                    </div>
                    <h3 className={`font-bold ${isOpen ? "text-[16px]" : "text-[14px]"}`} style={{ color: P.white }}>{s.title}</h3>
                  </div>
                  <p className="text-[12px] leading-relaxed mb-2" style={{ color: `${P.white}BB` }}>{s.desc}</p>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="text-[13px] leading-relaxed overflow-hidden mt-2 pt-3"
                        style={{ color: `${P.white}DD`, borderTop: `1px solid ${P.white}20` }}
                      >
                        {s.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ WHAT IT REVEALS — 2 colored blocks ═══ */}
      <section className="px-5 md:px-8 pb-20 md:pb-32">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="rounded-2xl p-6"
            style={{ background: "#2D8E74" }}
          >
            <div className="text-[13px] font-bold mb-5" style={{ color: P.cream }}>What the proof confirms</div>
            <ul className="flex flex-col gap-3">
              {["Portfolio exceeds stated threshold", "Proof is mathematically valid", "Verified on-chain with timestamp"].map((t) => (
                <li key={t} className="text-[13px] flex items-center gap-2.5" style={{ color: `${P.white}EE` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.cream} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6, ease }}
            className="rounded-2xl p-6"
            style={{ background: "#1E6B55" }}
          >
            <div className="text-[13px] font-bold mb-5" style={{ color: `${P.white}90` }}>What it never reveals</div>
            <ul className="flex flex-col gap-3">
              {["Which stocks are held", "Number of shares", "Total portfolio value", "Transaction history", "Wallet address"].map((t) => (
                <li key={t} className="text-[13px] flex items-center gap-2.5" style={{ color: `${P.white}99` }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={`${P.white}60`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center" style={{ borderTop: `1px solid ${P.white}10` }}>
        <span className="text-[13px]" style={{ color: `${P.white}60` }}>ETHGlobal Cannes 2026</span>
      </footer>
    </div>
  );
}
