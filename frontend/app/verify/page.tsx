"use client";

import { motion } from "framer-motion";
import Nav from "../landing/nav";

const P = {
  bg: "#D8D2C8",
  jade: "#38A88A",
  dark: "#2A2A2A",
  gray: "#6B6B6B",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Verify() {
  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark, cursor: "none" }}>
      <Nav />

      <div className="max-w-3xl mx-auto px-8 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-16"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ background: `${P.jade}20`, color: P.jade }}>
            Proof of Solvency
          </span>
          <h1 className="text-5xl font-bold mt-6 mb-4">Verify a portfolio.</h1>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: P.gray }}>
            A Radegast user generated a zero-knowledge proof that their portfolio exceeds a threshold. Verify it here — no account needed.
          </p>
        </motion.div>

        {/* VERIFY INPUT */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 py-4" style={{ borderTop: `1px solid ${P.gray}25`, borderBottom: `1px solid ${P.gray}25` }}>
            <input
              type="text"
              placeholder="Enter verification ID or scan QR code"
              className="flex-1 bg-transparent text-base font-medium outline-none placeholder-gray-400"
              style={{ color: P.dark }}
            />
            <button
              className="px-6 py-2.5 rounded-full text-[13px] font-semibold transition-opacity duration-200 hover:opacity-80"
              style={{ background: P.jade, color: "#FFFFFF", cursor: "none" }}
            >
              Verify
            </button>
          </div>
        </motion.div>

        {/* HOW IT WORKS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-16"
        >
          <h2 className="text-2xl font-bold mb-8">How verification works</h2>
          <div className="flex flex-col gap-8">
            {[
              { num: "1", title: "User generates a proof", desc: "Using Noir.js in the browser, the user creates a zero-knowledge proof that their xStock portfolio exceeds a dollar threshold. Nothing leaves their device." },
              { num: "2", title: "Proof is verified on-chain", desc: "The UltraVerifier smart contract on 0G Chain validates the mathematical proof. It stores the threshold, a commitment hash, and a timestamp." },
              { num: "3", title: "You check the result", desc: "Enter the verification ID above. You'll see \"Portfolio verified above $X\" — nothing else. No positions, no amounts, no transaction history." },
            ].map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease }}
                className="flex gap-6"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: `${P.jade}18`, color: P.jade }}>
                  {s.num}
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold mb-1">{s.title}</h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* WHAT IT REVEALS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="flex gap-12 py-8"
          style={{ borderTop: `1px solid ${P.gray}20` }}
        >
          <div className="flex-1">
            <div className="text-[13px] font-semibold mb-3" style={{ color: P.jade }}>What the proof confirms</div>
            <ul className="flex flex-col gap-2">
              {["Portfolio exceeds stated threshold", "Proof is mathematically valid", "Verified on-chain with timestamp"].map((t) => (
                <li key={t} className="text-[13px] flex items-center gap-2" style={{ color: P.gray }}>
                  <span style={{ color: P.jade }}>&#10003;</span> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-px" style={{ background: `${P.gray}20` }} />
          <div className="flex-1">
            <div className="text-[13px] font-semibold mb-3" style={{ color: "#B5506A" }}>What it never reveals</div>
            <ul className="flex flex-col gap-2">
              {["Which stocks are held", "Number of shares", "Total portfolio value", "Transaction history", "Wallet address"].map((t) => (
                <li key={t} className="text-[13px] flex items-center gap-2" style={{ color: P.gray }}>
                  <span style={{ color: "#B5506A" }}>&#10005;</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
