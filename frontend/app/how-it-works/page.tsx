"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Nav from "../landing/nav";
import { P, ease, spring } from "../lib/theme";

/* ─── PIPELINE STEPS ─── */
const PIPELINE = [
  {
    num: "01",
    title: "Sign in with Google",
    desc: "One click. Dynamic SDK creates an embedded MPC wallet behind the scenes — split-key architecture, no single point of failure. No seed phrase, no browser extension, no crypto jargon. The user sees a stock investing app, period.",
    detail: "Dynamic handles social login, session management, and wallet lifecycle. The wallet is non-custodial from day one — Radegast never has access to user funds.",
    color: P.jade,
  },
  {
    num: "02",
    title: "Fund your äccount",
    desc: "Apple Pay, card, or bank transfer. Fiat converts to USDC via Coinbase Onramp — deposited directly into the embedded wallet. No KYC required up to $500. The user never sees the words \"USDC\", \"wallet\", or \"blockchain\".",
    detail: "This is where 5 billion smartphone users become potential investors. No brokerage account, no waiting days for approval, no minimum balance. From zero to invested in under 60 seconds.",
    color: P.indigo,
  },
  {
    num: "03",
    title: "Pick ä strätegy",
    desc: "Conservative, Balanced, Growth, or Aggressive. Each strategy maps to a target allocation across 9 xStocks covering US mega-caps and indices. The AI advisor continuously monitors drift and rebalances to keep you on target.",
    detail: "Strategies are not static templates — they adapt. The AI evaluates market conditions, correlation shifts, and volatility regimes to adjust weights within the bounds of your chosen risk profile.",
    color: P.terracotta,
  },
  {
    num: "04",
    title: "xStocks äre minted",
    desc: "USDC is swapped for xStocks (ERC-20 tokens backed 1:1 by real US equities) on 0G Chain via gasless transactions. Each token represents a fractional share held by a licensed custodian (Backed, Kraken). The tokens live in the user's wallet — Radegast never holds assets.",
    detail: "Fractional from $1. A student in Lagos can own 0.003 shares of NVIDIA. A teacher in Jakarta can build a diversified US portfolio from their phone. This was impossible before tokenization.",
    color: P.safran,
  },
  {
    num: "05",
    title: "AI wätches your portfolio",
    desc: "3 independent AI models on 0G Compute analyze your positions in real-time. XGBoost (37 statistical features — momentum, RSI, Bollinger, correlation matrices) + 2 LLMs (semantic analysis of news, earnings, macro sentiment) vote independently. Majority wins. Every decision is cryptographically settled on-chain and auditable via 0G DA.",
    detail: "No single AI controls your money. If one model is wrong, the other two override it. If 0G Compute goes down, inference falls back to ONNX WebAssembly in the browser. The system literally cannot crash.",
    color: P.roseAncien,
  },
  {
    num: "06",
    title: "Advisory or Träde mode",
    desc: "Advisory: AI sends you suggestions with full reasoning — \"TSLAx is 35% of your portfolio, target is 25%. NVIDIA earnings beat estimates. Consider reducing Tesla exposure and rotating into NVDAx.\" You learn, you decide. Trade: AI auto-executes — rebalances, takes profit, reduces exposure. Gasless via ZeroDev. You get a confirmation, that's it.",
    detail: "This is the spectrum from financial education to fully autonomous wealth management. Beginners start in Advisory and graduate to Trade as they build confidence. Power users go full autonomous from day one.",
    color: P.jade,
  },
  {
    num: "07",
    title: "Prove your weälth (ZK)",
    desc: "Generate a zero-knowledge proof that your portfolio exceeds any threshold — $50K, $100K, $500K. The proof runs entirely in your browser via Noir.js (WASM). Nothing leaves your device. The proof is verified by an UltraPlonk smart contract on 0G Chain and stored permanently on-chain.",
    detail: "Send a verifiable PDF with QR code to your bank, your landlord, or a lender. No screenshots, no trust needed, no intermediary. The math proves it. Even if Radegast disappears tomorrow, the on-chain proof remains valid forever.",
    color: P.indigo,
  },
];

