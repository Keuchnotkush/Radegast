"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePrivy, useLoginWithEmail, useLoginWithOAuth } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { P, ease, spring } from "../lib/theme";

/* ─── OTP 6-digit boxes ─── */
function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, "").slice(0, 6).split("");

  function handleInput(i: number, char: string) {
    if (!/^\d$/.test(char) && char !== "") return;
    const next = [...digits];
    next[i] = char;
    onChange(next.join("").replace(/\s/g, ""));
    if (char && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text) {
      e.preventDefault();
      onChange(text);
      refs.current[Math.min(text.length, 5)]?.focus();
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <motion.input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease, delay: i * 0.05 }}
          className="w-13 h-16 text-center text-2xl font-bold rounded-xl outline-none"
          style={{
            background: digits[i]?.trim() ? `${P.jade}10` : `${P.dark}06`,
            color: P.dark,
            border: `2px solid ${digits[i]?.trim() ? P.jade : "transparent"}`,
            caretColor: P.jade,
          }}
        />
      ))}
    </div>
  );
}

function AuthForm({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [name, setName] = useState("");
  const [btnHover, setBtnHover] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const { authenticated } = usePrivy();
  const router = useRouter();

  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: (user) => {
      console.log("[Privy] Email auth success", user);
      const userEmail = user?.user?.email?.address || email;
      if (userEmail) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/user/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userEmail,
            firstName: name.trim().split(" ")[0] || localStorage.getItem("radegast_firstName") || "",
            lastName: name.trim().split(" ").slice(1).join(" ") || "",
          }),
        }).catch(() => {});
      }
    },
    onError: (err) => console.error("[Privy] Email error:", err),
  });

  const { initOAuth } = useLoginWithOAuth({
    onComplete: (user) => {
      console.log("[Privy] OAuth success", user);
      setSocialLoading(false);
      const userEmail = user?.user?.email?.address;
      if (userEmail) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/user/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: userEmail, firstName: "", lastName: "" }),
        }).catch(() => {});
      }
    },
    onError: (err) => {
      console.error("[Privy] OAuth error:", err);
      setSocialLoading(false);
    },
  });

  useEffect(() => {
    if (authenticated) {
      onLoggedIn();
      if (mode === "signup" && name.trim()) {
        const firstName = name.trim().split(" ")[0];
        const lastName = name.trim().split(" ").slice(1).join(" ");
        localStorage.setItem("radegast_firstName", firstName);
        localStorage.setItem("radegast_isNew", "true");
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/user/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, firstName, lastName }),
        }).catch(() => {});
        setTimeout(() => router.push("/dashboard/onboarding"), 600);
      } else {
        setTimeout(() => router.push("/dashboard"), 600);
      }
    }
  }, [authenticated, router, mode, name, email, onLoggedIn]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      if (mode === "signup" && name.trim()) {
        localStorage.setItem("radegast_firstName", name.trim().split(" ")[0]);
      }
      await sendCode({ email });
      setOtpSent(true);
    } else {
      await loginWithCode({ code: otp });
    }
  };

  const buttonLabel = otpSent ? "Verify" : mode === "signin" ? "Sign in" : "Create account";

  return (
    <div className="w-full max-w-lg">

      {/* TABS — pill switcher */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5, ease }}
        className="flex mb-12 rounded-full p-1.5"
        style={{ background: `${P.dark}08` }}
      >
        {(["signin", "signup"] as const).map((m) => (
          <motion.button
            key={m}
            onClick={() => { setMode(m); setOtpSent(false); }}
            animate={{
              background: mode === m ? P.dark : "transparent",
              color: mode === m ? P.white : P.gray,
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.3, ease }}
            className="flex-1 py-4 rounded-full text-[16px] font-semibold cursor-pointer"
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </motion.button>
        ))}
      </motion.div>

      {/* FORM */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode + (otpSent ? "-otp" : "")}
          initial={{ opacity: 0, filter: "blur(6px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.25, ease }}
        >
          <form onSubmit={handleEmail} className="flex flex-col gap-8">

            {/* Name (signup only) */}
            {mode === "signup" && !otpSent && (
              <div>
                <label className="text-[13px] font-semibold uppercase tracking-wider block mb-3" style={{ fontFamily: "Lexend", color: focusedField === "name" ? P.jade : P.gray }}>
                  Full name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full py-5 px-0 text-[18px] font-medium outline-none bg-transparent"
                    style={{ color: P.dark, borderBottom: `2px solid ${focusedField === "name" ? P.jade : `${P.border}60`}` }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px]"
                    style={{ background: P.jade }}
                    animate={{ width: focusedField === "name" ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease }}
                  />
                </div>
              </div>
            )}

            {/* Email or OTP */}
            {!otpSent ? (
              <div>
                <label className="text-[13px] font-semibold uppercase tracking-wider block mb-3" style={{ fontFamily: "Lexend", color: focusedField === "email" ? P.jade : P.gray }}>
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="w-full py-5 px-0 text-[18px] font-medium outline-none bg-transparent"
                    style={{ color: P.dark, borderBottom: `2px solid ${focusedField === "email" ? P.jade : `${P.border}60`}` }}
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px]"
                    style={{ background: P.jade }}
                    animate={{ width: focusedField === "email" ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease }}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[13px] mb-6" style={{ color: P.gray }}>
                  Code sent to <strong style={{ color: P.dark }}>{email}</strong>
                </p>
                <OtpBoxes value={otp} onChange={setOtp} />
              </div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onHoverStart={() => setBtnHover((h) => h + 1)}
              transition={spring}
              className="get-started-btn w-full py-5 rounded-full text-[17px] font-bold text-white mt-4 cursor-pointer overflow-hidden"
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
                className="text-[13px] font-medium cursor-pointer mx-auto"
                style={{ color: P.jade }}
              >
                Use a different email
              </button>
            )}
          </form>

          {/* SOCIAL LOGIN */}
          {!otpSent && (
            <>
              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px" style={{ background: `${P.border}80` }} />
                <span className="text-[11px] font-medium" style={{ color: P.gray }}>or</span>
                <div className="flex-1 h-px" style={{ background: `${P.border}80` }} />
              </div>

              {/* Google + Discord */}
              <div className="flex gap-4">
                <motion.button
                  onClick={() => { setSocialLoading(true); initOAuth({ provider: "google" }); }}
                  disabled={socialLoading}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl text-[16px] font-semibold cursor-pointer"
                  style={{ background: P.white, color: P.dark, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", opacity: socialLoading ? 0.6 : 1 }}
                >
                  <GoogleIcon />
                  Google
                </motion.button>
                <motion.button
                  onClick={() => { setSocialLoading(true); initOAuth({ provider: "discord" }); }}
                  disabled={socialLoading}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  className="flex-1 flex items-center justify-center gap-3 py-5 rounded-2xl text-[16px] font-semibold cursor-pointer"
                  style={{ background: "#5865F2", color: P.white, boxShadow: "0 2px 12px rgba(88,101,242,0.2)", opacity: socialLoading ? 0.6 : 1 }}
                >
                  <DiscordIcon />
                  Discord
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function GetStarted() {
  const [transitioning, setTransitioning] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row relative overflow-hidden"
      style={{ background: P.bg, fontFamily: "Sora, sans-serif" }}
    >
      {/* Jade circle overlay — expands on login */}
      <motion.div
        className="fixed inset-0 z-50 pointer-events-none"
        style={{ background: P.jade }}
        initial={{ clipPath: "circle(0% at 50% 50%)" }}
        animate={{ clipPath: transitioning ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)" }}
        transition={{ duration: 0.6, ease }}
      />
      {/* Back arrow */}
      <Link href="/landing" className="fixed top-6 left-6 z-40">
        <motion.div
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.95 }}
          transition={spring}
          className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: `${P.dark}08` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={P.dark} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
          </svg>
        </motion.div>
      </Link>

      {/* LEFT — Giant typographic statement */}
      <div className="hidden md:flex flex-[1.6] items-center justify-center p-8 lg:p-16 relative">
        <div className="max-w-4xl">
          <motion.h1
            initial={{ clipPath: "inset(-20% 100% 0 0)", opacity: 0 }}
            animate={{ clipPath: "inset(-20% 0% 0 0)", opacity: 1 }}
            transition={{ duration: 1.6, ease, delay: 0.1 }}
            className="text-[52px] lg:text-[110px] font-bold leading-[0.95] tracking-tighter overflow-visible pt-4"
            style={{ color: P.dark }}
          >
            The <span style={{ color: P.jade }}>märkets</span> never sleep.
          </motion.h1>
          <div className="h-4 lg:h-6" />
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.7, ease }}
            className="text-[52px] lg:text-[110px] font-bold leading-[0.90] tracking-tighter"
            style={{ color: P.dark }}
          >
            Neither should your <span style={{ color: P.jade }}>money</span>.
          </motion.p>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: 80 }}
            transition={{ delay: 1.8, duration: 0.6, ease }}
            className="h-[3px] rounded-full mt-10"
            style={{ background: P.jade }}
          />

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.6, ease }}
            className="text-[15px] leading-relaxed mt-6 max-w-sm"
            style={{ color: P.gray }}
          >
            US stocks from änywhere, 24/7. No bärriers, no järgon — just your portfolio, growing while the world sleeps.
          </motion.p>
        </div>
      </div>

      {/* RIGHT — Auth form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          {/* Mobile heading (hidden on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="md:hidden text-center mb-12 mt-8"
          >
            <h1 className="text-3xl font-bold leading-tight" style={{ color: P.dark }}>
              The märkets never sleep.
              <br />
              <span style={{ color: P.jade }}>Neither should your money.</span>
            </h1>
          </motion.div>

          <AuthForm onLoggedIn={() => setTransitioning(true)} />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-center text-[11px] mt-8"
            style={{ color: P.gray }}
          >
            By continuing, you agree to the Terms of Service and Privacy Policy.
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    </svg>
  );
}
