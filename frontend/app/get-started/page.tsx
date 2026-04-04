"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";

const P = {
  bg: "#D8D2C8",
  jade: "#38A88A",
  dark: "#2A2A2A",
  gray: "#6B6B6B",
  border: "#C4C4C4",
  surface: "#F0EDE8",
  white: "#FFFFFF",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function GetStarted() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: P.bg, fontFamily: "Sora, sans-serif" }}>
      {/* Back to home */}
      <Link href="/landing" className="fixed top-6 left-8 z-40">
        <img src="/logo.svg" alt="Radegast" style={{ height: 22 }} />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="w-full max-w-md"
      >
        {/* CARD */}
        <div className="rounded-2xl p-8" style={{ background: P.surface, boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          {/* LOGO */}
          <div className="flex justify-center mb-8">
            <img src="/logo.svg" alt="Radegast" style={{ height: 42 }} />
          </div>

          {/* TABS */}
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="flex mb-8 rounded-full p-1"
            style={{ background: P.bg }}
          >
            <button
              onClick={() => setMode("signin")}
              className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300"
              style={{
                background: mode === "signin" ? P.dark : "transparent",
                color: mode === "signin" ? P.white : P.gray,
              }}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode("signup")}
              className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300"
              style={{
                background: mode === "signup" ? P.dark : "transparent",
                color: mode === "signup" ? P.white : P.gray,
              }}
            >
              Create account
            </button>
          </motion.div>

          {/* FORM */}
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: mode === "signin" ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease }}
          >
            <div className="flex flex-col gap-4">
              {mode === "signup" && (
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: P.gray }}>Full name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all duration-200 focus:ring-2"
                    style={{ background: P.bg, color: P.dark, border: `1px solid ${P.border}` }}
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: P.gray }}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all duration-200 focus:ring-2"
                  style={{ background: P.bg, color: P.dark, border: `1px solid ${P.border}` }}
                />
              </div>
              <div>
                <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: P.gray }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-[14px] outline-none transition-all duration-200 focus:ring-2"
                  style={{ background: P.bg, color: P.dark, border: `1px solid ${P.border}` }}
                />
              </div>

              {mode === "signin" && (
                <div className="flex justify-end">
                  <span className="text-[12px] font-medium transition-opacity duration-200 hover:opacity-60" style={{ color: P.jade }}>Forgot password?</span>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="get-started-btn w-full py-3 rounded-xl text-[14px] font-semibold text-white mt-2"
              >
                {mode === "signin" ? "Sign in" : "Create account"}
              </motion.button>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px" style={{ background: P.border }} />
              <span className="text-[11px] font-medium" style={{ color: P.gray }}>or continue with</span>
              <div className="flex-1 h-px" style={{ background: P.border }} />
            </div>

            {/* SOCIAL */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium"
                style={{ background: P.bg, border: `1px solid ${P.border}`, color: P.dark }}
              >
                <GoogleIcon />
                Google
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-medium"
                style={{ background: P.bg, border: `1px solid ${P.border}`, color: P.dark }}
              >
                <AppleIcon />
                Apple
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* FOOTER */}
        <p className="text-center text-[11px] mt-6" style={{ color: P.gray }}>
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="#2A2A2A">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}
