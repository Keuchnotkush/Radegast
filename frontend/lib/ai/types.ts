export const TICKERS = [
  "TSLA", "AAPL", "NVDA", "GOOGL", "AMZN",
  "META", "SPY", "QQQ", "MSTR", "MSFT",
  "JPM", "V", "XOM", "LLY", "MC.PA"
] as const;

export const XSTOCK_SYMBOLS = [
  "TSLAx", "AAPLx", "NVDAx", "GOOGx", "AMZNx",
  "METAx", "SPYx", "NDXx", "MSTRx", "MSFTx",
  "JPMx", "Vx", "XOMx", "LLYx", "LVMHx"
] as const;

export const N_FEATURES = 61; // 4 × 15 + 1

export type RiskLabel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskOutput {
  risk_score: number;       // 0-100
  risk_label: RiskLabel;
  top_factors: string[];
  source: string;           // "xgboost" | "local_fallback" | "rules"
}

export interface PortfolioPositions {
  [token: string]: number;  // e.g. { "TSLAx": 35.0 }
}
