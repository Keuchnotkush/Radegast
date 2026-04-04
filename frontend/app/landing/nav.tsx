"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const P = {
  dark: "#2A2A2A",
  gray: "#6B6B6B",
  white: "#FFFFFF",
  jade: "#38A88A",
  surface: "#F0EDE8",
  border: "#C4C4C4",
};

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
const spring = { type: "spring" as const, stiffness: 400, damping: 20 };

const links = [
  { href: "/landing", label: "Home" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/verify", label: "Verify" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Desktop — hover-expand pill (same as dashboard NavAvatar) */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="fixed top-4 right-8 z-40 hidden md:flex items-center rounded-full cursor-pointer"
        style={{ background: P.surface, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <motion.div
          animate={{
            maxWidth: open ? 520 : 0,
            paddingLeft: open ? 24 : 0,
            paddingRight: open ? 8 : 0,
            opacity: open ? 1 : 0,
          }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-6 overflow-hidden"
        >
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <motion.div key={l.href} whileHover={{ scale: 1.12 }} transition={spring} className="whitespace-nowrap">
                <Link href={l.href} className="text-[13px] font-medium" style={{ color: active ? P.dark : P.gray }}>
                  {l.label}
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
        <Link href="/get-started" className="p-[12px] shrink-0">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="get-started-btn px-[12px] py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-wider text-white whitespace-nowrap"
          >
            Get Started
          </motion.div>
        </Link>
      </motion.nav>

      {/* Mobile — bottom tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
        style={{ background: P.surface, borderTop: `1px solid ${P.border}30`, backdropFilter: "blur(20px)" }}
      >
        {[
          { href: "/landing", label: "Home", icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
          { href: "/how-it-works", label: "How", icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
          { href: "/verify", label: "Verify", icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
          { href: "/get-started", label: "Start", icon: (c: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> },
        ].map((t) => {
          const active = pathname === t.href;
          const color = active ? P.jade : P.gray;
          return (
            <Link key={t.href} href={t.href} className="flex flex-col items-center gap-1 px-3 py-1">
              {t.icon(color)}
              <span className="text-[12px] font-semibold" style={{ color }}>{t.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
