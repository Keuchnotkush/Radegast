/**
 * Upload data to 0G Storage (Galileo testnet).
 *
 * Usage:
 *   node og_storage_upload.mjs <json_string_or_filepath>
 *
 * Env:
 *   PRIVATE_KEY          — required, hex-prefixed
 *   OG_RPC               — default https://evmrpc-testnet.0g.ai
 *   OG_STORAGE_INDEXER   — default https://indexer-storage-testnet-turbo.0g.ai
 *
 * Outputs JSON on stdout: { "rootHash": "0x...", "txHash": "0x..." }
 * Errors go to stderr as JSON: { "error": "..." }
 */

// Redirect console.log to stderr so SDK noise doesn't pollute stdout
const originalLog = console.log;
console.log = (...args) => process.stderr.write(args.join(' ') + '\n');
const output = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');

import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import { readFileSync } from "fs";

const RPC_URL =
  process.env.OG_RPC || "https://evmrpc-testnet.0g.ai";
const INDEXER_RPC =
  process.env.OG_STORAGE_INDEXER ||
  "https://indexer-storage-testnet-turbo.0g.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error(JSON.stringify({ error: "PRIVATE_KEY not set" }));
  process.exit(1);
}

const input = process.argv[2];
if (!input) {
  console.error(
    JSON.stringify({ error: "Usage: node og_storage_upload.mjs <json_or_path>" })
  );
  process.exit(1);
}

let data;
try {
  // Try as file path first
  data = readFileSync(input);
} catch {
  // Treat as raw string
  data = new TextEncoder().encode(input);
}

try {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const indexer = new Indexer(INDEXER_RPC);

  const memData = new MemData(data);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr) {
    console.error(JSON.stringify({ error: `Merkle tree: ${treeErr}` }));
    process.exit(1);
  }

  const rootHash = tree.rootHash();
  const [tx, uploadErr] = await indexer.upload(memData, RPC_URL, signer);

  if (uploadErr) {
    console.error(JSON.stringify({ error: `Upload: ${uploadErr}` }));
    process.exit(1);
  }

  const result = {
    rootHash,
    txHash: tx?.txHash || tx?.txHashes?.[0] || null,
  };
  output(result);
} catch (err) {
  console.error(JSON.stringify({ error: err.message || String(err) }));
  process.exit(1);
}
