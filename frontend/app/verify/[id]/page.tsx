"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "../../landing/nav";

const P = {
  jade: "#38A88A",
  dark: "#2A2A2A",
  white: "#FFFFFF",
  cream: "#D8D2C8",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function VerifyById() {
  const params = useParams();
  const id = params.id as string;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    // Auto-verify on mount — simulate on-chain lookup (replace with ProofOfSolvency.check())
    const timer = setTimeout(() => {
      if (id && id.startsWith("0x") && id.length >= 10) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [id]);

  return (
    <div className="min-h-screen" style={{ background: P.jade, fontFamily: "Sora, sans-serif", color: P.white }}>
      <Nav />

      {/* ═══ HERO ═══ */}
      <section className="flex flex-col items-center justify-center text-center px-5 md:px-8 pt-24 pb-8 md:pt-32 md:pb-12">
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
      </section>

      {/* ═══ ID + Result ═══ */}
      <section className="px-5 md:px-8 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto">
          {/* Verification ID display */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
            className="flex items-center gap-3 rounded-2xl px-6 py-4 mb-8"
            style={{ background: `${P.white}18`, border: `1px solid ${P.white}25` }}
          >
            <div className="flex-1 font-mono text-sm font-medium truncate" style={{ color: P.white }}>
              {id}
            </div>
            <div className="px-4 py-2 rounded-full text-[12px] font-bold shrink-0" style={{
              background: status === "loading" ? `${P.white}20` : status === "success" ? `${P.white}25` : `${P.white}15`,
              color: status === "loading" ? `${P.white}CC` : status === "success" ? P.cream : `${P.white}AA`,
            }}>
              {status === "loading" ? "Checking..." : status === "success" ? "Valid" : "Not found"}
            </div>
          </motion.div>

          {/* Result */}
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-16"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-full mb-4"
                  style={{ border: `2.5px solid ${P.white}30`, borderTopColor: P.white }}
                />
                <p className="text-[14px] font-medium" style={{ color: `${P.white}CC` }}>
                  Querying 0G Chain...
                </p>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                className="rounded-2xl p-8"
                style={{ background: `${P.white}15`, border: `1px solid ${P.white}20` }}
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
                    { label: "Verification ID", value: id.slice(0, 18) + "..." },
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

                <a href="/verify" className="text-[13px] font-bold px-5 py-2.5 rounded-full inline-block" style={{ background: `${P.white}20`, color: P.white }}>
                  Verify another proof
                </a>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease }}
                className="rounded-2xl p-8"
                style={{ background: `${P.white}12`, border: `1px solid ${P.white}15` }}
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
                      This verification ID doesn&apos;t match any proof on 0G Chain.
                    </p>
                  </div>
                </div>
                <a href="/verify" className="text-[13px] font-bold px-5 py-2.5 rounded-full inline-block" style={{ background: `${P.white}20`, color: P.white }}>
                  Try again
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center" style={{ borderTop: `1px solid ${P.white}10` }}>
        <span className="text-[13px]" style={{ color: `${P.white}60` }}>ETHGlobal Cannes 2026</span>
      </footer>
    </div>
  );
}
