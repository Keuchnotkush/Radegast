"use client";

import { useState, useCallback } from "react";

interface ConsensusRequest {
  user: string;
  positions: Record<string, number>;
  strategy: string;
  mode: "conseil" | "trade";
}

interface ConsensusResult {
  consensus_label: "LOW" | "MEDIUM" | "HIGH";
  consensus_score: number;
  confidence: number;
  providers_agreed: string;
  suggestions: string[];
  moves: Array<{ token: string; action: string; pct: number }>;
  trade_results?: Array<{ token: string; action: string; pct: number; tx_hash: string; success: boolean }>;
  tx_hash: string | null;
  da_hash: string | null;
}

interface ChatResponse {
  reply: string;
  consensus: ConsensusResult | null;
  action: string;
}

interface PricesResponse {
  prices: Record<string, number>;
  source: string;
  count: number;
}

export type { ConsensusRequest, ConsensusResult, ChatResponse, PricesResponse };

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runConsensus = useCallback(async (req: ConsensusRequest): Promise<ConsensusResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const chat = useCallback(async (userId: string, message: string, positions?: Record<string, number>): Promise<ChatResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, message, positions }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPrices = useCallback(async (): Promise<PricesResponse | null> => {
    try {
      const res = await fetch("/api/prices");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, []);

  const getProfile = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`/api/profile/${userId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (data: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
      return null;
    }
  }, []);

  return { runConsensus, chat, getPrices, getProfile, updateProfile, loading, error };
}
