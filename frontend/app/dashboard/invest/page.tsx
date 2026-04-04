"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TradeModal, P, ease, spring } from "../shared";
import type { TradeStock } from "../shared";
import { usePortfolio, MARKET, STOCK_COLORS, logoUrl } from "../store";

const SECTORS = ["All", ...Array.from(new Set(MARKET.map((s) => s.sector)))];

export default function InvestPage() {
  const userName = "Kassim"; // TODO: from Dynamic auth
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const { getHolding } = usePortfolio();

  const filtered = MARKET.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.ticker.toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === "All" || s.sector === sector;
    return matchSearch && matchSector;
  });

  const selectedStock = selectedTicker ? MARKET.find((m) => m.ticker === selectedTicker) : null;
  const selectedHolding = selectedTicker ? getHolding(selectedTicker) : undefined;

  const tradeStock: TradeStock | null = selectedStock
    ? {
        symbol: selectedStock.ticker,
        name: selectedStock.name,
        price: selectedStock.price,
        change: selectedStock.change,
        color: STOCK_COLORS[selectedStock.ticker] || P.jade,
        held: selectedHolding?.shares,
        value: selectedHolding ? selectedStock.price * selectedHolding.shares : undefined,
      }
    : null;

  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.dark }}>
      <NavAvatar initial={userName.charAt(0).toUpperCase()} />

      <div className="w-full px-8 lg:px-16 xl:px-24 pt-20 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-12"
        >
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
            Invest in <span style={{ color: P.jade }}>what matters</span>.
          </h1>
          <p className="text-lg lg:text-xl mt-3" style={{ color: P.gray }}>
            Buy tokenized US stocks — fractional from $1, 24/7.
          </p>
        </motion.div>

        {/* Search + Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-10"
        >
          <div className="flex-1 relative w-full lg:max-w-md">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full py-3.5 pl-11 pr-4 rounded-full text-[14px] font-medium outline-none"
              style={{ background: P.surface, color: P.dark, border: `1.5px solid ${P.border}60` }}
              onFocus={(e) => (e.currentTarget.style.borderColor = P.jade)}
              onBlur={(e) => (e.currentTarget.style.borderColor = `${P.border}60`)}
            />
          </div>
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={spring}
            className="flex rounded-full p-1 shrink-0 overflow-x-auto origin-center"
            style={{ background: P.surface }}
          >
            {SECTORS.map((s) => (
              <motion.button
                key={s}
                onClick={() => setSector(s)}
                animate={{
                  background: sector === s ? P.dark : "transparent",
                  color: sector === s ? P.white : P.gray,
                }}
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.4, ease }}
                className="px-4 py-2.5 rounded-full text-[12px] font-semibold cursor-pointer whitespace-nowrap"
              >
                {s}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Stock grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((s, i) => (
            <StockCard key={s.ticker} stock={s} index={i} owned={!!getHolding(s.ticker)} onSelect={() => setSelectedTicker(s.ticker)} />
          ))}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-xl font-medium" style={{ color: P.gray }}>No stocks match your search.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {tradeStock && <TradeModal stock={tradeStock} onClose={() => setSelectedTicker(null)} />}
      </AnimatePresence>
    </div>
  );
}

function StockCard({ stock, index, owned, onSelect }: { stock: (typeof MARKET)[number]; index: number; owned: boolean; onSelect: () => void }) {
  const isUp = stock.change >= 0;
  const color = STOCK_COLORS[stock.ticker] || P.jade;
  return (
    <motion.button
      key={stock.ticker}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.4, ease }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onSelect}
      className="flex flex-col p-5 lg:p-6 rounded-2xl text-left cursor-pointer relative"
      style={{ background: P.surface, border: `1px solid ${P.border}30` }}
    >
      {/* Owned badge */}
      {owned && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${P.jade}18`, color: P.jade }}>
          Owned
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <StockIcon ticker={stock.ticker} name={stock.name} color={color} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate">{stock.name}</div>
          <div className="text-[11px]" style={{ color: P.gray }}>{stock.ticker} · {stock.sector}</div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="mb-3">
        <MiniChart color={color} trend={isUp ? "up" : "down"} />
      </div>

      <div className="flex items-end justify-between">
        <div className="text-xl font-bold">${stock.price.toFixed(2)}</div>
        <div
          className="text-[13px] font-semibold px-2.5 py-1 rounded-full"
          style={{ background: `${isUp ? P.gain : P.loss}12`, color: isUp ? P.gain : P.loss }}
        >
          {isUp ? "+" : ""}{stock.change.toFixed(2)}%
        </div>
      </div>
    </motion.button>
  );
}

function StockIcon({ ticker, name, color, size = 11 }: { ticker: string; name: string; color: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const cls = `w-${size} h-${size} rounded-xl shrink-0`;

  if (failed) {
    return (
      <div className={`rounded-xl flex items-center justify-center text-[13px] font-bold shrink-0`} style={{ width: size * 4, height: size * 4, background: color, color: P.white }}>
        {ticker.slice(0, 2)}
      </div>
    );
  }

  return (
    <img
      src={logoUrl(ticker)}
      alt={name}
      style={{ width: size * 4, height: size * 4, background: ticker === "AAPL" ? "#FFFFFF" : undefined, padding: ticker === "AAPL" ? 6 : undefined }}
      className="rounded-xl object-contain shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function MiniChart({ color, trend }: { color: string; trend: "up" | "down" }) {
  const pts = trend === "up"
    ? "0,28 20,24 40,26 60,18 80,20 100,12 120,14 140,6 160,8"
    : "0,8 20,12 40,10 60,18 80,16 100,22 120,20 140,26 160,24";
  const id = `invest-chart-${color.replace("#", "")}`;
  return (
    <svg width="100%" height="28" viewBox="0 0 160 32" preserveAspectRatio="none" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${pts} 160,32`} fill={`url(#${id})`} />
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
