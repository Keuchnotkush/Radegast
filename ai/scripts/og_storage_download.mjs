/**
 * Download data from 0G Storage by root hash.
 *
 * Usage:
 *   node og_storage_download.mjs <rootHash> <outputPath>
 *
 * Env:
 *   OG_STORAGE_INDEXER   — default https://indexer-storage-testnet-turbo.0g.ai
 *   OG_RPC               — default https://evmrpc-testnet.0g.ai
 *
 * Example:
 *   node og_storage_download.mjs 0xf143fe1a...b179 ../shared/model/portfolio_risk.onnx
 */

// Redirect console.log to stderr so SDK noise doesn't pollute stdout
const originalLog = console.log;
console.log = (...args) => process.stderr.write(args.join(' ') + '\n');

import { Indexer } from "@0gfoundation/0g-ts-sdk";
import { writeFileSync } from "fs";

const INDEXER_RPC =
  process.env.OG_STORAGE_INDEXER ||
  "https://indexer-storage-testnet-turbo.0g.ai";
const RPC_URL =
  process.env.OG_RPC || "https://evmrpc-testnet.0g.ai";

const rootHash = process.argv[2];
const outputPath = process.argv[3];

if (!rootHash || !outputPath) {
  console.error("Usage: node og_storage_download.mjs <rootHash> <outputPath>");
  process.exit(1);
}

import { resolve } from "path";

const absPath = resolve(outputPath);

try {
  const indexer = new Indexer(INDEXER_RPC);

  // SDK signature: download(rootHash, filePath, proof?)
  const err = await indexer.download(rootHash, absPath, false);

  if (err instanceof Error) {
    console.error(`Download failed: ${err.message}`);
    process.exit(1);
  }

  originalLog(`Downloaded to ${absPath}`);
} catch (err) {
  console.error(`Error: ${err.message || String(err)}`);
  process.exit(1);
}
