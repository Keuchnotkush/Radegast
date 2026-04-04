"use client";

import { motion } from "framer-motion";
import {
  DynamicContextProvider,
  useSocialAccounts,
  useConnectWithOtp,
  useIsLoggedIn,
} from "@dynamic-labs/sdk-react-core";
const ProviderEnum = { Google: "google" as any, Apple: "apple" as any };
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
const spring = { type: "spring" as const, stiffness: 400, damping: 20 };

function AuthCard() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState("");
  const [btnHover, setBtnHover] = useState(0);

  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();
  const { signInWithSocialAccount, isProcessing: socialLoading } = useSocialAccounts();
  const { connectWithEmail, verifyOneTimePassword } = useConnectWithOtp();

  useEffect(() => {
    if (isLoggedIn) router.push("/dashboard");
  }, [isLoggedIn, router]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      await connectWithEmail(email);
      setOtpSent(true);
    } else {
      await verifyOneTimePassword(otp);
    }
  };

  const buttonLabel = otpSent ? "Verify code" : mode === "signin" ? "Sign in" : "Create account";

  return (
    <div
      className="rounded-3xl p-10"
      style={{ background: P.surface, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" }}
    >
      {/* HEADING */}
      <div className="text-center mb-10">
        <h1
          className="text-[30px] font-bold tracking-tight leading-tight"
          style={{ color: P.dark, fontFamily: "Sora, sans-serif" }}
        >
          The märkets never sleep.
          <br />
          <span style={{ color: P.jade }}>Neither should your money.</span>
        </h1>
        <p className="text-[14px] mt-3 leading-relaxed" style={{ color: P.gray }}>
          US stocks from änywhere, 24/7. No bärriers, no järgon —
          <br />
          just your portfolio, growing while the world sleeps.
        </p>
      </div>

      {/* TABS */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={spring}
        className="flex mb-8 rounded-full p-1"
        style={{ background: P.bg }}
      >
        <button
          onClick={() => { setMode("signin"); setOtpSent(false); }}
          className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 overflow-hidden"
          style={{
            background: mode === "signin" ? P.dark : "transparent",
            color: mode === "signin" ? P.white : P.gray,
          }}
        >
          <motion.span
            key={`signin-${mode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease }}
            className="block"
          >
            Sign in
          </motion.span>
        </button>
        <button
          onClick={() => { setMode("signup"); setOtpSent(false); }}
          className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-300 overflow-hidden"
          style={{
            background: mode === "signup" ? P.dark : "transparent",
            color: mode === "signup" ? P.white : P.gray,
          }}
        >
          <motion.span
            key={`signup-${mode}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease }}
            className="block"
          >
            Create account
          </motion.span>
        </button>
      </motion.div>

      {/* FORM */}
      <motion.div
        key={mode + (otpSent ? "-otp" : "")}
        initial={{ opacity: 0, x: mode === "signin" ? -15 : 15 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease }}
      >
        <form onSubmit={handleEmail} className="flex flex-col gap-4">
          {mode === "signup" && !otpSent && (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: P.gray }}>Full name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all duration-200 focus:ring-2"
                style={{ background: P.bg, color: P.dark, border: `1px solid ${P.border}` }}
              />
            </div>
          )}

          {!otpSent ? (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: P.gray }}>Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all duration-200 focus:ring-2"
                style={{ background: P.bg, color: P.dark, border: `1px solid ${P.border}` }}
              />
            </div>
          ) : (
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider block mb-2" style={{ color: P.gray }}>Verification code</label>
              <p className="text-[12px] mb-3" style={{ color: P.gray }}>We sent a code to {email}</p>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl text-[14px] outline-none transition-all duration-200 focus:ring-2 tracking-[0.3em] text-center"
                style={{ background: P.bg, color: P.dark, border: `1px solid ${P.border}` }}
                maxLength={6}
              />
            </div>
          )}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setBtnHover((h) => h + 1)}
            transition={spring}
            className="relative w-full py-3.5 rounded-xl text-[14px] font-semibold text-white mt-2 overflow-hidden"
            style={{ background: P.dark }}
          >
            <motion.span
              key={`${buttonLabel}-${btnHover}`}
              initial={{ opacity: 0, filter: "blur(8px)", scale: 0.9 }}
              animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              transition={{ duration: 0.4, ease }}
              className="block"
            >
              {buttonLabel}
            </motion.span>
          </motion.button>

          {otpSent && (
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="text-[12px] font-medium transition-opacity duration-200 hover:opacity-60"
              style={{ color: P.jade }}
            >
              Use a different email
            </button>
          )}
        </form>

        {/* DIVIDER */}
        {!otpSent && (
          <>
            <div className="flex items-center gap-4 my-7">
              <div className="flex-1 h-px" style={{ background: P.border }} />
              <span className="text-[11px] font-medium" style={{ color: P.gray }}>or continue with</span>
              <div className="flex-1 h-px" style={{ background: P.border }} />
            </div>

            {/* SOCIAL */}
            <div className="flex gap-3">
              <motion.button
                onClick={() => signInWithSocialAccount(ProviderEnum.Google)}
                disabled={socialLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-medium"
                style={{ background: P.bg, border: `1px solid ${P.border}`, color: P.dark, opacity: socialLoading ? 0.6 : 1 }}
              >
                <GoogleIcon />
                Google
              </motion.button>
              <motion.button
                onClick={() => signInWithSocialAccount(ProviderEnum.Apple)}
                disabled={socialLoading}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-[13px] font-medium"
                style={{ background: P.bg, border: `1px solid ${P.border}`, color: P.dark, opacity: socialLoading ? 0.6 : 1 }}
              >
                <AppleIcon />
                Apple
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function GetStarted() {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        events: {
          onAuthSuccess: (args) => console.log("[Dynamic] Auth success", args),
          onLogout: () => console.log("[Dynamic] Logged out"),
        },
      }}
    >
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: P.bg, fontFamily: "Sora, sans-serif" }}
      >
        <Link href="/landing" className="fixed top-6 left-8 z-40">
          <img src="/logo.svg" alt="Radegast" style={{ height: 22 }} />
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="w-full max-w-lg"
        >
          <AuthCard />
          <p className="text-center text-[11px] mt-6" style={{ color: P.gray }}>
            By continuing, you agree to the Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </DynamicContextProvider>
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
