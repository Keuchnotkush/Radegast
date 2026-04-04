"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { NavAvatar, SectionTitle, P, ease } from "../shared";
import { useSettings, AUTO_DURATIONS, type AutoDuration } from "../store";

const spring = { type: "spring" as const, stiffness: 400, damping: 20 };
const PROFILES = ["Conservative", "Moderate", "Growth", "Aggressive"];
const LIMITS = [100, 250, 500, 1000, 2500];

export default function SettingsPage() {
  const [form, setForm] = useState({
    firstName: "Kassim",
    lastName: "",
    email: "kassim@radegast.io",
    password: "",
    profile: "Growth",
  });
  const [saved, setSaved] = useState(false);
  const { aiSuggestions, setAiSuggestions, autoSession, activateAuto, revokeAuto, setAutoNotifications } = useSettings();

  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState(false);
  const [pendingDuration, setPendingDuration] = useState<AutoDuration>("24h");
  const [pendingLimit, setPendingLimit] = useState(500);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleActivate() {
    setMfaCode("");
    setMfaError(false);
    setShowMfa(true);
  }

  function handleMfaConfirm() {
    if (mfaCode.length === 6) {
      activateAuto(pendingDuration, pendingLimit);
      setShowMfa(false);
    } else {
      setMfaError(true);
    }
  }

  const initial = form.firstName.charAt(0).toUpperCase() || "?";
  const sessionActive = autoSession.active;
  const timeLeft = sessionActive ? Math.max(0, autoSession.expiresAt - Date.now()) : 0;
  const hoursLeft = Math.floor(timeLeft / 3600_000);
  const minsLeft = Math.floor((timeLeft % 3600_000) / 60_000);

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={initial} />

      <div className="max-w-2xl mx-auto px-5 md:px-8 pt-20 pb-16">

        {/* ── Back ── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={spring}
        >
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-[13px] font-medium mb-10" style={{ color: P.gray }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to portfolio
          </Link>
        </motion.div>

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="flex items-center gap-5 mb-14"
        >
          <motion.div
            whileHover={{ scale: 1.08 }}
            transition={spring}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shrink-0"
            style={{ background: P.terracotta, color: P.white }}
          >
            {initial}
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Settings</h1>
            <p className="text-[14px] mt-1" style={{ color: P.gray }}>Manage your account and preferences.</p>
          </div>
        </motion.div>

        {/* ═══ ACCOUNT ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="p-6 rounded-2xl mb-6"
          style={{ background: P.surface, border: `1px solid ${P.border}30` }}
        >
          <SectionTitle>Account</SectionTitle>
          <div className="flex flex-col gap-5 mt-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="First name" value={form.firstName} onChange={(v) => update("firstName", v)} />
              <Field label="Last name" value={form.lastName} onChange={(v) => update("lastName", v)} placeholder="Your last name" />
            </div>
            <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" />
            <Field label="Password" value={form.password} onChange={(v) => update("password", v)} type="password" placeholder="New password" />
          </div>
        </motion.section>

        {/* ═══ INVESTOR PROFILE ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="p-6 rounded-2xl mb-6"
          style={{ background: P.surface, border: `1px solid ${P.border}30` }}
        >
          <SectionTitle>Investor profile</SectionTitle>
          <p className="text-[13px] mt-2 mb-5" style={{ color: P.gray }}>
            This shapes how the AI allocates your portfolio and manages risk.
          </p>
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={spring}
            className="flex rounded-full p-1 overflow-x-auto"
            style={{ background: P.bg }}
          >
            {PROFILES.map((p) => {
              const active = form.profile === p;
              return (
                <motion.button
                  key={p}
                  onClick={() => update("profile", p)}
                  animate={{
                    background: active ? P.dark : "transparent",
                    color: active ? P.white : P.gray,
                    scale: active ? 1.05 : 1,
                  }}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="relative flex-1 py-3 rounded-full text-[14px] font-semibold cursor-pointer"
                >
                  {p}
                </motion.button>
              );
            })}
          </motion.div>
        </motion.section>

        {/* ═══ AI ADVISOR ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="p-6 rounded-2xl mb-6"
          style={{ background: P.surface, border: `1px solid ${P.border}30` }}
        >
          <SectionTitle>AI Advisor</SectionTitle>
          <div className="flex items-center justify-between mt-5">
            <div>
              <div className="text-[15px] font-semibold">{aiSuggestions ? "Enabled" : "Disabled"}</div>
              <p className="text-[12px] mt-0.5" style={{ color: P.gray }}>
                {aiSuggestions ? "AI recommendations appear on your portfolio and advisor page." : "Enable to receive buy/hold/sell recommendations."}
              </p>
            </div>
            <Toggle checked={aiSuggestions} onChange={setAiSuggestions} />
          </div>
        </motion.section>

        {/* ═══ AUTONOMOUS TRADING ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
          className="p-6 rounded-2xl mb-8"
          style={{ background: P.surface, border: `1px solid ${sessionActive ? P.jade : P.border}30` }}
        >
          <div className="flex items-center justify-between mb-5">
            <SectionTitle>Autonomous Trading</SectionTitle>
            {sessionActive && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: P.jade }} />
                <span className="text-[12px] font-semibold" style={{ color: P.jade }}>Active · {hoursLeft}h {minsLeft}m left</span>
              </div>
            )}
          </div>

          {sessionActive ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <MiniStat label="Duration" value={AUTO_DURATIONS.find((d) => d.key === autoSession.duration)?.label || ""} />
                <MiniStat label="Daily limit" value={`$${autoSession.dailyLimit}`} />
                <MiniStat label="Spent today" value={`$${autoSession.spentToday}`} />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-medium mb-1.5" style={{ color: P.gray }}>
                  <span>Budget used</span>
                  <span>{autoSession.dailyLimit > 0 ? Math.round((autoSession.spentToday / autoSession.dailyLimit) * 100) : 0}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: `${P.border}20` }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${autoSession.dailyLimit > 0 ? Math.min(100, (autoSession.spentToday / autoSession.dailyLimit) * 100) : 0}%` }}
                    transition={spring}
                    className="h-full rounded-full"
                    style={{ background: P.jade }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[14px] font-medium">Trade notifications</div>
                  <p className="text-[12px] mt-0.5" style={{ color: P.gray }}>Get notified on each AI trade</p>
                </div>
                <Toggle checked={autoSession.notifications} onChange={setAutoNotifications} />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                onClick={revokeAuto}
                className="w-full py-3 rounded-xl text-[14px] font-semibold cursor-pointer"
                style={{ background: `${P.loss}10`, color: P.loss, border: `1px solid ${P.loss}25` }}
              >
                Revoke Access
              </motion.button>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-[13px] leading-relaxed" style={{ color: P.gray }}>
                Let the AI trade on your behalf. You set the limits — it handles the rest.
              </p>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2.5" style={{ fontFamily: "Lexend", color: P.gray }}>
                  Session duration
                </label>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={spring}
                  className="flex rounded-full p-1 overflow-x-auto"
                  style={{ background: P.bg }}
                >
                  {AUTO_DURATIONS.map((d) => {
                    const active = pendingDuration === d.key;
                    return (
                      <motion.button
                        key={d.key}
                        onClick={() => setPendingDuration(d.key)}
                        animate={{
                          background: active ? P.dark : "transparent",
                          color: active ? P.white : P.gray,
                          scale: active ? 1.05 : 1,
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        className="flex-1 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer"
                      >
                        {d.label}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2.5" style={{ fontFamily: "Lexend", color: P.gray }}>
                  Daily spending limit
                </label>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  transition={spring}
                  className="flex rounded-full p-1"
                  style={{ background: P.bg }}
                >
                  {LIMITS.map((l) => {
                    const active = pendingLimit === l;
                    return (
                      <motion.button
                        key={l}
                        onClick={() => setPendingLimit(l)}
                        animate={{
                          background: active ? P.dark : "transparent",
                          color: active ? P.white : P.gray,
                          scale: active ? 1.05 : 1,
                        }}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                        className="flex-1 py-2.5 rounded-full text-[13px] font-semibold cursor-pointer"
                      >
                        ${l}
                      </motion.button>
                    );
                  })}
                </motion.div>
              </div>

              <div className="rounded-xl p-4" style={{ background: `${P.jade}06`, border: `1px solid ${P.jade}15` }}>
                <div className="text-[12px] font-semibold mb-2" style={{ color: P.jade }}>Session key permissions</div>
                <ul className="flex flex-col gap-1.5">
                  {[
                    `Trade up to $${pendingLimit}/day`,
                    "Only xStock contracts (no withdrawals)",
                    `Expires after ${AUTO_DURATIONS.find((d) => d.key === pendingDuration)?.label}`,
                    "Revocable instantly from this page",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[12px]" style={{ color: P.gray }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <ActivateButton onClick={handleActivate} />
            </div>
          )}
        </motion.section>

        {/* ═══ SAVE ═══ */}
        <SaveButton saved={saved} onClick={save} />
      </div>

      {/* ═══ MFA MODAL ═══ */}
      <AnimatePresence>
        {showMfa && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMfa(false)}
              className="fixed inset-0 z-50"
              style={{ background: "rgba(42,42,42,0.4)", backdropFilter: "blur(4px)" }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm rounded-2xl p-8" style={{ background: P.surface }}>
                <div className="flex justify-center mb-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: `${P.jade}14` }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Confirm your identity</h3>
                <p className="text-[13px] text-center mb-6" style={{ color: P.gray }}>Enter the 6-digit code to authorize autonomous trading.</p>

                <div className="rounded-lg p-3 mb-5" style={{ background: P.bg }}>
                  <div className="flex justify-between text-[12px] mb-1">
                    <span style={{ color: P.gray }}>Duration</span>
                    <span className="font-semibold">{AUTO_DURATIONS.find((d) => d.key === pendingDuration)?.label}</span>
                  </div>
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: P.gray }}>Daily limit</span>
                    <span className="font-semibold">${pendingLimit}/day</span>
                  </div>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, "")); setMfaError(false); }}
                  placeholder="000000"
                  autoFocus
                  className="w-full py-4 text-center text-2xl font-bold tracking-[0.5em] rounded-xl outline-none mb-2"
                  style={{ background: P.bg, color: P.dark, border: `1.5px solid ${mfaError ? P.loss : P.border}` }}
                  onKeyDown={(e) => e.key === "Enter" && handleMfaConfirm()}
                />
                {mfaError && <p className="text-[12px] text-center mb-3" style={{ color: P.loss }}>Enter a 6-digit code</p>}
                <p className="text-[11px] text-center mb-5" style={{ color: P.gray }}>For this demo, enter any 6 digits</p>

                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowMfa(false)}
                    className="flex-1 py-3 rounded-xl text-[14px] font-semibold cursor-pointer"
                    style={{ background: `${P.border}25`, color: P.gray }}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleMfaConfirm}
                    className="flex-1 py-3 rounded-xl text-[14px] font-semibold cursor-pointer"
                    style={{ background: P.jade, color: P.white, opacity: mfaCode.length === 6 ? 1 : 0.5 }}>
                    Authorize
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══ SUB COMPONENTS ═══ */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="cursor-pointer shrink-0">
      <motion.div
        animate={{ background: checked ? P.jade : P.border }}
        transition={{ duration: 0.3 }}
        className="relative w-12 h-7 rounded-full"
      >
        <motion.div
          animate={{ x: checked ? 22 : 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 rounded-full bg-white"
        />
      </motion.div>
    </button>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: P.bg }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ fontFamily: "Lexend", color: P.gray }}>{label}</div>
      <div className="text-[16px] font-bold">{value}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider block mb-2" style={{ fontFamily: "Lexend", color: P.gray }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full py-3.5 px-5 rounded-xl text-[15px] font-medium outline-none transition"
        style={{ background: P.bg, color: P.dark, border: `1.5px solid ${P.border}40` }}
        onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
        onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}40`)}
      />
    </div>
  );
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  const [hoverCount, setHoverCount] = useState(0);
  const label = saved ? "Saved!" : "Save changes";
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHoverCount((h) => h + 1)}
      transition={spring}
      onClick={onClick}
      className="relative w-full py-4 rounded-xl text-[15px] font-bold overflow-hidden cursor-pointer"
      style={{ background: saved ? P.jade : P.dark, color: P.white }}
    >
      <motion.span
        key={`${label}-${hoverCount}`}
        initial={{ opacity: 0, filter: "blur(8px)", scale: 0.9 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 0.4, ease }}
        className="block"
      >
        {label}
      </motion.span>
    </motion.button>
  );
}

function ActivateButton({ onClick }: { onClick: () => void }) {
  const [hoverCount, setHoverCount] = useState(0);
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHoverCount((h) => h + 1)}
      transition={spring}
      onClick={onClick}
      className="relative w-full py-4 rounded-xl text-[15px] font-bold overflow-hidden cursor-pointer flex items-center justify-center gap-2.5"
      style={{ background: P.jade, color: P.white }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <motion.span
        key={hoverCount}
        initial={{ opacity: 0, filter: "blur(8px)" }}
        animate={{ opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease }}
      >
        Authorize Autonomous Trading
      </motion.span>
    </motion.button>
  );
}
