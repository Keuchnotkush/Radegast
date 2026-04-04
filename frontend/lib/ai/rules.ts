import { RiskOutput, PortfolioPositions } from "./types";

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
