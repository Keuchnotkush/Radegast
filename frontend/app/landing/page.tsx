"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import GhostCursor from "./ghost-cursor";

const P = {
  bg: "#D8D2C8",
  jade: "#38A88A",
  jadeDark: "#45BA9A",
  indigo: "#4B0082",
  terracotta: "#CC5A3A",
  safran: "#C8A415",
  roseAncien: "#B5506A",
  dark: "#2A2A2A",
  gray: "#6B6B6B",
  white: "#FFFFFF",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STRATEGIES = [
  { name: "Conservative", emoji: "🛡️", desc: "60% S&P 500 + 25% Nasdaq + 15% stablecoin", color: P.jade },
  { name: "Balanced", emoji: "⚖️", desc: "Mix indices + individual picks", color: P.indigo },
  { name: "Growth", emoji: "🚀", desc: "NVDA 30% + TSLA 25% + AAPL 20% + META 15%", color: P.terracotta },
  { name: "Aggressive", emoji: "🔥", desc: "TSLA 35% + MSTR 25% + NVDA 20% + rotations", color: P.roseAncien },
];

const STEPS = [
  { num: "01", title: "Sign in with Google", desc: "One click. No seed phrases. No wallet setup." },
  { num: "02", title: "Pick your strategy", desc: "Conservative to aggressive. AI manages the rest." },
  { num: "03", title: "Invest from $1", desc: "Buy fractional US stocks. 24/7. From anywhere." },
  { num: "04", title: "Prove your wealth", desc: "Zero-knowledge proof for banks. No screenshots." },
];

export default function Landing() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark, cursor: "none" }}>
      <GhostCursor />

      {/* NAV */}
      {/* LOGO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="fixed top-6 left-8 z-40"
      >
        <img src="/logo.svg" alt="Radegast" style={{ height: 22, cursor: "none" }} />
      </motion.div>

      {/* NAV */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="fixed top-4 right-8 z-40 flex items-center gap-6 px-6 py-3 rounded-full"
        style={{ background: P.white, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <a href="#home" className="text-[13px] font-medium transition hover:opacity-70" style={{ color: P.dark, cursor: "none" }}>Home</a>
        <a href="#how-it-works" className="text-[13px] font-medium transition hover:opacity-70" style={{ color: P.dark, cursor: "none" }}>How it works</a>
        <a href="#verify" className="text-[13px] font-medium transition hover:opacity-70" style={{ color: P.dark, cursor: "none" }}>Verify</a>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-5 py-2 rounded-full text-[12px] font-semibold uppercase tracking-wider"
          style={{ background: P.dark, color: P.white, cursor: "none" }}
        >
          Get Started
        </motion.button>
      </motion.nav>

      {/* HERO */}
      <section id="home" ref={heroRef} className="min-h-screen flex flex-col items-center justify-center text-center px-8 pt-20 relative">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease }}
            className="mb-6"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] px-4 py-2 rounded-full" style={{ background: `${P.jade}20`, color: P.jade }}>
              Invest in US stocks from anywhere
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease }}
            className="text-6xl font-bold leading-tight max-w-3xl mb-6"
          >
            Your stocks.{" "}
            <span style={{ color: P.jade }}>Your wallet.</span>{" "}
            Your rules.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease }}
            className="text-lg max-w-xl mb-10 leading-relaxed"
            style={{ color: P.gray }}
          >
            Buy Tesla, NVIDIA, Apple as tokens. AI watches your portfolio.
            Prove your wealth to any bank — zero knowledge, zero trust needed.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease }}
            className="flex gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3.5 rounded-xl text-[15px] font-semibold"
              style={{ background: P.jade, color: P.white, cursor: "none" }}
            >
              Start Investing
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3.5 rounded-xl text-[15px] font-semibold"
              style={{ background: "transparent", color: P.dark, border: `1.5px solid ${P.dark}30`, cursor: "none" }}
            >
              Watch Demo
            </motion.button>
          </motion.div>

          {/* STATS */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease }}
            className="flex gap-16 mt-16"
          >
            <div className="text-center">
              <div className="text-3xl font-bold">$25B+</div>
              <div className="text-[12px] mt-1" style={{ color: P.gray }}>xStocks volume</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">185K+</div>
              <div className="text-[12px] mt-1" style={{ color: P.gray }}>holders worldwide</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-[12px] mt-1" style={{ color: P.gray }}>trading, no limits</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: `1.5px solid ${P.gray}50` }}
          >
            <div className="w-1 h-2 rounded-full" style={{ background: P.jade }} />
          </motion.div>
        </motion.div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="text-4xl font-bold text-center mb-4"
          >
            How it works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7, ease }}
            className="text-center mb-16 text-base"
            style={{ color: P.gray }}
          >
            From sign-in to proof of solvency — in minutes.
          </motion.p>

          <div className="grid grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease }}
                className="flex flex-col"
              >
                <span className="text-5xl font-bold mb-4" style={{ color: `${P.jade}30` }}>{s.num}</span>
                <h3 className="text-[15px] font-semibold mb-2">{s.title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STRATEGIES */}
      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="text-4xl font-bold text-center mb-4"
          >
            Pick your strategy
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15, duration: 0.7, ease }}
            className="text-center mb-16 text-base"
            style={{ color: P.gray }}
          >
            From safe to bold. AI rebalances for you.
          </motion.p>

          <div className="grid grid-cols-4 gap-5">
            {STRATEGIES.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="p-6 rounded-2xl flex flex-col gap-3"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}30`, cursor: "none" }}
              >
                <span className="text-3xl">{s.emoji}</span>
                <h3 className="text-[15px] font-semibold">{s.name}</h3>
                <p className="text-[12px] leading-relaxed" style={{ color: P.gray }}>{s.desc}</p>
                <div className="w-full h-1 rounded-full mt-2" style={{ background: `${s.color}25` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${40 + i * 20}%` }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                    viewport={{ once: true }}
                    className="h-full rounded-full"
                    style={{ background: s.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ZK VERIFY */}
      <section id="verify" className="py-32 px-8">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: `${P.jade}15` }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="text-4xl font-bold mb-4"
          >
            Prove it to your bank
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7, ease }}
            className="text-base leading-relaxed mb-10"
            style={{ color: P.gray }}
          >
            Generate a zero-knowledge proof that your portfolio exceeds $50,000 — without revealing which stocks you hold, how many, or your total value. Your bank scans a QR code and sees &ldquo;verified&rdquo;. Nothing else.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease }}
            className="flex justify-center gap-12"
          >
            <div>
              <div className="text-[13px] font-semibold mb-1" style={{ color: P.jade }}>What the proof says</div>
              <div className="text-[13px]" style={{ color: P.gray }}>&ldquo;Portfolio worth more than $50,000&rdquo;</div>
            </div>
            <div className="w-px" style={{ background: P.gray + "30" }} />
            <div>
              <div className="text-[13px] font-semibold mb-1" style={{ color: P.roseAncien }}>What it hides</div>
              <div className="text-[13px]" style={{ color: P.gray }}>Positions, amounts, total value, history</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-4xl font-bold mb-4">Start investing today</h2>
          <p className="text-base mb-8" style={{ color: P.gray }}>No brokerage. No crypto knowledge. Just stocks.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 rounded-xl text-base font-semibold"
            style={{ background: P.jade, color: P.white, cursor: "none" }}
          >
            Sign in with Google
          </motion.button>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-8 text-center" style={{ borderTop: `1px solid ${P.gray}20` }}>
        <img src="/logo.svg" alt="Radegast" style={{ height: 16, display: "inline" }} />
        <span className="text-[12px] ml-3" style={{ color: P.gray }}>ETHGlobal Cannes 2026</span>
      </footer>
    </div>
  );
}