/* ─── XSTOCKS ─── */
const XSTOCKS = [
  { ticker: "TSLAx", name: "Tesla", color: P.jade },
  { ticker: "NVDAx", name: "NVIDIA", color: P.indigo },
  { ticker: "AAPLx", name: "Apple", color: P.terracotta },
  { ticker: "METAx", name: "Meta", color: P.safran },
  { ticker: "AMZNx", name: "Amazon", color: P.roseAncien },
  { ticker: "GOOGx", name: "Google", color: P.jade },
  { ticker: "SPYx", name: "S&P 500", color: P.indigo },
  { ticker: "NDXx", name: "Nasdaq", color: P.terracotta },
  { ticker: "MSTRx", name: "MicroStrategy", color: P.safran },
];

function PipelineSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section className="mb-32">
      <div className="flex flex-col gap-4">
        {PIPELINE.map((step, i) => {
          const isOpen = openIdx === i;
          return (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, ease, delay: i * 0.05 }}
            >
              {/* Number — centered, clickable */}
              <motion.button
                onClick={() => setOpenIdx(isOpen ? null : i)}
                className="flex flex-col items-center cursor-pointer w-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
              >
                <motion.span
                  className="text-6xl md:text-[100px] font-bold leading-none select-none"
                  animate={{ color: isOpen ? step.color : `${step.color}30` }}
                  transition={{ duration: 0.4, ease }}
                >
                  {step.num}
                </motion.span>
                <motion.div
                  animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? -5 : 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="mt-1"
                >
                  <h3 className="text-lg md:text-xl font-bold text-center" style={{ color: P.dark }}>{step.title}</h3>
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
                    style={{ background: step.color }}
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease, delay: 0.15 }}
                      className="p-6 md:p-10 text-center"
                    >
                      <h3 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: "#FFFFFF" }}>{step.title}</h3>
                      <p className="text-[15px] leading-relaxed max-w-2xl mx-auto mb-6" style={{ color: "rgba(255,255,255,0.75)" }}>
                        {step.desc}
                      </p>
                      {step.detail && (
                        <motion.p
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease, delay: 0.25 }}
                          className="text-[14px] leading-relaxed max-w-2xl mx-auto py-4 px-5 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}
                        >
                          {step.detail}
                        </motion.p>
                      )}
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

