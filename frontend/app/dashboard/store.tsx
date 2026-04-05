"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useDynamicContext, useUserWallets, useTokenBalances } from "@dynamic-labs/sdk-react-core";

/* ─── Stock logo helper ─── */
const LOGO_TOKEN = "pk_PCBX5rd6QsqwX0zT-1bPCg";
const DOMAINS: Record<string, string> = {
  TSLA: "tesla.com", AAPL: "apple.com", NVDA: "nvidia.com", GOOGL: "google.com",
  AMZN: "amazon.com", META: "meta.com", SPY: "ssga.com", QQQ: "invesco.com",
  MSTR: "microstrategy.com", MSFT: "microsoft.com", JPM: "jpmorganchase.com",
  V: "visa.com", XOM: "exxonmobil.com", LLY: "lilly.com", "MC.PA": "lvmh.com",
};
export function logoUrl(ticker: string) {
  const domain = DOMAINS[ticker] || "example.com";
  return `https://img.logo.dev/${domain}?token=${LOGO_TOKEN}&retina=true`;
}

/* ─── Colors per ticker ─── */
export const STOCK_COLORS: Record<string, string> = {
  TSLA: "#45BA9A", NVDA: "#4B0082", AAPL: "#CC5A3A", META: "#C8A415",
  AMZN: "#B5506A", GOOGL: "#4285F4", SPY: "#38A88A", QQQ: "#7B68EE",
  MSTR: "#F7931A", MSFT: "#00A4EF", JPM: "#003A70", V: "#1A1F71",
  XOM: "#ED1C24", LLY: "#D52B1E", "MC.PA": "#8B6914",
};

/* ─── Market data (shared between invest + portfolio) ─── */
export interface MarketStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  sector: string;
}

export const MARKET: MarketStock[] = [
  { ticker: "TSLA", name: "Tesla", price: 360.59, change: -5.41, sector: "Auto" },
  { ticker: "AAPL", name: "Apple", price: 255.92, change: +0.11, sector: "Tech" },
  { ticker: "NVDA", name: "NVIDIA", price: 177.39, change: +0.93, sector: "Semis" },
  { ticker: "GOOGL", name: "Alphabet", price: 295.77, change: -0.55, sector: "Tech" },
  { ticker: "AMZN", name: "Amazon", price: 209.77, change: -0.38, sector: "E-commerce" },
  { ticker: "META", name: "Meta", price: 574.46, change: -0.82, sector: "Tech" },
  { ticker: "SPY", name: "S&P 500 ETF", price: 655.83, change: +0.09, sector: "Index" },
  { ticker: "QQQ", name: "Nasdaq 100 ETF", price: 584.98, change: +0.11, sector: "Index" },
  { ticker: "MSTR", name: "MicroStrategy", price: 119.83, change: -2.40, sector: "BTC" },
  { ticker: "MSFT", name: "Microsoft", price: 373.46, change: +1.11, sector: "Tech" },
  { ticker: "JPM", name: "JPMorgan", price: 294.60, change: -0.26, sector: "Finance" },
  { ticker: "V", name: "Visa", price: 300.80, change: +0.77, sector: "Finance" },
  { ticker: "XOM", name: "ExxonMobil", price: 160.69, change: -0.06, sector: "Energy" },
  { ticker: "LLY", name: "Eli Lilly", price: 935.58, change: -1.98, sector: "Pharma" },
  { ticker: "MC.PA", name: "LVMH", price: 471.05, change: -0.01, sector: "Luxury" },
];

/* ─── Live prices context ─── */
const LivePriceContext = createContext<{ prices: Record<string, number>; loading: boolean }>({ prices: {}, loading: false });

export function LivePriceProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const results = await Promise.allSettled(
        MARKET.map(async (s) => {
          const res = await fetch(`/api/chart?symbol=${encodeURIComponent(s.ticker)}&period=1D`);
          const json = await res.json();
          const arr: number[] = json?.prices ?? [];
          if (arr.length > 0) return { ticker: s.ticker, price: arr[arr.length - 1] };
          return null;
        })
      );
      const newPrices: Record<string, number> = {};
      for (const r of results) {
        if (r.status === "fulfilled" && r.value) {
          newPrices[r.value.ticker] = r.value.price;
        }
      }
      setPrices(newPrices);
    } catch {
      // keep stale prices
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return (
    <LivePriceContext.Provider value={{ prices, loading }}>
      {children}
    </LivePriceContext.Provider>
  );
}

export function useLivePrices() {
  return useContext(LivePriceContext);
}

export function useLiveMarket() {
  const { prices } = useLivePrices();
  return MARKET.map((s) => ({
    ...s,
    price: prices[s.ticker] ?? s.price,
  }));
}

