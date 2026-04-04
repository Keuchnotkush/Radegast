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

const STEPS: { num: string; title: string; bg: string; desc: string; detail: string; confirms?: string[]; hides?: string[] }[] = [
  {
    num: "1", title: "Pick a threshold", bg: "#2A2A2A",
    desc: "Choose the amount you want to prove — $10K, $50K, $100K.",
    detail: "The threshold is the only public input. It tells the circuit what to prove: that your total portfolio value exceeds this number. You never reveal the actual value.",
  },
  {
    num: "2", title: "ZK proof runs locally", bg: "#4B0082",
    desc: "Noir.js generates a proof in your browser. Nothing leaves your device.",
    detail: "The Noir circuit takes your private inputs (balances, prices, a secret nonce), computes the total value, asserts it exceeds the threshold, and produces an UltraPlonk proof — all in WASM, entirely client-side.",
  },
  {
    num: "3", title: "Verified on-chain", bg: "#CC5A3A",
    desc: "UltraVerifier on 0G Chain validates the proof and stores the attestation.",
    detail: "The proof is sent to the ProofOfSolvency smart contract. It calls the UltraVerifier with a staticcall. If valid, it stores an attestation: threshold, Poseidon commitment, timestamp, and a unique verifyId.",
    confirms: ["Portfolio exceeds stated threshold", "Proof is mathematically valid", "Verified on-chain with timestamp"],
  },
  {
    num: "4", title: "Get your ID", bg: "#B5506A",
    desc: "A unique verification ID is generated. Share it, print it, embed it.",
    detail: "The verifyId is a keccak256 hash of your address, threshold, commitment, and block number. It's embedded in a PDF certificate with a QR code pointing to radegast.app/verify/{id}.",
  },
  {
    num: "5", title: "Anyone can check", bg: "#C8A415",
    desc: "Paste the ID here. They see the result — nothing else.",
    detail: "The verifier calls ProofOfSolvency.check(verifyId) on-chain. They get back: threshold, timestamp, and validity. No holdings, no wallet address, no transaction history. Pure zero-knowledge.",
    hides: ["Which stocks are held", "Number of shares", "Total portfolio value", "Transaction history", "Wallet address"],
  },
];

