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

const FLOW = [
  { step: "01", title: "You buy xStocks", desc: "xStocks are ERC-20 tokens backed 1:1 by real US equities. Each xStock (TSLAx, AAPLx, NVDAx...) represents an actual share held by a licensed custodian.", color: P.jade },
  { step: "02", title: "Real shares are purchased", desc: "When you buy $100 of TSLAx, $100 of real Tesla stock is purchased and held in custody by Backed/Kraken. The token is minted on-chain as proof.", color: "#4B0082" },
  { step: "03", title: "Tokens live in your wallet", desc: "xStocks sit in your embedded wallet as standard ERC-20 tokens. Radegast never holds your assets. You own them directly.", color: "#CC5A3A" },
  { step: "04", title: "Trade 24/7, fractional", desc: "Unlike traditional markets (9:30-4pm EST), xStocks trade around the clock. Buy $1 of NVIDIA at 3am on a Sunday. No minimums.", color: "#C8A415" },
  { step: "05", title: "Redeem anytime", desc: "Sell your xStocks back to USDC anytime. The underlying shares are sold and proceeds returned. No lock-up period.", color: "#B5506A" },
];

const STATS = [
  { value: "$25B+", label: "Total xStocks volume" },
  { value: "185K+", label: "Token holders" },
  { value: "1:1", label: "Backed by real shares" },
  { value: "9", label: "Available stocks" },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <Nav />

      <div className="max-w-4xl mx-auto px-8 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-20"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ background: `${P.jade}20`, color: P.jade }}>
            How it works
          </span>
          <h1 className="text-5xl font-bold mt-6 mb-4">Real stocks, real backing,<br />real ownership.</h1>
          <p className="text-lg max-w-2xl leading-relaxed" style={{ color: P.gray }}>
            xStocks are tokenized US equities backed 1:1 by actual shares held by licensed custodians. $25B+ in volume, 185K+ holders.
          </p>
        </motion.div>

        {/* STATS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease }}
          className="grid grid-cols-4 gap-6 mb-24"
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold mb-1">{s.value}</div>
              <div className="text-[12px]" style={{ color: P.gray }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* FLOW */}
        <div className="flex flex-col gap-16">
          {FLOW.map((f, i) => (
            <motion.div
              key={f.step}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.7, ease }}
              className="flex gap-8"
            >
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold" style={{ background: `${f.color}18`, color: f.color }}>
                  {f.step}
                </div>
                {i < FLOW.length - 1 && <div className="w-px flex-1 mt-3" style={{ background: `${P.gray}30` }} />}
              </div>
              <div className="pb-4">
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: P.gray }}>{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AVAILABLE STOCKS */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mt-24"
        >
          <h2 className="text-2xl font-bold mb-8">Available xStocks</h2>
          <div className="grid grid-cols-3 gap-4">
            {["TSLAx — Tesla", "NVDAx — NVIDIA", "AAPLx — Apple", "METAx — Meta", "AMZNx — Amazon", "GOOGx — Google", "SPYx — S&P 500", "NDXx — Nasdaq", "MSTRx — MicroStrategy"].map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5, ease }}
                className="py-3 px-4 rounded-lg text-[13px] font-medium"
                style={{ background: `${P.jade}10`, border: `1px solid ${P.jade}20` }}
              >
                {s}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
