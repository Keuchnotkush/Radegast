"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TogglePill, P, ease, spring } from "../shared";
import { useUser } from "../store";
// Dynamic import — bb.js WASM can't load during SSR/build
const loadProver = () => import("@/lib/noir/prover").then((m) => m.generateProof);

const THRESHOLDS = ["$10,000", "$25,000", "$50,000", "$100,000"];

type ProofState = "idle" | "generating" | "done";

interface Proof {
  hash: string;
  threshold: string;
  result: boolean;
  timestamp: string;
  pdf: boolean;
  qr: boolean;
}

export default function SolvencyContent() {
  const { initial } = useUser();
  const [threshold, setThreshold] = useState("");
  const [custom, setCustom] = useState("");
  const [wantPdf, setWantPdf] = useState(false);
  const [wantQr, setWantQr] = useState(false);
  const [state, setState] = useState<ProofState>("idle");
  const [proof, setProof] = useState<Proof | null>(null);
  const [history, setHistory] = useState<Proof[]>([]);

  const activeThreshold = custom || threshold;
  const hasThreshold = activeThreshold.length > 0;

  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setState("generating");
    setError(null);
    try {
      // Parse threshold — strip $ and commas
      const thresholdNum = activeThreshold.replace(/[$,]/g, "");

      // TODO: read real balances from on-chain xStock holdings
      // Mock portfolio: ~$150k total (supports all threshold presets)
      const balances = ["100", "50", "80", "30", "40", "20", "100", "25", "10"];
      const prices = ["250", "198", "140", "175", "185", "510", "530", "480", "1700"];
      const secret = "12345678";

      // 1. Generate ZK proof client-side (private inputs never leave browser)
      const generateProof = await loadProver();
      const { proof, publicInputs } = await generateProof(balances, prices, secret, thresholdNum);

      // 2. Send proof to backend for on-chain verification
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/proof/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threshold: activeThreshold,
          proof: "0x" + Array.from(proof).map((b: number) => b.toString(16).padStart(2, "0")).join(""),
          publicInputs: publicInputs.map((pi: string) => pi),
        }),
      });
      const data = await res.json();

      const p: Proof = {
        hash: data.hash || data.verifyId || "0x—",
        threshold: activeThreshold,
        result: data.result !== false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pdf: wantPdf,
        qr: wantQr,
      };
      setProof(p);
      setHistory((h) => [p, ...h]);
      setState("done");
    } catch (e) {
      console.error("Proof generation failed:", e);
      setError(e instanceof Error ? e.message : "Proof generation failed");
      setState("idle");
    }
  }

  function reset() {
    setState("idle");
    setProof(null);
    setCustom("");
    setThreshold("");
    setWantPdf(false);
    setWantQr(false);
  }

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={initial} />

      <div className="w-full max-w-[1440px] mx-auto px-16 pt-20 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mb-14"
        >
          <h1 className="text-5xl font-bold leading-tight">
            Prove it, <span style={{ color: P.jade }}>reveal nothing</span>.
          </h1>
          <p className="text-lg mt-3" style={{ color: P.gray }}>
            Generate a zero-knowledge proof that your portfolio exceeds a threshold — without exposing your holdings.
          </p>
        </motion.div>

        {/* ═══ GENERATOR ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="mb-16"
        >
          <SectionTitle>Threshold</SectionTitle>

          {/* Preset pills */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={spring}
            className="flex rounded-full p-1 mt-4 mb-6 origin-center"
            style={{ background: P.surface }}
          >
            {THRESHOLDS.map((t) => {
              const active = threshold === t && !custom;
              return (
                <motion.button
                  key={t}
                  onClick={() => { setThreshold(t); setCustom(""); }}
                  animate={{
                    background: active ? P.dark : "transparent",
                    color: active ? P.white : P.gray,
                    scale: active ? 1.05 : 1,
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer"
                >
                  {t}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Custom input */}
          <div className="flex items-center rounded-xl overflow-hidden mb-8" style={{ border: `1.5px solid ${P.border}60` }}>
            <input
              type="text"
              inputMode="numeric"
              placeholder="$ Custom amount..."
              value={custom}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, "");
                setCustom(raw ? `$${Number(raw).toLocaleString("en-US")}` : "");
                setThreshold("");
              }}
              className="w-full py-3.5 px-2 text-[15px] font-semibold outline-none"
              style={{ background: "transparent", color: P.dark }}
              onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = P.jade)}
              onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = `${P.border}60`)}
            />
          </div>

          {/* Export format checkboxes — appear when threshold is set */}
          <AnimatePresence>
            {hasThreshold && state === "idle" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mb-8 overflow-hidden"
              >
                <SectionTitle>Export format</SectionTitle>
                <div className="flex gap-4 mt-4">
                  <TogglePill checked={wantPdf} onChange={setWantPdf} label="PDF Certificate" icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
                  <TogglePill checked={wantQr} onChange={setWantQr} label="QR Code" icon="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Steps */}
          <div className="grid grid-cols-4 gap-4 mb-10">
            {[
              { step: "1", text: "Your portfolio data stays in your browser — nothing leaves your device." },
              { step: "2", text: "A Noir circuit checks if total value > threshold using UltraPlonk." },
              { step: "3", text: "The proof is generated client-side via noir.js (WASM). ~3 seconds." },
              { step: "4", text: "Share the proof hash with anyone — they verify without seeing your stocks." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: P.surface, border: `1px solid ${P.border}30` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold" style={{ background: `${P.jade}15`, color: P.jade }}>
                  {s.step}
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>{s.text}</p>
              </div>
            ))}
          </div>

          {/* ─── State machine ─── */}
          <AnimatePresence mode="wait">

            {state === "idle" && (
              <motion.button
                key="idle"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                onClick={generate}
                disabled={!hasThreshold}
                className="get-started-btn w-full py-5 rounded-xl text-[16px] font-bold cursor-pointer text-white"
                style={{
                  cursor: hasThreshold ? "pointer" : "not-allowed",
                  opacity: hasThreshold ? 1 : 0.3,
                }}
              >
                Generate Proof
              </motion.button>
            )}

            {state === "generating" && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="w-full py-6 rounded-xl text-center"
                style={{ background: P.surface, border: `1px solid ${P.border}40` }}
              >
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 rounded-full"
                    style={{ border: `2px solid ${P.border}`, borderTopColor: P.jade }}
                  />
                  <span className="text-[14px] font-semibold" style={{ color: P.gray }}>Generating ZK proof...</span>
                </div>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ duration: 1.4, delay: i * 0.15, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: P.jade }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {state === "done" && proof && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl p-6"
                style={{ background: P.surface, border: `1px solid ${P.jade}30` }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${P.jade}15` }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[15px] font-bold" style={{ color: P.jade }}>Proof verified</div>
                    <div className="text-[12px]" style={{ color: P.gray }}>Portfolio &ge; {proof.threshold}</div>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: "Lexend", color: P.gray }}>Proof hash</div>
                  <div className="flex items-center gap-2 py-3 px-4 rounded-lg font-mono text-[13px] select-all" style={{ background: `${P.dark}08`, color: P.dark }}>
                    {proof.hash}
                    <button onClick={() => navigator.clipboard.writeText(proof.hash)} className="ml-auto shrink-0" title="Copy">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <Detail label="Circuit" value="UltraPlonk" />
                  <Detail label="Prover" value="noir.js (WASM)" />
                  <Detail label="Time" value={proof.timestamp} />
                </div>

                {(proof.pdf || proof.qr) && (
                  <div className="flex gap-3 mb-5">
                    {proof.pdf && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                        onClick={async () => {
                          const res = await fetch("/api/proof-pdf", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ verifyId: proof.hash, threshold: proof.threshold }),
                          });
                          if (!res.ok) return;
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "radegast_attestation_zk.pdf";
                          a.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold cursor-pointer"
                        style={{ background: P.jade, color: P.white }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
                        </svg>
                        Download PDF
                      </motion.button>
                    )}
                    {proof.qr && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                        onClick={() => {
                          window.open(`/verify/${encodeURIComponent(proof.hash)}`, "_blank");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold cursor-pointer"
                        style={{ background: P.dark, color: P.white }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        Show QR Code
                      </motion.button>
                    )}
                  </div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={reset} className="w-full py-3 rounded-xl text-[13px] font-semibold cursor-pointer"
                  style={{ background: `${P.dark}08`, color: P.dark }}>
                  Generate another proof
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mt-4 p-3 rounded-xl" style={{ background: `${P.loss}10`, border: `1px solid ${P.loss}30` }}>
              <span className="text-[13px]" style={{ color: P.loss }}>{error}</span>
            </div>
          )}

          {/* Privacy */}
          <div className="flex items-center gap-2 mt-5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="text-[12px]" style={{ color: P.gray }}>Zero-knowledge — all computation stays on your device</span>
          </div>
        </motion.section>

        {/* ═══ PROOF HISTORY ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="mb-16"
        >
          <SectionTitle>Proof history</SectionTitle>

          {history.length === 0 ? (
            <div className="mt-6 flex flex-col items-center text-center py-12">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: `${P.jade}20` }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <p className="text-[14px] font-medium" style={{ color: P.dark }}>No proofs yet</p>
              <p className="text-[12px] mt-1" style={{ color: P.gray }}>Generate your first proof to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 mt-6">
              {history.map((p, i) => (
                <motion.div
                  key={`${p.hash}-${i}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3, ease }}
                  className="flex items-center gap-4 py-4 px-5 rounded-2xl"
                  style={{ background: P.surface, border: `1px solid ${P.border}30` }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: p.result ? `${P.jade}15` : `${P.loss}15` }}>
                    {p.result ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.loss} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold">Portfolio &ge; {p.threshold}</div>
                    <div className="text-[11px] font-mono truncate mt-0.5" style={{ color: P.gray }}>{p.hash}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-semibold" style={{ color: p.result ? P.jade : P.loss }}>
                      {p.result ? "Verified" : "Failed"}
                    </div>
                    <div className="text-[11px]" style={{ color: P.gray }}>{p.timestamp}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* ═══ ZKP EXPLAINER ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
        >
          <div className="p-6 rounded-2xl" style={{ background: P.surface, border: `1px solid ${P.border}30` }}>
            <div className="flex items-center gap-3 mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span className="text-[16px] font-semibold" style={{ color: P.dark }}>What is zero-knowledge proof?</span>
            </div>
            <p className="text-[14px] leading-relaxed" style={{ color: P.dark, opacity: 0.7 }}>
              A ZK proof lets you prove a statement is true — like &quot;my portfolio is worth more than $50,000&quot; — without revealing any details about your actual holdings. The proof is generated entirely in your browser using Noir circuits compiled to UltraPlonk, and can be independently verified by anyone — a bank, a lender, or an auditor — without ever seeing what stocks you own or how much of each you hold.
            </p>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider" style={{ fontFamily: "Lexend", color: P.gray }}>{label}</div>
      <div className="text-[13px] font-medium mt-1">{value}</div>
    </div>
  );
}
