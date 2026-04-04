/* ─── Contract addresses per chain ───
 *
 * After running `make deploy-og`, paste the deployed addresses here.
 * The deploy script logs them to console.
 *
 * Ticker keys match the MARKET array in dashboard/store.tsx
 */

import type { Address } from "viem";

export interface DeployedAddresses {
  xStocks: Record<string, Address>;
  consensusSettlement: Address;
  proofOfSolvency: Address;
}

/* ─── 0G Testnet (chain 16600) ─── */
export const OG_TESTNET: DeployedAddresses = {
  xStocks: {
    // After deploy, fill in:
    // TSLAx: "0x...",
    // AAPLx: "0x...",
    // NVDAx: "0x...",
    // GOOGx: "0x...",
    // AMZNx: "0x...",
    // METAx: "0x...",
    // SPYx:  "0x...",
    // NDXx:  "0x...",
    // MSTRx: "0x...",
    // MSFTx: "0x...",
    // JPMx:  "0x...",
    // Vx:    "0x...",
    // XOMx:  "0x...",
    // LLYx:  "0x...",
    // LVMHx: "0x...",
  },
  consensusSettlement: "0x0000000000000000000000000000000000000000",
  proofOfSolvency: "0x0000000000000000000000000000000000000000",
};

/* ─── Local Anvil (chain 31337) ─── */
export const LOCAL: DeployedAddresses = {
  xStocks: {},
  consensusSettlement: "0x0000000000000000000000000000000000000000",
  proofOfSolvency: "0x0000000000000000000000000000000000000000",
};

/* ─── Ticker symbol → xStock symbol mapping ───
 *  Frontend uses "TSLA", contracts use "TSLAx"
 */
export const TICKER_TO_XSTOCK: Record<string, string> = {
  TSLA: "TSLAx", AAPL: "AAPLx", NVDA: "NVDAx", GOOGL: "GOOGx",
  AMZN: "AMZNx", META: "METAx", SPY: "SPYx", QQQ: "NDXx",
  MSTR: "MSTRx", MSFT: "MSFTx", JPM: "JPMx", V: "Vx",
  XOM: "XOMx", LLY: "LLYx", "MC.PA": "LVMHx",
};
