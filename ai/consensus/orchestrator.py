"""Orchestrator: runs the full consensus pipeline."""
import asyncio
import aiohttp
import json
import os
import logging
from pathlib import Path
from typing import List, Optional

from shared.constants import MIN_PROVIDERS_REQUIRED, PROVIDER_TIMEOUT_S
from shared.types import (
    RiskOutput, RiskLabel, ConsensusResult, ConsensusRequest,
    PortfolioInput, Mode
)
from shared.data_agent.fetch import fetch_features
from consensus.vote import compute_consensus
from consensus.submit_da import submit_to_da
from consensus.submit_onchain import submit_onchain

logger = logging.getLogger(__name__)

# Prompt templates for LLM providers (bull / bear)
PROMPTS_DIR = Path(__file__).parent.parent / "shared" / "prompts"
BULL_PROMPT = (PROMPTS_DIR / "llm_analysis_prompt.txt").read_text()
BEAR_PROMPT = (PROMPTS_DIR / "llm_bear_prompt.txt").read_text()

LLM_PROMPTS = {
    "llm_a": BULL_PROMPT,   # Provider 2: fundamental bull analyst
    "llm_b": BEAR_PROMPT,   # Provider 3: contrarian bear auditor
}

# Provider config — llm_a and llm_b share the same 0G Compute provider address
OG_PROVIDER_ADDR = os.getenv("OG_COMPUTE_PROVIDER_ADDR", "")

PROVIDERS = [
    {
        "name": "xgboost",
        "url": os.getenv("XGBOOST_URL", "http://localhost:8000/v1/chat/completions"),
        "fallback_url": None,  # fallback is ONNX.js browser-side
    },
    {
        "name": "llm_a",
        "url": os.getenv("LLM_A_URL", ""),
        "fallback_url": os.getenv("LLM_A_FALLBACK_URL", ""),  # Groq
    },
    {
        "name": "llm_b",
        "url": os.getenv("LLM_B_URL", ""),
        "fallback_url": os.getenv("LLM_B_FALLBACK_URL", ""),  # Groq
    },
]


async def run_consensus(request: ConsensusRequest) -> ConsensusResult:
    """
    Full consensus pipeline:
    1. Fetch 61 features
    2. Call 3 providers in parallel (timeout 8s)
    3. Vote (majority)
    4. Submit to 0G Storage (DA)
    5. Submit on-chain (ConsensusSettlement)
    6. Return ConsensusResult
    """
    # Step 1: Fetch features
    portfolio = fetch_features(request.positions)

    # Step 2: Call 3 providers in parallel
    responses = await _call_providers(portfolio)

    # Filter valid responses
    valid = [r for r in responses if r is not None]
    if len(valid) < MIN_PROVIDERS_REQUIRED:
        logger.error(f"Only {len(valid)} valid responses, need {MIN_PROVIDERS_REQUIRED}")
        # Return a safe default
        return ConsensusResult(
            consensus_label=RiskLabel.MEDIUM,
            consensus_score=50.0,
            confidence=0.0,
            providers_agreed=f"{len(valid)}/3",
            suggestions=["Insufficient provider responses — defaulting to MEDIUM risk"],
        )

    # Step 3: Vote
    consensus = compute_consensus(valid)

    # Step 4: Submit to 0G Storage (DA proxy)
    da_hash = await submit_to_da(consensus)
    consensus.da_hash = da_hash

    # Step 5: Submit on-chain
    if request.mode == Mode.TRADE:
        tx_hash = await submit_onchain(request.user, consensus)
        consensus.tx_hash = tx_hash

    # Step 6: Generate suggestions or moves (plugged in from agent.py)
    # Import here to avoid circular imports
    try:
        from strategist.agent import generate_suggestions, build_rebalance_moves
        if request.mode == Mode.CONSEIL:
            consensus.suggestions = generate_suggestions(consensus, request.positions, request.strategy)
        else:
            consensus.moves = build_rebalance_moves(request.positions, request.strategy)
    except ImportError:
        logger.warning("agent.py not yet available — returning consensus without suggestions")

    return consensus


async def _call_providers(portfolio: PortfolioInput) -> List[Optional[RiskOutput]]:
    """Call 3 providers in parallel with timeout."""
    tasks = [
        _call_single_provider(p, portfolio) for p in PROVIDERS
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    outputs = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.warning(f"Provider {PROVIDERS[i]['name']} failed: {result}")
            outputs.append(None)
        else:
            outputs.append(result)
    return outputs


async def _call_single_provider(provider: dict, portfolio: PortfolioInput) -> Optional[RiskOutput]:
    """Call a single provider. Try 0G Compute broker first for LLMs, then HTTP fallback."""

    # Try 0G Compute broker first for LLM providers
    if provider["name"] in ("llm_a", "llm_b") and os.getenv("PRIVATE_KEY") and OG_PROVIDER_ADDR:
        try:
            from consensus.og_compute import call_provider

            # Build prompt from bull/bear template
            template = LLM_PROMPTS[provider["name"]]
            filled = template.replace("{features_json}", json.dumps(portfolio.features)) \
                             .replace("{positions_json}", json.dumps(portfolio.positions))

            prompt = json.dumps([{"role": "user", "content": filled}])
            content = await call_provider(OG_PROVIDER_ADDR, prompt)
            if content:
                parsed = json.loads(content)
                return RiskOutput(
                    risk_score=float(parsed["risk_score"]),
                    risk_label=RiskLabel(parsed["risk_label"]),
                    top_factors=parsed.get("top_factors", []),
                    source=parsed.get("source", f"0g_{provider['name']}"),
                )
        except Exception as e:
            logger.warning(f"[0G Compute] {provider['name']} failed, falling back to HTTP: {e}")

    # Fallback: direct HTTP call
    urls = [provider["url"], provider.get("fallback_url", "")]
    urls = [u for u in urls if u]  # remove empty

    for url in urls:
        try:
            result = await _http_call(url, portfolio, provider["name"])
            if result:
                return result
        except Exception as e:
            logger.warning(f"Provider {provider['name']} at {url} failed: {e}")
            continue

    return None


async def _http_call(url: str, portfolio: PortfolioInput, source: str) -> Optional[RiskOutput]:
    """Make HTTP call to a provider endpoint."""
    payload = {
        "model": "radogost-risk" if source == "xgboost" else "default",
        "messages": [
            {"role": "user", "content": json.dumps({"features": portfolio.features, "positions": portfolio.positions})}
        ]
    }

    timeout = aiohttp.ClientTimeout(total=PROVIDER_TIMEOUT_S)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        async with session.post(url, json=payload, headers={"Content-Type": "application/json"}) as resp:
            if resp.status != 200:
                return None
            data = await resp.json()

            # Parse OpenAI-format response
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            parsed = json.loads(content)

            return RiskOutput(
                risk_score=float(parsed["risk_score"]),
                risk_label=RiskLabel(parsed["risk_label"]),
                top_factors=parsed.get("top_factors", []),
                source=parsed.get("source", source),
            )
