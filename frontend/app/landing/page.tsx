"use client";

import { motion } from "framer-motion";
import Nav from "./nav";

const P = {
  bg: "#D8D2C8",
  jade: "#38A88A",
  dark: "#2A2A2A",
  gray: "#6B6B6B",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const USE_CASES = [
  {
    num: "01",
    title: "Invest 24/7 from anywhere",
    desc: "Sign in with Google. Pick a strategy. Buy fractional US stocks as tokens from $1. No brokerage, no crypto knowledge.",
  },
  {
    num: "02",
    title: "AI portfolio advisor",
    desc: "3 AI models analyze your portfolio and vote. Advisory mode gives suggestions. Trade mode auto-executes. Every decision is on-chain.",
  },
  {
    num: "03",
    title: "ZK proof of solvency",
    desc: "Prove your portfolio exceeds $50K to any bank — without revealing holdings. Zero-knowledge proof verified on-chain. Just a QR code.",
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
        <div className="max-w-4xl mx-auto flex flex-col gap-24">
          {USE_CASES.map((uc, i) => (
            <motion.div
              key={uc.num}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.7, ease }}
              className="flex gap-8 items-start"
            >
              <span className="text-6xl font-bold leading-none" style={{ color: `${P.jade}25` }}>{uc.num}</span>
              <div>
                <h3 className="text-2xl font-bold mb-3">{uc.title}</h3>
                <p className="text-base leading-relaxed" style={{ color: P.gray }}>{uc.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 text-center">
        <span className="text-[13px]" style={{ color: P.gray }}>ETHGlobal Cannes 2026</span>
      </footer>
    </div>
  );
}
