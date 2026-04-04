# claude-06-fallback.md — Browser Fallbacks (TypeScript)

## What this file creates
```
ai/fallback/
├── onnx_inference.ts      # ONNX.js browser fallback (WASM)
└── rules.ts               # Last resort: hardcoded rules

# These files go in the FRONTEND repo, not the Python backend.
# Kassim integrates them. But YOU write the logic.
# Final location: frontend/lib/ai/onnx_inference.ts
#                 frontend/lib/ai/rules.ts
```

## Dependencies
```
npm install onnxruntime-web
```
The model file `portfolio_risk.onnx` must be in `frontend/public/model/portfolio_risk.onnx`.

## When these are used
- `onnx_inference.ts` → when the FastAPI server is down (35-40% chance)
- `rules.ts` → when EVEN ONNX.js fails (5-10% chance, e.g. WASM not supported)
- The fallback chain: FastAPI → ONNX.js browser → rules.ts
- **The response format is IDENTICAL in all cases.** The frontend never knows which path was taken.

---

## Shared Types (TypeScript version of shared/types.py)

```typescript
// frontend/lib/ai/types.ts

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
```

---

## File 1: `frontend/lib/ai/onnx_inference.ts`

### Purpose
Run the ONNX model directly in the browser via WebAssembly. Returns the exact same RiskOutput as the server.

```typescript
// frontend/lib/ai/onnx_inference.ts

import * as ort from "onnxruntime-web";
import { N_FEATURES, TICKERS, RiskOutput } from "./types";

let session: ort.InferenceSession | null = null;

/**
 * Load the ONNX model from /public/model/portfolio_risk.onnx
 * Call this once at app startup.
 */
export async function loadModel(): Promise<boolean> {
  try {
    // Use WASM backend (works in all modern browsers)
    ort.env.wasm.wasmPaths = "/model/";
    session = await ort.InferenceSession.create("/model/portfolio_risk.onnx", {
      executionProviders: ["wasm"],
    });
    console.log("[ONNX.js] Model loaded successfully");
    return true;
  } catch (error) {
    console.error("[ONNX.js] Failed to load model:", error);
    session = null;
    return false;
  }
}

/**
 * Run inference on 61 features. Returns RiskOutput.
 * Throws if model is not loaded.
 */
export async function runInference(features: number[]): Promise<RiskOutput> {
  if (!session) {
    throw new Error("ONNX model not loaded — call loadModel() first");
  }

  if (features.length !== N_FEATURES) {
    throw new Error(`Expected ${N_FEATURES} features, got ${features.length}`);
  }

  // Create input tensor
  const inputTensor = new ort.Tensor("float32", Float32Array.from(features), [1, N_FEATURES]);
  const inputName = session.inputNames[0];

  // Run inference
  const results = await session.run({ [inputName]: inputTensor });

  // Parse output — XGBoost ONNX exports probabilities
  // Output name is typically "probabilities" or "output_probability"
  let riskScore: number;
  const outputNames = session.outputNames;

  // Try to find probability output (class 1 = drawdown)
  const probaOutput = results[outputNames.find((n) => n.includes("prob")) || outputNames[1]];
  if (probaOutput) {
    const probaData = probaOutput.data as Float32Array;
    // Class 1 probability (drawdown > 3%)
    riskScore = probaData[1] * 100;
  } else {
    // Fallback: use first output as raw score
    const rawOutput = results[outputNames[0]];
    riskScore = (rawOutput.data as Float32Array)[0] * 100;
  }

  riskScore = Math.max(0, Math.min(100, riskScore));

  // Determine label
  let riskLabel: RiskOutput["risk_label"];
  if (riskScore > 70) riskLabel = "HIGH";
  else if (riskScore > 40) riskLabel = "MEDIUM";
  else riskLabel = "LOW";

  // Top factors from features
  const topFactors = getTopFactors(features);

  return {
    risk_score: Math.round(riskScore * 10) / 10,
    risk_label: riskLabel,
    top_factors: topFactors,
    source: "local_fallback",
  };
}

/**
 * Check if the model is loaded and ready.
 */
export function isModelLoaded(): boolean {
  return session !== null;
}

/**
 * Extract top 3 risk factors from the raw feature vector.
 */
function getTopFactors(features: number[]): string[] {
  const factors: [string, number][] = [];

  for (let i = 0; i < TICKERS.length; i++) {
    const base = i * 4;
    const ret7d = features[base];
    const vol30d = features[base + 2];
    const rsi = features[base + 3];

    if (rsi > 70) {
      factors.push([`${TICKERS[i]} RSI overbought (${rsi.toFixed(0)})`, rsi]);
    } else if (rsi < 30) {
      factors.push([`${TICKERS[i]} RSI oversold (${rsi.toFixed(0)})`, 100 - rsi]);
    }
    if (vol30d > 0.03) {
      factors.push([`${TICKERS[i]} high volatility (${(vol30d * 100).toFixed(1)}%)`, vol30d * 1000]);
    }
    if (ret7d < -0.05) {
      factors.push([`${TICKERS[i]} dropped ${(ret7d * 100).toFixed(1)}% this week`, Math.abs(ret7d) * 100]);
    }
  }

  factors.sort((a, b) => b[1] - a[1]);
  return factors.slice(0, 3).map((f) => f[0]);
}
```