/* ─── Holdings state (what the user owns) ─── */
export interface Holding {
  ticker: string;
  shares: number;
}

interface PortfolioCtx {
  holdings: Holding[];
  cash: number;
  buy: (ticker: string, usdAmount: number) => void;
  sell: (ticker: string, usdAmount: number) => void;
  addFunds: (usdAmount: number) => void;
  getHolding: (ticker: string) => Holding | undefined;
  totalValue: () => number;
  totalWithCash: () => number;
}

const PortfolioContext = createContext<PortfolioCtx | null>(null);

/* xStock symbol → frontend ticker */
const XSTOCK_TO_TICKER: Record<string, string> = {
  TSLAx: "TSLA", AAPLx: "AAPL", NVDAx: "NVDA", GOOGx: "GOOGL",
  AMZNx: "AMZN", METAx: "META", SPYx: "SPY", NDXx: "QQQ",
  MSTRx: "MSTR", MSFTx: "MSFT", JPMx: "JPM", Vx: "V",
  XOMx: "XOM", LLYx: "LLY", LVMHx: "MC.PA",
};

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [cash, setCash] = useState(0);
  const { primaryWallet } = useDynamicContext();
  const fetchedRef = useRef(false);

  // Fetch on-chain holdings when wallet is available
  useEffect(() => {
    const addr = primaryWallet?.address;
    if (fetchedRef.current) return;

    // Use wallet address, or fall back to deployer for demo
    const target = addr || "0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174";
    fetchedRef.current = true;

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/holdings/${target}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.holdings && data.holdings.length > 0) {
          setHoldings(
            data.holdings.map((h: { symbol: string; shares: number }) => ({
              ticker: XSTOCK_TO_TICKER[h.symbol] || h.symbol,
              shares: h.shares,
            }))
          );
        }
      })
      .catch(() => {});
  }, [primaryWallet]);

  const buy = useCallback((ticker: string, usdAmount: number) => {
    const stock = MARKET.find((s) => s.ticker === ticker);
    if (!stock || usdAmount <= 0) return;
    const newShares = usdAmount / stock.price;
    setCash((prev) => Math.max(0, prev - usdAmount));
    setHoldings((prev) => {
      const existing = prev.find((h) => h.ticker === ticker);
      if (existing) {
        return prev.map((h) => h.ticker === ticker ? { ...h, shares: h.shares + newShares } : h);
      }
      return [...prev, { ticker, shares: newShares }];
    });
  }, []);

  const sell = useCallback((ticker: string, usdAmount: number) => {
    const stock = MARKET.find((s) => s.ticker === ticker);
    if (!stock || usdAmount <= 0) return;
    const sharesToSell = usdAmount / stock.price;
    setCash((prev) => prev + usdAmount);
    setHoldings((prev) =>
      prev
        .map((h) => h.ticker === ticker ? { ...h, shares: Math.max(0, h.shares - sharesToSell) } : h)
        .filter((h) => h.shares > 0.0001)
    );
  }, []);

  const addFunds = useCallback((usdAmount: number) => {
    if (usdAmount <= 0) return;
    setCash((prev) => prev + usdAmount);
  }, []);

  const getHolding = useCallback((ticker: string) => holdings.find((h) => h.ticker === ticker), [holdings]);

  const totalValue = useCallback(() => {
    return holdings.reduce((sum, h) => {
      const stock = MARKET.find((s) => s.ticker === h.ticker);
      return sum + (stock ? stock.price * h.shares : 0);
    }, 0);
  }, [holdings]);

  const totalWithCash = useCallback(() => {
    return totalValue() + cash;
  }, [totalValue, cash]);

  return (
    <PortfolioContext.Provider value={{ holdings, cash, buy, sell, addFunds, getHolding, totalValue, totalWithCash }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be inside PortfolioProvider");
  return ctx;
}

/* ─── Settings store (AI suggestions + autonomous trading) ─── */
export type AutoDuration = "1h" | "24h" | "7d" | "30d";
export const AUTO_DURATIONS: { key: AutoDuration; label: string; ms: number }[] = [
  { key: "1h", label: "1 hour", ms: 3600_000 },
  { key: "24h", label: "24 hours", ms: 86400_000 },
  { key: "7d", label: "7 days", ms: 604800_000 },
  { key: "30d", label: "30 days", ms: 2592000_000 },
];

export interface AutoSession {
  active: boolean;
  duration: AutoDuration;
  dailyLimit: number;      // USD
  spentToday: number;      // USD
  tradesCount: number;
  activatedAt: number;     // timestamp
  expiresAt: number;       // timestamp
  notifications: boolean;
}

const EMPTY_SESSION: AutoSession = {
  active: false,
  duration: "24h",
  dailyLimit: 500,
  spentToday: 0,
  tradesCount: 0,
  activatedAt: 0,
  expiresAt: 0,
  notifications: true,
};

interface SettingsCtx {
  aiSuggestions: boolean;
  setAiSuggestions: (v: boolean) => void;
  autoSession: AutoSession;
  activateAuto: (duration: AutoDuration, dailyLimit: number) => void;
  revokeAuto: () => void;
  setAutoNotifications: (v: boolean) => void;
}

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [aiSuggestions, setAiSuggestions] = useState(true);
  const [autoSession, setAutoSession] = useState<AutoSession>(EMPTY_SESSION);

  const activateAuto = useCallback((duration: AutoDuration, dailyLimit: number) => {
    const dur = AUTO_DURATIONS.find((d) => d.key === duration)!;
    const now = Date.now();
    setAutoSession({
      active: true,
      duration,
      dailyLimit,
      spentToday: 0,
      tradesCount: 0,
      activatedAt: now,
      expiresAt: now + dur.ms,
      notifications: true,
    });
    // Register user for autonomous trading in AI service
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/profile/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "default", mode: "trade" }),
    }).catch(() => {});
  }, []);

  const revokeAuto = useCallback(() => {
    setAutoSession((prev) => ({ ...EMPTY_SESSION, notifications: prev.notifications }));
    // Switch back to conseil mode in AI service
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/profile/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: "default", mode: "conseil" }),
    }).catch(() => {});
  }, []);

  const setAutoNotifications = useCallback((v: boolean) => {
    setAutoSession((prev) => ({ ...prev, notifications: v }));
  }, []);

  return (
    <SettingsContext.Provider value={{ aiSuggestions, setAiSuggestions, autoSession, activateAuto, revokeAuto, setAutoNotifications }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be inside SettingsProvider");
  return ctx;
}

/* ─── Shared constants ─── */
export const PROFILES = [
  { key: "conservative", label: "Conservative", desc: "Steady growth, lower risk. Blue-chips, bonds." },
  { key: "moderate", label: "Moderate", desc: "Balanced risk and return. Diversified mix." },
  { key: "growth", label: "Growth", desc: "Higher returns, tech-heavy, momentum-driven." },
  { key: "aggressive", label: "Aggressive", desc: "Maximum growth potential. Concentrated bets." },
] as const;

export const PROFILE_LABELS = PROFILES.map((p) => p.label);

/* ─── User hook (Dynamic → localStorage → default) ─── */
export function useUser() {
  const { user } = useDynamicContext();
  const [storedName, setStoredName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("radegast_firstName");
    if (name) setStoredName(name);
  }, []);

  return useMemo(() => {
    const firstName = user?.firstName || storedName || "Investor";
    return {
      firstName,
      lastName: user?.lastName || "",
      email: user?.email || "",
      initial: firstName.charAt(0).toUpperCase(),
    };
  }, [user, storedName]);
}

