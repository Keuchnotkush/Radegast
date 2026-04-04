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
