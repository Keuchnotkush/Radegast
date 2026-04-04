"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NavAvatar, SectionTitle, TradeModal, P, ease, spring } from "../shared";
import type { TradeStock } from "../shared";
import { usePortfolio, MARKET, STOCK_COLORS, logoUrl, useLiveMarket, useUser } from "../store";

const SECTORS = ["All", ...Array.from(new Set(MARKET.map((s) => s.sector)))];

type SortKey = "default" | "change" | "price" | "name";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Popular" },
  { key: "change", label: "Performance" },
  { key: "price", label: "Price" },
  { key: "name", label: "A → Z" },
];

export default function InvestPage() {
  const { firstName: userName, initial } = useUser();
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [sort, setSort] = useState<SortKey>("default");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const { getHolding, cash } = usePortfolio();
  const liveMarket = useLiveMarket();

  // Top movers — top 3 gainers + top 3 losers
  const topMovers = useMemo(() => {
    const sorted = [...liveMarket].sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    return sorted.slice(0, 6);
  }, [liveMarket]);

  // Filter + sort
  const filtered = useMemo(() => {
    let list = liveMarket.filter((s) => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.ticker.toLowerCase().includes(search.toLowerCase());
      const matchSector = sector === "All" || s.sector === sector;
      return matchSearch && matchSector;
    });

    if (sort === "change") list = [...list].sort((a, b) => b.change - a.change);
    else if (sort === "price") list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    return list;
  }, [liveMarket, search, sector, sort]);

  const selectedStock = selectedTicker ? liveMarket.find((m) => m.ticker === selectedTicker) : null;
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
      <NavAvatar initial={initial} />

      <div className="w-full max-w-[1440px] mx-auto px-5 md:px-16 pt-20 pb-16">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mb-6"
        >
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Invest in <span style={{ color: P.jade }}>what matters</span>.
          </h1>
          <p className="text-lg mt-3" style={{ color: P.gray }}>
            Buy tokenized US stocks — fractional from $1, 24/7.
          </p>
        </motion.div>

        {/* Available cash pill */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.4, ease }}
          className="mb-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold" style={{ background: P.surface, color: P.dark }}>
            <span className="w-2 h-2 rounded-full" style={{ background: P.jade }} />
            ${cash.toLocaleString("en-US", { minimumFractionDigits: 2 })} available
          </span>
        </motion.div>

        {/* ═══ TOP MOVERS ═══ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5, ease }}
          className="mb-12"
        >
          <SectionTitle>Top movers today</SectionTitle>
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 -mx-1 px-1">
            {topMovers.map((s, i) => {
              const isUp = s.change >= 0;
              const color = STOCK_COLORS[s.ticker] || P.jade;
              return (
                <motion.button
                  key={s.ticker}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease }}
                  whileHover={{ scale: 1.04, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedTicker(s.ticker)}
                  className="flex items-center gap-3 py-3 px-4 rounded-2xl shrink-0 cursor-pointer text-left"
                  style={{ background: P.surface, border: `1px solid ${P.border}20`, minWidth: 180 }}
                >
                  <MoverLogo ticker={s.ticker} name={s.name} color={color} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{s.ticker}</div>
                    <div className="text-[11px]" style={{ color: P.gray }}>${s.price.toFixed(2)}</div>
                  </div>
                  <div
                    className="text-[13px] font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: `${isUp ? P.gain : P.loss}12`, color: isUp ? P.gain : P.loss }}
                  >
                    {isUp ? "+" : ""}{s.change.toFixed(2)}%
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* ═══ SEARCH + FILTERS + SORT ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease }}
          className="flex flex-col gap-4 mb-6"
        >
          {/* Search */}
          <div className="relative w-full md:max-w-md">
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

          {/* Sectors + Sort row */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div
              className="flex rounded-full p-1 overflow-x-auto w-full md:w-auto shrink-0"
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
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.3, ease }}
                  className="px-4 py-2 rounded-full text-[12px] font-semibold cursor-pointer whitespace-nowrap outline-none"
                >
                  {s}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto">
              {SORT_OPTIONS.map((o) => (
                <motion.button
                  key={o.key}
                  onClick={() => setSort(o.key)}
                  animate={{
                    background: sort === o.key ? `${P.jade}15` : "transparent",
                    color: sort === o.key ? P.jade : P.gray,
                  }}
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.25 }}
                  className="px-3.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap outline-none"
                  style={{ border: `1px solid ${sort === o.key ? `${P.jade}30` : "transparent"}` }}
                >
                  {o.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Result count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[12px] font-medium" style={{ color: P.gray }}>
            {filtered.length} {filtered.length === 1 ? "stock" : "stocks"}{sector !== "All" ? ` in ${sector}` : ""}
          </span>
        </div>

        {/* ═══ STOCK GRID ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
        >
          {filtered.map((s, i) => {
            const holding = getHolding(s.ticker);
            return (
              <StockCard
                key={s.ticker}
                stock={s}
                index={i}
                holding={holding}
                onSelect={() => setSelectedTicker(s.ticker)}
              />
            );
          })}
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <p className="text-xl font-medium" style={{ color: P.gray }}>No stocks match your search.</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => { setSearch(""); setSector("All"); }}
              className="mt-4 text-[13px] font-semibold cursor-pointer"
              style={{ color: P.jade }}
            >
              Clear filters
            </motion.button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {tradeStock && <TradeModal stock={tradeStock} onClose={() => setSelectedTicker(null)} />}
      </AnimatePresence>
    </div>
  );
}

/* ═══ STOCK CARD ═══ */

function StockCard({ stock, index, holding, onSelect }: {
  stock: (typeof MARKET)[number];
  index: number;
  holding?: { ticker: string; shares: number };
  onSelect: () => void;
}) {
  const isUp = stock.change >= 0;
  const color = STOCK_COLORS[stock.ticker] || P.jade;
  const holdingValue = holding ? holding.shares * stock.price : 0;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.03 * index, duration: 0.4, ease }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onSelect}
      className="flex flex-col p-4 md:p-5 rounded-2xl text-left cursor-pointer relative"
      style={{ background: P.surface, border: `1px solid ${P.border}25` }}
    >
      {/* Owned badge with value */}
      {holding && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold" style={{ background: `${P.jade}12`, color: P.jade }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: P.jade }} />
          ${holdingValue.toFixed(0)}
        </div>
      )}

      {/* Logo + name */}
      <div className="flex items-center gap-3 mb-3">
        <StockLogo ticker={stock.ticker} name={stock.name} color={color} />
        <div className="flex-1 min-w-0">
          <div className="text-[14px] md:text-[15px] font-semibold truncate">{stock.name}</div>
          <div className="text-[10px] md:text-[11px] font-medium" style={{ color: P.gray }}>{stock.ticker}</div>
        </div>
      </div>

      {/* Mini chart */}
      <div className="mb-3">
        <MiniChart color={color} trend={isUp ? "up" : "down"} />
      </div>

      {/* Price + change */}
      <div className="flex items-end justify-between">
        <div className="text-lg md:text-xl font-bold">${stock.price.toFixed(2)}</div>
        <div
          className="text-[12px] md:text-[13px] font-semibold px-2 py-0.5 rounded-lg"
          style={{ background: `${isUp ? P.gain : P.loss}10`, color: isUp ? P.gain : P.loss }}
        >
          {isUp ? "+" : ""}{stock.change.toFixed(2)}%
        </div>
      </div>

      {/* Sector tag */}
      <div className="mt-2.5">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{ background: `${color}08`, color: P.gray }}>
          {stock.sector}
        </span>
      </div>
    </motion.button>
  );
}

