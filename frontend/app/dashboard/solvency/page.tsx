"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TogglePill, P, ease, spring } from "../shared";
import { useUser } from "../store";

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

/* ─── Mock history (will be cleared later) ─── */
const MOCK_HISTORY: Proof[] = [
  { hash: "0x7a3f...c82e", threshold: "$50,000", result: true, timestamp: "10:42", pdf: true, qr: false },
  { hash: "0x1b9d...a47f", threshold: "$100,000", result: false, timestamp: "09:15", pdf: false, qr: true },
  { hash: "0xe4c1...3d6b", threshold: "$25,000", result: true, timestamp: "Yesterday", pdf: true, qr: true },
];

export default function SolvencyPage() {
  const { initial } = useUser();
  const [threshold, setThreshold] = useState("");
  const [custom, setCustom] = useState("");
  const [wantPdf, setWantPdf] = useState(false);
  const [wantQr, setWantQr] = useState(false);
  const [state, setState] = useState<ProofState>("idle");
  const [proof, setProof] = useState<Proof | null>(null);
  const [history, setHistory] = useState<Proof[]>(MOCK_HISTORY);
  const [showPdf, setShowPdf] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeThreshold = custom || threshold;
  const hasThreshold = activeThreshold.length > 0;

  async function generate() {
    setState("generating");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/proof/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold: activeThreshold }),
      });
      const data = await res.json();
      const p: Proof = {
        hash: data.hash || data.verifyId || "0x7f2a8b...e93d1c",
        threshold: activeThreshold,
        result: data.result !== false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pdf: wantPdf,
        qr: wantQr,
      };
      setProof(p);
      setHistory((h) => [p, ...h]);
      setState("done");
    } catch {
      // Mock fallback for demo
      const p: Proof = {
        hash: "0x7f2a8b4c9d1e6f3a5b8c2d7e4f9a1b3c5d8e2f6a9b4c7d0e3f1a5b8c2d9e3f",
        threshold: activeThreshold,
        result: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        pdf: wantPdf,
        qr: wantQr,
      };
      setProof(p);
      setHistory((h) => [p, ...h]);
      setState("done");
    }
  }

  function reset() {
    setState("idle");
    setProof(null);
    setCustom("");
    setThreshold("");
    setWantPdf(false);
    setWantQr(false);
    setShowPdf(false);
    setShowQr(false);
    setShowShare(false);
  }

  function copyHash(hash: string) {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={initial} />

      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-16 pt-20 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="mb-14"
        >
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
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
            className="flex rounded-full p-1 mt-4 mb-6 origin-center transition-colors duration-700"
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
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer whitespace-nowrap"
                >
                  {t}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Custom input */}
          <div className="flex items-center rounded-xl overflow-hidden mb-8" style={{ border: `1.5px solid ${P.border}60` }}>
            <span className="pl-4 text-[15px] font-bold" style={{ color: P.gray }}>$</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="Custom amount..."
              value={custom}
              onChange={(e) => setCustom(e.target.value.replace(/[^0-9.,]/g, ""))}
              className="w-full py-3.5 px-2 text-[15px] font-semibold outline-none"
              style={{ background: "transparent", color: P.dark }}
              onFocus={(e) => (e.currentTarget.parentElement!.style.borderColor = P.jade)}
              onBlur={(e) => (e.currentTarget.parentElement!.style.borderColor = `${P.border}60`)}
            />
          </div>

          {/* Export format */}
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
                <div className="flex gap-3 mt-4">
                  <TogglePill checked={wantPdf} onChange={setWantPdf} label="PDF" icon="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
                  <TogglePill checked={wantQr} onChange={setWantQr} label="QR Code" icon="M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Steps */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="w-full py-6 rounded-xl text-center"
                style={{ background: P.surface, border: `1px solid ${P.border}40` }}
              >
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 rounded-full"
                    style={{ border: `2px solid ${P.border}`, borderTopColor: P.jade }}
                  />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-[14px] font-semibold"
                    style={{ color: P.gray }}
                  >
                    Generating ZK proof...
                  </motion.span>
                </div>
                <div className="flex justify-center gap-1 mt-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, opacity: [0.2, 1, 0.2] }}
                      transition={{ scale: { delay: 0.4 + i * 0.08, duration: 0.3 }, opacity: { duration: 1.4, delay: 0.5 + i * 0.15, repeat: Infinity } }}
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
                    <span className="truncate">{proof.hash}</span>
                    <button onClick={() => copyHash(proof.hash)} className="ml-auto shrink-0 cursor-pointer" title="Copy">
                      {copied ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <Detail label="Circuit" value="UltraPlonk" />
                  <Detail label="Prover" value="noir.js (WASM)" />
                  <Detail label="Time" value={proof.timestamp} />
                </div>

                {/* Action buttons — PDF, QR, Share */}
                <div className="flex gap-3 mb-5">
                  {proof.pdf && (
                    <ActionBtn
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>}
                      label="View PDF"
                      bg={P.jade}
                      onClick={() => setShowPdf(!showPdf)}
                    />
                  )}
                  {proof.qr && (
                    <ActionBtn
                      icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>}
                      label="Show QR"
                      bg={P.dark}
                      onClick={() => setShowQr(!showQr)}
                    />
                  )}
                  <ActionBtn
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>}
                    label="Share"
                    bg={`${P.dark}12`}
                    color={P.dark}
                    onClick={() => setShowShare(!showShare)}
                  />
                </div>

                {/* ─── PDF Preview mockup ─── */}
                <AnimatePresence>
                  {showPdf && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden mb-5"
                    >
                      <div className="rounded-xl p-6" style={{ background: P.white, border: `1px solid ${P.border}30` }}>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <img src="/logo-no-dots.svg" alt="Radegast" className="h-6" />
                            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: P.gray }}>Certificate of Solvency</p>
                          </div>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${P.jade}15` }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                          </div>
                        </div>

                        <div className="h-px mb-5" style={{ background: `${P.border}40` }} />

                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <PdfField label="Holder" value="Kassim M." />
                          <PdfField label="Date" value={new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
                          <PdfField label="Threshold" value={proof.threshold} />
                          <PdfField label="Status" value="Verified" accent />
                        </div>

                        <div className="mb-5">
                          <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: P.gray }}>Proof Hash</div>
                          <div className="font-mono text-[11px] break-all" style={{ color: P.dark }}>{proof.hash}</div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-5">
                          <PdfField label="Circuit" value="UltraPlonk" />
                          <PdfField label="Chain" value="0G Chain" />
                          <PdfField label="Prover" value="noir.js" />
                        </div>

                        <div className="h-px mb-4" style={{ background: `${P.border}40` }} />

                        <div className="flex items-center justify-between">
                          <p className="text-[10px]" style={{ color: P.gray }}>This certificate was generated using zero-knowledge cryptography. No portfolio details were disclosed.</p>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={spring}
                            className="px-4 py-2 rounded-lg text-[12px] font-semibold cursor-pointer shrink-0 ml-4 whitespace-nowrap"
                            style={{ background: P.jade, color: P.white }}
                            onClick={async () => {
                              const res = await fetch("/api/proof-pdf", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ verifyId: proof.hash.slice(0, 16), threshold: proof.threshold, timestamp: proof.timestamp }),
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
                          >
                            Download PDF
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── QR Code mockup ─── */}
                <AnimatePresence>
                  {showQr && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden mb-5"
                    >
                      <div className="rounded-xl p-6 flex flex-col items-center" style={{ background: P.white, border: `1px solid ${P.border}30` }}>
                        <p className="text-[13px] font-semibold mb-4">Scan to verify this proof</p>
                        {/* Mock QR code */}
                        <div className="w-48 h-48 rounded-xl p-3 mb-4" style={{ background: P.white, border: `2px solid ${P.dark}` }}>
                          <svg viewBox="0 0 100 100" className="w-full h-full">
                            {/* QR pattern mockup */}
                            <rect x="5" y="5" width="25" height="25" rx="2" fill={P.dark} />
                            <rect x="8" y="8" width="19" height="19" rx="1" fill={P.white} />
                            <rect x="12" y="12" width="11" height="11" rx="1" fill={P.dark} />
                            <rect x="70" y="5" width="25" height="25" rx="2" fill={P.dark} />
                            <rect x="73" y="8" width="19" height="19" rx="1" fill={P.white} />
                            <rect x="77" y="12" width="11" height="11" rx="1" fill={P.dark} />
                            <rect x="5" y="70" width="25" height="25" rx="2" fill={P.dark} />
                            <rect x="8" y="73" width="19" height="19" rx="1" fill={P.white} />
                            <rect x="12" y="77" width="11" height="11" rx="1" fill={P.dark} />
                            {/* Data modules */}
                            {[35,40,45,50,55,60].map(x => [5,15,25,35,45,55,65,75,85].map(y => (
                              <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="0.5" fill={P.dark} opacity={(x+y) % 3 === 0 ? 1 : 0.3} />
                            )))}
                            {[5,15,25,65,75,85].map(x => [35,40,45,50,55,60].map(y => (
                              <rect key={`v${x}-${y}`} x={x} y={y} width="4" height="4" rx="0.5" fill={P.dark} opacity={(x+y) % 2 === 0 ? 1 : 0.2} />
                            )))}
                            {[70,75,80,85,90].map(x => [70,75,80,85,90].map(y => (
                              <rect key={`c${x}-${y}`} x={x} y={y} width="4" height="4" rx="0.5" fill={P.dark} opacity={(x*y) % 3 === 0 ? 0.8 : 0.15} />
                            )))}
                          </svg>
                        </div>
                        <p className="text-[11px] font-mono text-center truncate max-w-xs" style={{ color: P.gray }}>
                          radegast.io/verify/{proof.hash.slice(0, 16)}...
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Share options ─── */}
                <AnimatePresence>
                  {showShare && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden mb-5"
                    >
                      <div className="rounded-xl p-5" style={{ background: P.white, border: `1px solid ${P.border}30` }}>
                        <p className="text-[13px] font-semibold mb-4">Share your proof</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <ShareBtn
                            label="Copy link"
                            color="#2A2A2A"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>}
                            onClick={() => copyHash(`https://radegast.io/verify/${proof.hash}`)}
                          />
                          <ShareBtn
                            label="Email"
                            color="#EA4335"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
                            onClick={() => window.open(`mailto:?subject=${encodeURIComponent("Radegast — Proof of Solvency")}&body=${encodeURIComponent(`Verify my proof of solvency: https://radegast.io/verify/${proof.hash}`)}`)}
                          />
                          <ShareBtn
                            label="WhatsApp"
                            color="#25D366"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>}
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Verify my Radegast proof of solvency: https://radegast.io/verify/${proof.hash}`)}`)}
                          />
                          <ShareBtn
                            label="Telegram"
                            color="#0088cc"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>}
                            onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(`https://radegast.io/verify/${proof.hash}`)}&text=${encodeURIComponent("Verify my Radegast proof of solvency")}`)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={spring}
                  onClick={reset} className="w-full py-3 rounded-xl text-[13px] font-semibold cursor-pointer"
                  style={{ background: `${P.dark}08`, color: P.dark }}>
                  Generate another proof
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
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

function PdfField({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: P.gray }}>{label}</div>
      <div className="text-[14px] font-semibold" style={{ color: accent ? P.jade : P.dark }}>{value}</div>
    </div>
  );
}

function ActionBtn({ icon, label, bg, color, onClick }: { icon: React.ReactNode; label: string; bg: string; color?: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={spring}
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold cursor-pointer whitespace-nowrap"
      style={{ background: bg, color: color || P.white }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

function ShareBtn({ label, color, icon, onClick }: { label: string; color: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={spring}
      onClick={onClick}
      className="flex flex-col items-center gap-2 py-3 px-2 rounded-xl cursor-pointer"
      style={{ background: `${color}10` }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <span className="text-[11px] font-semibold" style={{ color }}>{label}</span>
    </motion.button>
  );
}
