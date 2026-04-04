"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, P, ease, spring } from "../shared";
import { useUser, usePortfolio, MARKET, useLiveMarket } from "../store";
import { useAI } from "@/lib/hooks/useAI";

/* ─── Ticker → xStock symbol mapping ─── */
const TICKER_TO_XSTOCK: Record<string, string> = {
  TSLA: "TSLAx", AAPL: "AAPLx", NVDA: "NVDAx", GOOGL: "GOOGx",
  AMZN: "AMZNx", META: "METAx", SPY: "SPYx", QQQ: "NDXx",
  MSTR: "MSTRx", MSFT: "MSFTx", JPM: "JPMx", V: "Vx",
  XOM: "XOMx", LLY: "LLYx", "MC.PA": "LVMHx",
};

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

const SUGGESTIONS = [
  "How is my portfolio doing?",
  "Should I sell Tesla?",
  "What stocks should I buy?",
  "Explain my risk level",
  "Rebalance my portfolio",
];

export default function ChatPage() {
  const { firstName, initial } = useUser();
  const { holdings, totalValue } = usePortfolio();
  const liveMarket = useLiveMarket();
  const { chat, loading } = useAI();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  // Build positions for AI context
  const buildPositions = useCallback((): Record<string, number> => {
    const total = totalValue();
    if (total === 0) return {};
    const positions: Record<string, number> = {};
    for (const h of holdings) {
      const stock = MARKET.find((s) => s.ticker === h.ticker);
      if (!stock) continue;
      const xSymbol = TICKER_TO_XSTOCK[h.ticker];
      if (!xSymbol) continue;
      const market = liveMarket.find((m) => m.ticker === h.ticker);
      const price = market?.price ?? stock.price;
      positions[xSymbol] = (price * h.shares / total) * 100;
    }
    return positions;
  }, [holdings, totalValue, liveMarket]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    const positions = buildPositions();
    const result = await chat("frontend_user", text.trim(), Object.keys(positions).length > 0 ? positions : undefined);

    const aiMsg: Message = {
      id: `a-${Date.now()}`,
      role: "ai",
      text: result?.reply || "I'm having trouble connecting to the AI service. Please try again in a moment.",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
  }, [loading, chat, buildPositions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={initial} />

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 md:px-0 pt-20 pb-4">
        <div className="w-full max-w-2xl mx-auto">

          {/* Empty state */}
          {isEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease }}
              className="flex flex-col items-center text-center pt-16 md:pt-24"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, ...spring }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: `${P.jade}12` }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </motion.div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Hey {firstName}. <span style={{ color: P.jade }}>Ask me anything.</span>
              </h1>
              <p className="text-[15px] max-w-md" style={{ color: P.gray }}>
                I know your portfolio, the markets, and your strategy. Ask about your stocks, get trade ideas, or just learn.
              </p>

              {/* Suggestion pills */}
              <div className="flex flex-wrap justify-center gap-2 mt-8 max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.3, ease }}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => send(s)}
                    className="px-4 py-2.5 rounded-full text-[13px] font-medium cursor-pointer"
                    style={{ background: P.surface, color: P.dark, border: `1px solid ${P.border}30` }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Message list */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} mb-4`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mr-3 mt-1"
                    style={{ background: `${P.jade}15` }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-5 py-3.5 rounded-2xl text-[14px] leading-relaxed ${
                    msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"
                  }`}
                  style={{
                    background: msg.role === "user" ? P.dark : P.surface,
                    color: msg.role === "user" ? P.white : P.dark,
                    border: msg.role === "ai" ? `1px solid ${P.border}30` : undefined,
                  }}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${P.jade}15` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={P.jade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div className="flex gap-1.5 px-5 py-4 rounded-2xl rounded-bl-md" style={{ background: P.surface, border: `1px solid ${P.border}30` }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    className="w-2 h-2 rounded-full"
                    style={{ background: P.jade }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input bar — fixed bottom */}
      <div className="sticky bottom-0 pb-safe" style={{ background: P.bg }}>
        <div className="w-full max-w-2xl mx-auto px-5 md:px-0 py-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your portfolio..."
                disabled={loading}
                className="w-full py-4 pl-5 pr-14 rounded-2xl text-[15px] font-medium outline-none"
                style={{
                  background: P.surface,
                  color: P.dark,
                  border: `1.5px solid ${P.border}30`,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
                onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}30`)}
              />
              <motion.button
                type="submit"
                disabled={!input.trim() || loading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={spring}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
                style={{
                  background: input.trim() ? P.jade : `${P.border}30`,
                  color: input.trim() ? P.white : P.gray,
                  transition: "background 0.2s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
