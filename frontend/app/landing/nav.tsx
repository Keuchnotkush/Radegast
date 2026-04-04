"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const P = {
  dark: "#2A2A2A",
  white: "#FFFFFF",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Nav() {
  return (
    <>
      {/* LOGO */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="fixed top-6 left-8 z-40"
      >
        <Link href="/landing">
          <img src="/logo.svg" alt="Radegast" style={{ height: 22 }} />
        </Link>
      </motion.div>

      {/* NAV PILL */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease }}
        className="fixed top-4 right-8 z-40 flex items-center gap-6 px-6 py-3 rounded-full"
        style={{ background: "#F0EDE8", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <Link href="/landing" className="text-[13px] font-medium transition-opacity duration-300 hover:opacity-50" style={{ color: P.dark }}>Home</Link>
        <Link href="/how-it-works" className="text-[13px] font-medium transition-opacity duration-300 hover:opacity-50" style={{ color: P.dark }}>How it works</Link>
        <Link href="/verify" className="text-[13px] font-medium transition-opacity duration-300 hover:opacity-50" style={{ color: P.dark }}>Verify</Link>
        <Link
          href="/get-started"
          className="block px-5 py-2 rounded-full text-[12px] font-semibold uppercase tracking-wider transition-opacity duration-300 hover:opacity-80"
          style={{ background: P.dark, color: P.white }}
        >
          Get Started
        </Link>
      </motion.nav>
    </>
  );
}
