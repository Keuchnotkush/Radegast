/* ─── Viem client + 0G chain definition ─── */

import { createPublicClient, http, defineChain } from "viem";

export const ogTestnet = defineChain({
  id: 16600,
  name: "0G Newton Testnet",
  nativeCurrency: { name: "A0GI", symbol: "A0GI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
  blockExplorers: {
    default: { name: "0G Explorer", url: "https://chainscan-newton.0g.ai" },
  },
  testnet: true,
});

export const publicClient = createPublicClient({
  chain: ogTestnet,
  transport: http(),
});
