"use client";

import { motion } from "framer-motion";
import Nav from "../landing/nav";

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

/* ─── PIPELINE STEPS ─── */
const PIPELINE = [
  {
    num: "01",
    title: "Sign in with Google",
    desc: "One click. Dynamic SDK creates an embedded wallet behind the scenes. No seed phrase, no extension, no crypto jargon. The user sees a stock investing app.",
    color: P.jade,
  },
  {
    num: "02",
    title: "Fund your account",
    desc: "Apple Pay, card, or bank transfer. Fiat is converted to USDC via Coinbase onramp — directly into the embedded wallet. No KYC up to $500. The user never sees \"USDC\" or \"wallet\".",
    color: P.indigo,
  },
  {
    num: "03",
    title: "Pick a strategy",
    desc: "Conservative, Balanced, Growth, or Aggressive. Each strategy defines a target allocation across xStocks. The AI advisor monitors drift and rebalances.",
    color: P.terracotta,
  },
  {
    num: "04",
    title: "xStocks are minted",
    desc: "USDC is swapped for xStocks (ERC-20 tokens) on 0G Chain. Each token is backed 1:1 by a real US equity held by a licensed custodian. The tokens live in the user's wallet — Radegast never holds assets.",
    color: P.safran,
  },
  {
    num: "05",
    title: "AI watches your portfolio",
    desc: "3 independent AI models on 0G Compute analyze positions in real-time. XGBoost (statistical patterns) + 2 LLMs (semantic understanding) vote. Majority wins. Every decision is settled on-chain and auditable on 0G DA.",
    color: P.roseAncien,
  },
  {
    num: "06",
    title: "Advisory or Trade mode",
    desc: "Advisory: AI sends suggestions, you decide. Trade: AI auto-executes — rebalances, takes profit, reduces exposure. You choose your level of autonomy.",
    color: P.jade,
  },
  {
    num: "07",
    title: "Prove your wealth (ZK)",
    desc: "Generate a zero-knowledge proof that your portfolio exceeds a threshold. Verified on-chain. Send a PDF with QR code to your bank. No screenshots, no trust needed.",
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

export default function HowItWorks() {
  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <Nav />

      <div className="max-w-4xl mx-auto px-8 pt-32 pb-24">

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-32"
        >
          <h1 className="text-5xl font-bold mb-6">How Radegast works</h1>
          <p className="text-lg leading-relaxed max-w-2xl" style={{ color: P.gray }}>
            From Google login to zero-knowledge proof — the complete pipeline that lets anyone invest in US stocks from anywhere, 24/7, without ever touching crypto.
          </p>
        </motion.div>

        {/* ═══ PIPELINE ═══ */}
        <section className="mb-32">
          <div className="flex flex-col gap-0">
            {PIPELINE.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, ease }}
                className="flex gap-8"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                    style={{ background: `${step.color}15`, color: step.color }}
                  >
                    {step.num}
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <div className="w-px flex-1 min-h-8" style={{ background: `${P.gray}25` }} />
                  )}
                </div>
                {/* Content */}
                <div className="pb-12">
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-[14px] leading-relaxed" style={{ color: P.gray }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ═══ WHAT ARE xSTOCKS ═══ */}
        <section className="mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">What are xStocks?</h2>
            <p className="text-[15px] leading-relaxed mb-6" style={{ color: P.gray }}>
              xStocks are <strong style={{ color: P.dark }}>tokenized US equities</strong> — ERC-20 tokens on Ethereum, each backed 1:1 by an actual share held in custody by licensed institutions (Backed, Kraken). They&apos;ve been live on mainnet since September 2025.
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
            <p className="text-[15px] leading-relaxed" style={{ color: P.gray }}>
              No single AI controls your money. Three independent providers on 0G Compute analyze your portfolio and vote. Majority wins. If 0G goes down, inference falls back to WebAssembly in the browser. The system cannot crash.
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
              Crypto-backed mortgages are not hypothetical — they exist today. But proving your holdings means screenshots, CSV exports, and exchange statements that are trivially forgeable. Banks know it. Some require 60-120 day &ldquo;seasoning&rdquo; just to trust the data.
            </p>
            <p className="text-[15px] leading-relaxed" style={{ color: P.gray }}>
              Radegast replaces trust with math. A zero-knowledge proof is <strong style={{ color: P.dark }}>mathematically verifiable</strong> — the proof is valid regardless of who generated it. Even if Radegast disappears, the on-chain proof remains.
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
            <h2 className="text-3xl font-bold mb-4">Built on 0G — full stack</h2>
            <p className="text-[15px] leading-relaxed" style={{ color: P.gray }}>
              Radegast uses all 4 layers of the 0G stack. Every component is decentralized, verifiable, and auditable.
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
              { layer: "Compute", desc: "3 AI providers + XGBoost registered as a public service. Earns compute fees.", color: P.jade },
              { layer: "Storage", desc: "ONNX model stored with provenance (root_hash). Tamper-proof model integrity.", color: P.indigo },
              { layer: "Chain", desc: "Consensus settlement, xStocks ERC-20 tokens, ZK proof verification.", color: P.terracotta },
              { layer: "DA", desc: "Every AI decision = a verifiable audit blob. Full transparency, full history.", color: P.safran },
            ].map((l) => (
              <div key={l.layer} className="flex items-start gap-4 py-4 px-5 rounded-xl" style={{ background: `${l.color}06`, border: `1px solid ${l.color}12` }}>
                <span className="text-[14px] font-bold w-20 shrink-0" style={{ color: l.color }}>{l.layer}</span>
                <p className="text-[14px] leading-relaxed" style={{ color: P.gray }}>{l.desc}</p>
              </div>
            ))}
          </motion.div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="pt-8 text-center" style={{ borderTop: `1px solid ${P.gray}15` }}>
          <span className="text-[13px]" style={{ color: P.gray }}>ETHGlobal Cannes 2026</span>
        </footer>
      </div>
    </div>
  );
}