export default function Verify() {
  const [hash, setHash] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [threshold, setThreshold] = useState("");
  const [verifiedAt, setVerifiedAt] = useState("");

  async function handleVerify() {
    if (!hash.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/proof/${encodeURIComponent(hash.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setThreshold(data.threshold || "Unknown");
        setVerifiedAt(data.verifiedAt || "");
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  function reset() {
    setHash("");
    setStatus("idle");
    setThreshold("");
    setVerifiedAt("");
  }

  return (
    <div className="min-h-screen relative overflow-hidden transition-colors duration-700" style={{ background: P.cream, fontFamily: "Sora, sans-serif", color: status === "loading" ? P.dark : P.white }}>
      {/* ═══ Jade overlay — reveals on load, retracts on verify ═══ */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{ background: P.jade }}
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{ clipPath: status === "loading" ? "circle(0% at 50% 50%)" : "circle(150% at 50% 50%)" }}
        transition={{ duration: status === "loading" ? 0.8 : 1.4, ease }}
      />

      {/* All content above the overlay */}
      <div className="relative z-10">
      <Nav />

      {/* ═══ HERO — giant "Verify" with floating i dot ═══ */}
      <section className="flex flex-col items-center justify-center text-center px-5 md:px-8 pt-24 pb-12 md:pt-32 md:pb-16">
        <motion.div
          className="w-full max-w-[900px] relative select-none text-center text-[18vw] md:text-[140px] font-bold leading-none transition-colors duration-700"
          style={{ color: status === "loading" ? P.jade : P.white }}
          initial={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
          animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
          transition={{ duration: 1.8, ease, delay: 0.2 }}
        >
          Verify
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7, ease }}
          className="text-base md:text-lg mt-6 max-w-xl leading-relaxed transition-colors duration-700"
          style={{ color: status === "loading" ? `${P.dark}AA` : `${P.white}CC` }}
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
                  className="flex items-center gap-3 rounded-2xl px-6 py-4 transition-colors duration-700"
                  style={{ background: status === "loading" ? `${P.dark}10` : `${P.white}18`, backdropFilter: "blur(10px)", border: `1px solid ${status === "loading" ? `${P.dark}20` : `${P.white}25`}` }}
                >
                  <input
                    type="text"
                    value={hash}
                    onChange={(e) => setHash(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    placeholder="0x6CA0f3b2..."
                    className="flex-1 bg-transparent text-base font-medium outline-none transition-colors duration-700"
                    style={{ color: status === "loading" ? P.dark : P.white }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleVerify}
                    className="get-started-btn px-7 py-2.5 rounded-full text-[13px] font-bold uppercase tracking-wider cursor-pointer flex items-center gap-2 shrink-0 text-white"
                    style={{ opacity: hash.trim() ? 1 : 0.5 }}
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
                      Exceeds <span style={{ color: P.cream }}>{threshold}</span>
                    </p>
                    <p className="text-[13px]" style={{ color: `${P.white}AA` }}>
                      Verified on 0G Chain &middot; {verifiedAt ? new Date(verifiedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"} &middot; Mathematically valid
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-8 py-5 mb-4" style={{ borderTop: `1px solid ${P.white}15`, borderBottom: `1px solid ${P.white}15` }}>
                  {[
                    { label: "Verification ID", value: hash.slice(0, 18) + "..." },
                    { label: "Threshold", value: threshold },
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

      {/* ═══ HOW IT WORKS — 5 distinct colored blocks ═══ */}
      <section className="px-5 md:px-8 pb-20 md:pb-32">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="text-2xl font-bold mb-10 text-center transition-colors duration-700"
            style={{ color: status === "loading" ? P.jade : P.white }}
          >
            How it works
          </motion.h2>

          <div className="flex flex-col gap-3">
            {STEPS.map((s, i) => {
              const isOpen = hoveredStep === i;
              return (
                <motion.div
                  key={s.num}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.5, ease }}
                  onMouseEnter={() => setHoveredStep(i)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="rounded-2xl cursor-default overflow-hidden"
                  style={{ background: s.bg }}
                  animate={{
                    scale: hoveredStep !== null && !isOpen ? 0.98 : 1,
                    opacity: hoveredStep !== null && !isOpen ? 0.6 : 1,
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                        style={{ background: `${P.white}20`, color: P.white }}
                      >
                        {s.num}
                      </div>
                      <h3 className="text-[15px] font-bold flex-1" style={{ color: P.white }}>{s.title}</h3>
                      <motion.svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={`${P.white}80`}
                        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </motion.svg>
                    </div>
                    <p className="text-[13px] leading-relaxed" style={{ color: `${P.white}BB` }}>{s.desc}</p>
                  </div>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5">
                          <div className="pt-3 mb-3" style={{ borderTop: `1px solid ${P.white}20` }} />
                          <p className="text-[13px] leading-relaxed" style={{ color: `${P.white}DD` }}>
                            {s.detail}
                          </p>
                          {s.confirms && (
                            <ul className="flex flex-col gap-2.5 mt-4">
                              {s.confirms.map((t) => (
                                <li key={t} className="text-[13px] flex items-center gap-2.5" style={{ color: `${P.white}EE` }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.cream} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          )}
                          {s.hides && (
                            <ul className="flex flex-col gap-2.5 mt-4">
                              {s.hides.map((t) => (
                                <li key={t} className="text-[13px] flex items-center gap-2.5" style={{ color: `${P.white}99` }}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={`${P.white}60`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                  {t}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center" style={{ borderTop: `1px solid ${P.white}10` }}>
        <span className="text-[13px]" style={{ color: `${P.white}60` }}>ETHGlobal Cannes 2026</span>
      </footer>
      </div>
    </div>
  );
}
