/* ─── Contract hooks — drop-in replacements for setTimeout mocks ───
 *
 * Usage in Kassim's pages:
 *   import { useXStockBalances, useProofCheck } from "@/lib/contracts/hooks";
 *
 * These are READ-ONLY hooks (publicClient). Write operations (mint, verify)
 * will go through Dynamic's embedded wallet signer when we wire that up.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { formatUnits, type Address } from "viem";
import { publicClient } from "./client";
import { xStockAbi, proofOfSolvencyAbi, consensusSettlementAbi } from "./abis";
import { OG_TESTNET, TICKER_TO_XSTOCK } from "./addresses";

/* ─── xStock balances for a wallet ─── */

export interface OnChainHolding {
  ticker: string;       // frontend ticker (TSLA)
  xSymbol: string;      // contract symbol (TSLAx)
  balance: bigint;      // raw 18-decimal balance
  shares: number;       // human-readable (balance / 1e18)
  priceUsd: number;     // on-chain price (price / 1e6)
  valueUsd: number;     // shares * priceUsd
}

export function useXStockBalances(walletAddress: Address | undefined) {
  const [holdings, setHoldings] = useState<OnChainHolding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!walletAddress) return;
    const addresses = OG_TESTNET.xStocks;
    const entries = Object.entries(addresses);
    if (entries.length === 0) return; // no contracts deployed yet

    setLoading(true);
    setError(null);
    try {
      const results = await Promise.all(
        entries.map(async ([xSymbol, contractAddr]) => {
          const [balance, price] = await Promise.all([
            publicClient.readContract({
              address: contractAddr,
              abi: xStockAbi,
              functionName: "balanceOf",
              args: [walletAddress],
            }),
            publicClient.readContract({
              address: contractAddr,
              abi: xStockAbi,
              functionName: "price",
            }),
          ]);
          // find frontend ticker from xSymbol
          const ticker = Object.entries(TICKER_TO_XSTOCK).find(([, v]) => v === xSymbol)?.[0] ?? xSymbol;
          const shares = Number(formatUnits(balance as bigint, 18));
          const priceUsd = Number(price as bigint) / 1e6;
          return { ticker, xSymbol, balance: balance as bigint, shares, priceUsd, valueUsd: shares * priceUsd };
        })
      );
      setHoldings(results.filter((h) => h.shares > 0.0001));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to read balances");
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { holdings, loading, error, refetch: fetch_ };
}

/* ─── Proof of Solvency check (verify page) ─── */

export interface ProofAttestation {
  user: Address;
  threshold: number;     // USD
  verifiedAt: number;    // unix timestamp
  commitment: `0x${string}`;
  verifyId: `0x${string}`;
}

export function useProofCheck(verifyId: `0x${string}` | undefined) {
  const [attestation, setAttestation] = useState<ProofAttestation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async (vid?: `0x${string}`) => {
    const id = vid ?? verifyId;
    if (!id) return;
    const posAddr = OG_TESTNET.proofOfSolvency;
    if (posAddr === "0x0000000000000000000000000000000000000000") {
      setError("ProofOfSolvency not deployed yet");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await publicClient.readContract({
        address: posAddr,
        abi: proofOfSolvencyAbi,
        functionName: "check",
        args: [id],
      });
      const r = result as { user: Address; threshold: bigint; verifiedAt: number; commitment: `0x${string}`; verifyId: `0x${string}` };
      setAttestation({
        user: r.user,
        threshold: Number(r.threshold),
        verifiedAt: r.verifiedAt,
        commitment: r.commitment,
        verifyId: r.verifyId,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Proof not found");
      setAttestation(null);
    } finally {
      setLoading(false);
    }
  }, [verifyId]);

  useEffect(() => { if (verifyId) check(); }, [verifyId, check]);

  return { attestation, loading, error, check };
}

/* ─── AI Consensus latest record for a user ─── */

export interface ConsensusRecord {
  score: number;         // 0-10000
  confidence: number;    // 0-10000
  label: number;         // 0=hold, 1=buy, 2=sell
  agreed: number;        // how many models agreed
  total: number;         // total models
  daHash: `0x${string}`;
}

export function useLatestConsensus(userAddress: Address | undefined) {
  const [record, setRecord] = useState<ConsensusRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userAddress) return;
    const csAddr = OG_TESTNET.consensusSettlement;
    if (csAddr === "0x0000000000000000000000000000000000000000") return;

    setLoading(true);
    publicClient.readContract({
      address: csAddr,
      abi: consensusSettlementAbi,
      functionName: "latestOf",
      args: [userAddress],
    }).then((result) => {
      const [r] = result as readonly [{ score: number; confidence: number; label: number; agreed: number; total: number; daHash: `0x${string}` }, bigint];
      setRecord({
        score: r.score,
        confidence: r.confidence,
        label: r.label,
        agreed: r.agreed,
        total: r.total,
        daHash: r.daHash,
      });
    }).catch(() => {
      // no records yet — expected for new users
      setRecord(null);
    }).finally(() => setLoading(false));
  }, [userAddress]);

  return { record, loading };
}