/* ─── Wallet hook (Dynamic embedded wallet + token balances) ─── */
interface WalletCtx {
  address: string | undefined;
  usdcBalance: number;
  isLoadingBalance: boolean;
  refreshBalance: () => Promise<void>;
  primaryWallet: ReturnType<typeof useUserWallets>[number] | undefined;
}

const WalletContext = createContext<WalletCtx>({
  address: undefined,
  usdcBalance: 0,
  isLoadingBalance: false,
  refreshBalance: async () => {},
  primaryWallet: undefined,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const userWallets = useUserWallets();
  const primaryWallet = userWallets?.[0];
  const address = primaryWallet?.address;

  const { tokenBalances, isLoading: isLoadingBalance, fetchAccountBalances } = useTokenBalances({
    accountAddress: address,
    includeFiat: true,
    includeNativeBalance: true,
  });

  // Extract USDC balance (or native balance as fallback for testnet)
  const usdcBalance = useMemo(() => {
    if (!tokenBalances || tokenBalances.length === 0) return 0;
    // Look for USDC first
    const usdc = tokenBalances.find(
      (t) => t.symbol?.toUpperCase() === "USDC" || t.name?.toUpperCase() === "USDC"
    );
    if (usdc?.balance != null) return Number(usdc.balance);
    // Fallback: sum all balances
    const total = tokenBalances.reduce((sum, t) => {
      return sum + (t.balance != null ? Number(t.balance) : 0);
    }, 0);
    return total;
  }, [tokenBalances]);

  const refreshBalance = useCallback(async () => {
    await fetchAccountBalances(true);
  }, [fetchAccountBalances]);

  const value = useMemo(
    () => ({ address, usdcBalance, isLoadingBalance, refreshBalance, primaryWallet }),
    [address, usdcBalance, isLoadingBalance, refreshBalance, primaryWallet]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
