"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const P = {
  dark: "#2A2A2A",
  white: "#FFFFFF",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <motion.div whileHover={{ scale: 1.12 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
      <Link href={href} className="text-[13px] font-medium" style={{ color: P.dark }}>{children}</Link>
    </motion.div>
  );
}

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
        whileHover={{ scale: 1.06 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="fixed top-4 right-8 z-40 flex items-center gap-6 px-6 py-3 rounded-full origin-right"
        style={{ background: "#F0EDE8", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <NavLink href="/landing">Home</NavLink>
        <NavLink href="/how-it-works">How it works</NavLink>
        <NavLink href="/verify">Verify</NavLink>
        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Link
            href="/get-started"
            className="get-started-btn block px-5 py-2 rounded-full text-[12px] font-semibold uppercase tracking-wider text-white"
          >
            Get Started
          </Link>
        </motion.div>
      </motion.nav>
    </>
  );
}