export default function HowItWorks() {
  return (
    <div className="min-h-screen relative" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <div className="relative">
      <Nav />

      <div className="max-w-4xl mx-auto px-8 pt-32 pb-24">

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-20"
        >
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            How Rädegäst works
          </h1>
          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: P.gray }}>
            From Google login to zero-knowledge proof — the complete pipeline that lets anyone invest in US stocks from anywhere, 24/7, without ever touching crypto.
          </p>
        </motion.div>

        {/* ═══ MANIFESTO ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease }}
          className="mb-32 py-10 px-8 rounded-2xl"
          style={{ background: `${P.jade}08`, border: `1px solid ${P.jade}15` }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: P.jade }}>
            The problem we&apos;re solving
          </h2>
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            {[
              { stat: "5 billion", label: "people own a smartphone", color: P.jade },
              { stat: "< 300 million", label: "have access to US stock markets", color: P.roseAncien },
              { stat: "86%", label: "of the world has no brokerage account", color: P.indigo },
              { stat: "$0", label: "minimum to start investing with Rädegäst", color: P.jade },
            ].map((s) => (
              <div key={s.label} className="flex items-start gap-4">
                <div className="text-2xl font-bold shrink-0" style={{ color: s.color }}>{s.stat}</div>
                <div className="text-[14px] leading-relaxed pt-1" style={{ color: P.gray }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p className="text-[15px] leading-relaxed mt-8" style={{ color: P.gray }}>
            Traditional brokerages require a US bank account, social security number, and days of KYC verification. They close at 4 PM. They don&apos;t serve 190+ countries. <strong style={{ color: P.dark }}>Rädegäst replaces the entire brokerage with a Google login, an embedded wallet, and three AI models.</strong> The märkets äre now open to everyone.
          </p>
        </motion.section>

        {/* ═══ PIPELINE ═══ */}
        <PipelineSection />

        {/* ═══ WHAT ARE xSTOCKS ═══ */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Whät äre xStocks?</h2>
            <p className="text-[15px] leading-relaxed mb-4" style={{ color: P.gray }}>
              xStocks are <strong style={{ color: P.dark }}>tokenized US equities</strong> — ERC-20 tokens on Ethereum, each backed 1:1 by an actual share held in custody by licensed institutions (Backed, Kraken). They&apos;ve been live on mainnet since September 2025.
            </p>
            <p className="text-[15px] leading-relaxed mb-6" style={{ color: P.gray }}>
              This means a fractional share of Tesla or NVIDIA can be sent like a text message, traded 24/7 including weekends, and settled in seconds instead of T+2 days. <strong style={{ color: P.dark }}>The stock market, unchained from Wall Street hours.</strong>
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="grid grid-cols-4 gap-8 mb-12"
          >
            {[
              { val: "$25B+", label: "Total volume" },
              { val: "185K+", label: "Holders worldwide" },
              { val: "1:1", label: "Backed by real shares" },
              { val: "24/7", label: "Trading, no limits" },
            ].map((s) => (
              <div key={s.label}>
                <div className="w-8 h-[3px] rounded-full mb-3" style={{ background: P.jade }} />
                <div className="text-2xl font-bold mb-1">{s.val}</div>
                <div className="text-[12px]" style={{ color: P.gray }}>{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* How buy/sell works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="grid grid-cols-3 gap-6 mb-12"
          >
            {[
              { label: "Buy", flow: "USDC \u2192 DEX swap \u2192 xStocks in your wallet", color: P.gain },
              { label: "Sell", flow: "xStocks \u2192 swap \u2192 USDC back to you", color: P.roseAncien },
              { label: "Rebalance", flow: "AI detects drift \u2192 auto-adjusts positions", color: P.jade },
            ].map((item) => (
              <div key={item.label} className="py-4 px-5 rounded-xl" style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
                <div className="text-[13px] font-semibold mb-2" style={{ color: item.color }}>{item.label}</div>
                <div className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{item.flow}</div>
              </div>
            ))}
          </motion.div>

          {/* Available xStocks grid */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
          >
            <h3 className="text-lg font-semibold mb-4">Available xStocks</h3>
            <div className="grid grid-cols-3 gap-3">
              {XSTOCKS.map((s, i) => (
                <motion.div
                  key={s.ticker}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04, duration: 0.5, ease }}
                  className="py-3 px-4 rounded-lg flex items-center gap-3"
                  style={{ background: `${s.color}08`, border: `1px solid ${s.color}15` }}
                >
                  <span className="text-[13px] font-bold" style={{ color: s.color }}>{s.ticker}</span>
                  <span className="text-[13px]" style={{ color: P.gray }}>{s.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* ═══ AI CONSENSUS ═══ */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold mb-4">AI consensus — 3 models, 1 decision</h2>
            <p className="text-[15px] leading-relaxed mb-4" style={{ color: P.gray }}>
              No single AI controls your money. Three independent providers on 0G Compute analyze your portfolio and vote. Majority wins. If 0G goes down, inference falls back to WebAssembly in the browser. <strong style={{ color: P.dark }}>The system literally cannot crash.</strong>
            </p>
            <p className="text-[15px] leading-relaxed" style={{ color: P.gray }}>
              Every AI decision — buy, sell, hold, rebalance — is recorded as a verifiable blob on 0G DA. Full audit trail. No black box. You can replay every decision the AI ever made and verify its reasoning on-chain.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="grid grid-cols-3 gap-6 mb-10"
          >
            {[
              { name: "XGBoost (ONNX)", desc: "Statistical patterns — technical indicators, momentum, correlation matrices across 37 features.", color: P.jade },
              { name: "LLM A", desc: "Semantic understanding — market news, earnings, macro sentiment. Contextual reasoning.", color: P.indigo },
              { name: "LLM B", desc: "Second opinion — independent analysis to avoid single-model bias. Different architecture.", color: P.terracotta },
            ].map((m) => (
              <div key={m.name} className="py-5 px-5 rounded-xl" style={{ background: `${m.color}08`, border: `1px solid ${m.color}15` }}>
                <div className="text-[14px] font-semibold mb-2">{m.name}</div>
                <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{m.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Two modes */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="py-6 px-6 rounded-xl" style={{ border: `1px solid ${P.jade}25` }}>
              <div className="text-[14px] font-bold mb-1" style={{ color: P.jade }}>Advisory mode</div>
              <div className="text-[12px] font-medium mb-3" style={{ color: P.gray }}>For beginners</div>
              <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>
                AI analyzes and sends suggestions. &ldquo;TSLAx is 35% of your portfolio, target is 25% — consider reducing exposure.&rdquo; You learn, you decide.
              </p>
            </div>
            <div className="py-6 px-6 rounded-xl" style={{ border: `1px solid ${P.indigo}25` }}>
              <div className="text-[14px] font-bold mb-1" style={{ color: P.indigo }}>Trade mode</div>
              <div className="text-[12px] font-medium mb-3" style={{ color: P.gray }}>Fully autonomous</div>
              <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>
                AI analyzes and executes. Auto-sells 10% TSLAx, buys NVDAx. Gasless transactions via ZeroDev. You get a confirmation — that&apos;s it.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ═══ ZK PROOF OF SOLVENCY ═══ */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold mb-4">Zero-knowledge proof of solvency</h2>
            <p className="text-[15px] leading-relaxed mb-4" style={{ color: P.gray }}>
              Crypto-backed mortgages are not hypothetical — they exist today. Fannie Mae started accepting them in March 2026. But proving your holdings means screenshots, CSV exports, and exchange statements that are <strong style={{ color: P.dark }}>trivially forgeable</strong>. Banks know it. Some require 60-120 day &ldquo;seasoning&rdquo; periods just to trust the data.
            </p>
            <p className="text-[15px] leading-relaxed mb-4" style={{ color: P.gray }}>
              Rädegäst replaces trust with mäth. A zero-knowledge proof is <strong style={{ color: P.dark }}>mathematically verifiable</strong> — the proof is valid regardless of who generated it. Even if Radegast disappears, the on-chain proof remains forever.
            </p>
            <p className="text-[15px] leading-relaxed" style={{ color: P.gray }}>
              This is not incremental improvement. This is a <strong style={{ color: P.jade }}>paradigm shift</strong> — from &ldquo;trust me, here&apos;s a screenshot&rdquo; to &ldquo;verify it yourself, here&apos;s the math.&rdquo;
            </p>
          </motion.div>

          {/* Real lenders accepting crypto */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-12"
          >
            <h3 className="text-lg font-semibold mb-5">Who already accepts crypto for lending?</h3>
            <div className="flex flex-col gap-4">
              {[
                {
                  name: "Fannie Mae + Coinbase + Better",
                  detail: "Since March 26, 2026 — Fannie Mae accepts crypto-backed mortgage applications via Coinbase custody and Better Home & Finance. The largest US mortgage backer now recognizes digital assets.",
                  tag: "Mortgage",
                  color: P.jade,
                },
                {
                  name: "Milo",
                  detail: "Miami-based. 30-year fixed crypto mortgages — use BTC/ETH as collateral, up to 100% LTV. No need to sell your crypto. Loans from $100K+.",
                  tag: "Mortgage",
                  color: P.indigo,
                },
                {
                  name: "Figure Technologies",
                  detail: "Founded by ex-SoFi CEO. Blockchain-native HELOCs (home equity lines of credit) from $15K to $400K. Uses Provenance blockchain for origination.",
                  tag: "HELOC",
                  color: P.terracotta,
                },
                {
                  name: "Griffin Funding",
                  detail: "San Diego. Underwrites mortgages based on crypto wealth — accepts digital asset statements for qualification when traditional income docs fail.",
                  tag: "Mortgage",
                  color: P.safran,
                },
                {
                  name: "Unchained Capital",
                  detail: "Austin. BTC-collateralized loans with multisig custody — the borrower holds a key. LTV 40-60%. No credit check needed.",
                  tag: "Crypto loan",
                  color: P.roseAncien,
                },
                {
                  name: "SALT Lending",
                  detail: "Crypto-backed personal and business loans from $5K to $25M+. LTV 30-70% depending on asset. Operating since 2016.",
                  tag: "Crypto loan",
                  color: P.jade,
                },
                {
                  name: "Ledn",
                  detail: "Canadian lender. BTC-backed USD loans at ~50% LTV. Also offers B2X: borrow against BTC to buy more BTC with doubled exposure.",
                  tag: "Crypto loan",
                  color: P.indigo,
                },
                {
                  name: "Nexo",
                  detail: "Instant crypto credit lines up to $2M, LTV up to 50% for BTC/ETH. European-based, serving global clients.",
                  tag: "Credit line",
                  color: P.terracotta,
                },
              ].map((lender, i) => (
                <motion.div
                  key={lender.name}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease }}
                  className="flex items-start gap-4 py-4 px-5 rounded-xl"
                  style={{ background: `${lender.color}06`, border: `1px solid ${lender.color}12` }}
                >
                  <div className="shrink-0">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${lender.color}15`, color: lender.color }}>
                      {lender.tag}
                    </span>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold mb-1">{lender.name}</div>
                    <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{lender.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-[14px] leading-relaxed mt-6 py-4 px-5 rounded-xl"
              style={{ color: P.dark, background: `${P.jade}08`, border: `1px solid ${P.jade}15` }}
            >
              <strong>The problem they all share:</strong> every lender requires full disclosure of your holdings — wallet addresses, balances, transaction history. Radegast&apos;s ZK proof lets you prove &ldquo;I have more than $50K&rdquo; without revealing a single position.
            </motion.p>
          </motion.div>

          {/* How ZK works — steps */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-10"
          >
            <h3 className="text-lg font-semibold mb-6">How it works</h3>
            <div className="flex flex-col gap-6">
              {[
                { step: "1", text: "User clicks \"Prove my assets\"" },
                { step: "2", text: "Noir.js runs in the browser (WASM) — nothing leaves the device. Private inputs: balances, prices, secret. Public input: threshold ($50,000)." },
                { step: "3", text: "Circuit asserts: sum of (balance \u00d7 price) > threshold. A Poseidon commitment locks the data." },
                { step: "4", text: "ZK proof generated in ~10 seconds, entirely client-side." },
                { step: "5", text: "UltraVerifier smart contract on 0G Chain verifies the proof. Stores: threshold, commitment, timestamp, verifyId." },
                { step: "6", text: "Anyone can check: radegast.app/verify/{id} — \"Portfolio verified above $50,000\". Downloadable PDF with QR code." },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 items-start">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: `${P.jade}15`, color: P.jade }}>
                    {s.step}
                  </div>
                  <p className="text-[14px] leading-relaxed pt-0.5" style={{ color: P.gray }}>{s.text}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* What it proves / hides */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="grid grid-cols-2 gap-6 mb-10"
          >
            <div className="py-5 px-5 rounded-xl" style={{ background: `${P.jade}08`, border: `1px solid ${P.jade}20` }}>
              <div className="text-[14px] font-semibold mb-3" style={{ color: P.jade }}>What the proof reveals</div>
              <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>
                &ldquo;This wallet is worth more than $50,000.&rdquo;<br />
                Nothing else. The verifier sees a boolean: pass or fail.
              </p>
            </div>
            <div className="py-5 px-5 rounded-xl" style={{ background: `${P.roseAncien}08`, border: `1px solid ${P.roseAncien}20` }}>
              <div className="text-[14px] font-semibold mb-3" style={{ color: P.roseAncien }}>What stays private</div>
              <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>
                Which stocks you hold, how many shares, your total portfolio value, your transaction history. All private inputs never leave the browser.
              </p>
            </div>
          </motion.div>

          {/* Why it matters */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="py-6 px-6 rounded-xl" style={{ border: `1px solid ${P.gray}20` }}
          >
            <h3 className="text-[15px] font-semibold mb-3">Why ZK and not a signed attestation?</h3>
            <p className="text-[14px] leading-relaxed" style={{ color: P.gray }}>
              A signed attestation requires trusting the signer — if Radegast signs &ldquo;this user has $80K&rdquo;, the bank must trust Radegast. A ZK proof is <strong style={{ color: P.dark }}>trustless</strong>: the math proves it. No intermediary, no trust assumption, no single point of failure. The proof lives on-chain forever, verifiable by anyone, anytime.
            </p>
          </motion.div>
        </section>

        {/* ═══ THE STACK — 0G full stack ═══ */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold mb-4">Built on 0G — full stäck</h2>
            <p className="text-[15px] leading-relaxed" style={{ color: P.gray }}>
              Radegast is one of the few projects using <strong style={{ color: P.dark }}>all 4 layers</strong> of the 0G stack. Compute, Storage, Chain, and DA — every component is decentralized, verifiable, and auditable. No centralized backend, no single point of failure.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="flex flex-col gap-4"
          >
            {[
              { layer: "Compute", desc: "3 AI providers + XGBoost ONNX model registered as a public service on 0G Compute Network. Earns compute fees per inference. Decentralized AI at scale.", color: P.jade },
              { layer: "Storage", desc: "ONNX model weights stored with cryptographic provenance (root_hash). Tamper-proof model integrity — if anyone modifies the model, the hash breaks.", color: P.indigo },
              { layer: "Chain", desc: "Smart contract settlement: xStocks ERC-20 minting/burning, ZK proof verification (UltraVerifier), portfolio state, gasless meta-transactions.", color: P.terracotta },
              { layer: "DA", desc: "Every AI decision = a verifiable data availability blob. Full audit trail of every buy, sell, rebalance, and reasoning. Permanent, immutable, queryable.", color: P.safran },
            ].map((l) => (
              <div key={l.layer} className="flex items-start gap-4 py-4 px-5 rounded-xl" style={{ background: `${l.color}06`, border: `1px solid ${l.color}12` }}>
                <span className="text-[14px] font-bold w-20 shrink-0" style={{ color: l.color }}>{l.layer}</span>
                <p className="text-[14px] leading-relaxed" style={{ color: P.gray }}>{l.desc}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ═══ DYNAMIC SDK ═══ */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold mb-4">Dynämic — the invisible wället</h2>
            <p className="text-[15px] leading-relaxed" style={{ color: P.gray }}>
              Dynamic SDK is the glue that makes all of this feel like a normal fintech app. The user never knows they have a crypto wallet. They never sign a transaction. They never pay gas. <strong style={{ color: P.dark }}>They just invest.</strong>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="grid grid-cols-2 gap-4"
          >
            {[
              { feature: "Social login", desc: "Google, Apple, email — one click to onboard. Embedded MPC wallet created silently.", color: P.jade },
              { feature: "Fiat onramp", desc: "Coinbase integration. Apple Pay, card, bank transfer. USDC deposited directly. No KYC under $500.", color: P.indigo },
              { feature: "Gasless transactions", desc: "ZeroDev paymaster sponsors all gas. The user never pays a wei. Every trade feels like tapping a button.", color: P.terracotta },
              { feature: "Session management", desc: "JWT-based persistent auth. Come back tomorrow, you're still logged in. Just like any banking app.", color: P.safran },
              { feature: "Event system", desc: "onAuthSuccess, onWalletAdded, onEmbeddedWalletCreated — full lifecycle hooks for seamless UX flows.", color: P.roseAncien },
              { feature: "Non-custodial", desc: "Dynamic never holds keys. Radegast never holds keys. The user owns their assets from day one. Always.", color: P.jade },
            ].map((f) => (
              <div key={f.feature} className="py-4 px-5 rounded-xl" style={{ background: `${f.color}06`, border: `1px solid ${f.color}12` }}>
                <div className="text-[13px] font-bold mb-1" style={{ color: f.color }}>{f.feature}</div>
                <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{f.desc}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ═══ CLOSING ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease }}
          className="mb-32 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">
            The future of investing is <span style={{ color: P.jade }}>borderless</span>
          </h2>
          <p className="text-[15px] leading-relaxed max-w-2xl mx-auto mb-2" style={{ color: P.gray }}>
            A student in Lagos buying fractional NVIDIA. A freelancer in Bangkok proving solvency to a bank with math, not screenshots. A retiree in Paris letting 3 AI models manage their portfolio while they sleep.
          </p>
          <p className="text-[15px] leading-relaxed max-w-2xl mx-auto" style={{ color: P.gray }}>
            <strong style={{ color: P.dark }}>This is not a crypto project pretending to be finance. This is finance, rebuilt from first principles — on-chain, AI-native, zero-knowledge, and open to everyone.</strong>
          </p>
        </motion.section>

        {/* ═══ FOOTER ═══ */}
        <footer className="pt-8 text-center" style={{ borderTop: `1px solid ${P.gray}15` }}>
          <span className="text-[13px]" style={{ color: P.gray }}>ETHGlobal Cannes 2026</span>
        </footer>
      </div>
      </div>
    </div>
  );
}
