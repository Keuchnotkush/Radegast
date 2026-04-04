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