/* ═══ SUB-COMPONENTS ═══ */

function StockLogo({ ticker, name, color }: { ticker: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: color, color: P.white }}>
        {ticker.slice(0, 2)}
      </div>
    );
  }
  return (
    <img
      src={logoUrl(ticker)}
      alt={name}
      className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-contain shrink-0"
      style={{ background: ticker === "AAPL" ? "#FFFFFF" : undefined, padding: ticker === "AAPL" ? 5 : undefined }}
      onError={() => setFailed(true)}
    />
  );
}

function MoverLogo({ ticker, name, color }: { ticker: string; name: string; color: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0" style={{ background: color, color: P.white }}>
        {ticker.slice(0, 2)}
      </div>
    );
  }
  return (
    <img
      src={logoUrl(ticker)}
      alt={name}
      className="w-9 h-9 rounded-lg object-contain shrink-0"
      style={{ background: ticker === "AAPL" ? "#FFFFFF" : undefined, padding: ticker === "AAPL" ? 4 : undefined }}
      onError={() => setFailed(true)}
    />
  );
}

function MiniChart({ color, trend }: { color: string; trend: "up" | "down" }) {
  const pts = trend === "up"
    ? "0,28 20,24 40,26 60,18 80,20 100,12 120,14 140,6 160,8"
    : "0,8 20,12 40,10 60,18 80,16 100,22 120,20 140,26 160,24";
  const id = `invest-chart-${color.replace("#", "")}-${trend}`;
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