---

## File 2: `frontend/lib/ai/rules.ts`

### Purpose
Absolute last resort if ONNX.js also fails. Pure logic, no dependencies.

```typescript
// frontend/lib/ai/rules.ts

import { RiskOutput, PortfolioPositions, XSTOCK_SYMBOLS } from "./types";

/**
 * Hardcoded rule-based risk assessment.
 * Used ONLY when:
 * 1. FastAPI server is down AND
 * 2. ONNX.js browser inference fails
 *
 * Returns the same RiskOutput format as all other providers.
 */
export function evaluateRules(positions: PortfolioPositions): RiskOutput {
  const factors: string[] = [];
  let riskScore = 30; // Base: moderate-low

  const techTokens = ["TSLAx", "NVDAx", "METAx", "GOOGx", "AMZNx", "AAPLx", "MSFTx"];
  const volatileTokens = ["TSLAx", "NVDAx", "MSTRx"];
  const defensiveTokens = ["SPYx", "JPMx", "Vx", "XOMx"];

  // Rule 1: Single position concentration > 30%
  for (const [token, pct] of Object.entries(positions)) {
    if (pct > 30) {
      riskScore += 20;
      factors.push(`${token} concentration too high (${pct.toFixed(0)}%)`);
    }
  }

  // Rule 2: Tech sector > 60%
  const techTotal = techTokens.reduce((sum, t) => sum + (positions[t] || 0), 0);
  if (techTotal > 60) {
    riskScore += 15;
    factors.push(`Tech sector overweight (${techTotal.toFixed(0)}%)`);
  }

  // Rule 3: Volatile stocks > 40%
  const volatileTotal = volatileTokens.reduce((sum, t) => sum + (positions[t] || 0), 0);
  if (volatileTotal > 40) {
    riskScore += 15;
    factors.push(`High-volatility stocks at ${volatileTotal.toFixed(0)}%`);
  }

  // Rule 4: No defensive allocation
  const defensiveTotal = defensiveTokens.reduce((sum, t) => sum + (positions[t] || 0), 0);
  if (defensiveTotal < 10) {
    riskScore += 10;
    factors.push(`Low defensive allocation (${defensiveTotal.toFixed(0)}%)`);
  }

  // Rule 5: MicroStrategy (crypto exposure) > 15%
  const mstr = positions["MSTRx"] || 0;
  if (mstr > 15) {
    riskScore += 10;
    factors.push(`High crypto exposure via MSTR (${mstr.toFixed(0)}%)`);
  }

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  // Determine label
  let riskLabel: RiskOutput["risk_label"];
  if (riskScore > 70) riskLabel = "HIGH";
  else if (riskScore > 40) riskLabel = "MEDIUM";
  else riskLabel = "LOW";

  return {
    risk_score: riskScore,
    risk_label: riskLabel,
    top_factors: factors.slice(0, 3).length > 0
      ? factors.slice(0, 3)
      : ["No major risk factors (rule-based assessment)"],
    source: "rules",
  };
}
```

---

## File 3: `frontend/lib/ai/fallback-chain.ts` (integration helper)

```typescript
// frontend/lib/ai/fallback-chain.ts

import { RiskOutput, PortfolioPositions } from "./types";
import { loadModel, runInference, isModelLoaded } from "./onnx_inference";
import { evaluateRules } from "./rules";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Try to get risk analysis from the best available source.
 * Chain: API server → ONNX.js browser → hardcoded rules
 *
 * The caller gets the same RiskOutput regardless of which path was taken.
 * Check `result.source` to know which provider responded.
 */
export async function getRiskAnalysis(
  features: number[],
  positions: PortfolioPositions
): Promise<RiskOutput> {
  // 1. Try API server
  try {
    const response = await fetch(`${API_BASE}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "radogost-risk",
        messages: [
          { role: "user", content: JSON.stringify({ features, positions }) },
        ],
      }),
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (response.ok) {
      const data = await response.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content) as RiskOutput;
    }
  } catch (error) {
    console.warn("[Fallback] API server unavailable, trying ONNX.js...");
  }

  // 2. Try ONNX.js browser
  try {
    if (!isModelLoaded()) {
      await loadModel();
    }
    if (isModelLoaded()) {
      return await runInference(features);
    }
  } catch (error) {
    console.warn("[Fallback] ONNX.js failed, using hardcoded rules...");
  }

  // 3. Last resort: hardcoded rules
  console.warn("[Fallback] Using rule-based assessment");
  return evaluateRules(positions);
}
```

---

## Kassim integration
```typescript
// In frontend, wherever risk analysis is needed:
import { getRiskAnalysis } from "@/lib/ai/fallback-chain";

const result = await getRiskAnalysis(features, positions);
// result.source tells you: "xgboost" | "local_fallback" | "rules"
// The UI renders the same regardless
```

---

## Verification
```bash
# Copy model to frontend
cp ai/shared/model/portfolio_risk.onnx frontend/public/model/

# Test rules (Node.js)
cd frontend
npx ts-node -e "
import { evaluateRules } from './lib/ai/rules';
const result = evaluateRules({ TSLAx: 45, NVDAx: 30, SPYx: 5, AAPLx: 20 });
console.log(result);
// Should output: { risk_score: 65+, risk_label: 'MEDIUM' or 'HIGH', ... }
"
```
