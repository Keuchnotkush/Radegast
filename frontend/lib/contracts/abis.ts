/* ─── Minimal ABIs — only the functions the frontend actually calls ─── */

export const xStockAbi = [
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "name", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
  { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "price", inputs: [], outputs: [{ type: "uint192" }], stateMutability: "view" },
  { type: "function", name: "priceUpdatedAt", inputs: [], outputs: [{ type: "uint64" }], stateMutability: "view" },
  { type: "function", name: "valueOf", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const;

export const proofOfSolvencyAbi = [
  {
    type: "function", name: "verify",
    inputs: [{ name: "proof", type: "bytes" }, { name: "pub", type: "bytes32[]" }],
    outputs: [{ name: "id", type: "uint256" }, { name: "vid", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "check",
    inputs: [{ name: "vid", type: "bytes32" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "user", type: "address" },
        { name: "threshold", type: "uint64" },
        { name: "verifiedAt", type: "uint32" },
        { name: "commitment", type: "bytes32" },
        { name: "verifyId", type: "bytes32" },
      ],
    }],
    stateMutability: "view",
  },
  { type: "function", name: "verifier", inputs: [], outputs: [{ type: "address" }], stateMutability: "view" },
] as const;

export const consensusSettlementAbi = [
  {
    type: "function", name: "latestOf",
    inputs: [{ name: "u", type: "address" }],
    outputs: [
      {
        name: "r", type: "tuple",
        components: [
          { name: "user", type: "address" },
          { name: "score", type: "uint16" },
          { name: "confidence", type: "uint16" },
          { name: "label", type: "uint8" },
          { name: "agreed", type: "uint8" },
          { name: "total", type: "uint8" },
          { name: "daHash", type: "bytes32" },
        ],
      },
      { name: "id", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function", name: "verifyDA",
    inputs: [{ name: "id", type: "uint256" }, { name: "e", type: "bytes32" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
] as const;
