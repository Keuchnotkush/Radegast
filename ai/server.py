"""Radegast AI Server — FastAPI with consensus pipeline + autonomous agent."""
from dotenv import load_dotenv
load_dotenv()

import asyncio
import json
import os
import logging
import numpy as np
import onnxruntime as ort
from pathlib import Path
from typing import Optional
from dataclasses import asdict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Shared imports
from shared.constants import N_FEATURES, TICKERS, XSTOCK_SYMBOLS
from shared.types import (
    ConsensusRequest, ConsensusResult, RiskOutput, RiskLabel,
    Mode, PortfolioInput
)
from shared.data_agent.fetch import fetch_features

# Module imports — wrapped in try/except so server starts even if modules are WIP
try:
    from consensus.orchestrator import run_consensus
except ImportError:
    run_consensus = None

try:
    from strategist.profiles import (
        get_profile, create_or_update_profile, get_trade_mode_users,
        recommend_allocation, set_mode
    )
except ImportError:
    get_profile = None

try:
    from chat.advisor import handle_message
except ImportError:
    handle_message = None


# ============================================================
# CONFIG
# ============================================================
AGENT_INTERVAL = int(os.getenv("AGENT_INTERVAL", "60"))
PORT = int(os.getenv("PORT", "8000"))
MODEL_PATH = Path(__file__).parent / "shared" / "model" / "portfolio_risk.onnx"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("radegast-ai")

# ============================================================
# APP
# ============================================================
app = FastAPI(
    title="Radegast AI",
    description="AI Consensus Protocol for tokenized stock portfolios",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ONNX MODEL (loaded once at startup)
# ============================================================
onnx_session: Optional[ort.InferenceSession] = None


@app.on_event("startup")
async def load_model():
    global onnx_session

    # If model not on disk, pull it from 0G Storage
    if not MODEL_PATH.exists():
        root_hash = os.getenv("OG_MODEL_ROOT_HASH", "")
        if root_hash:
            logger.info(f"ONNX model not found locally — downloading from 0G Storage ({root_hash[:18]}...)")
            import subprocess
            script = Path(__file__).parent / "scripts" / "og_storage_download.mjs"
            try:
                proc = subprocess.run(
                    ["node", str(script), root_hash, str(MODEL_PATH)],
                    capture_output=True, text=True, timeout=120,
                    env={**os.environ},
                )
                if proc.returncode == 0:
                    logger.info(f"ONNX model downloaded from 0G Storage to {MODEL_PATH}")
                else:
                    logger.error(f"0G Storage download failed: {proc.stderr.strip()}")
            except Exception as e:
                logger.error(f"0G Storage download error: {e}")
        else:
            logger.warning("OG_MODEL_ROOT_HASH not set — cannot pull model from 0G Storage")

    if MODEL_PATH.exists():
        onnx_session = ort.InferenceSession(str(MODEL_PATH))
        logger.info(f"ONNX model loaded from {MODEL_PATH}")
    else:
        logger.warning(f"ONNX model not found at {MODEL_PATH} — /v1/chat/completions will fail")

# In-memory store for latest agent results per user
_agent_results: dict = {}

# ============================================================
# BACKGROUND TASK — Autonomous Agent (Trade mode only)
# ============================================================
@app.on_event("startup")
async def start_autonomous_agent():
    asyncio.create_task(autonomous_agent())


async def autonomous_agent():
    """
    Scans every AGENT_INTERVAL seconds for Trade mode users.
    Runs consensus automatically and executes rebalances.
    This is what makes the project "autonomous" for the 0G track.
    """
    logger.info(f"Autonomous agent started (interval: {AGENT_INTERVAL}s)")
    while True:
        await asyncio.sleep(AGENT_INTERVAL)

        # Update xStock prices on-chain before scanning
        try:
            from consensus.update_prices import update_prices_onchain
            price_results = await update_prices_onchain()
            if price_results:
                logger.info(f"[AGENT] Updated {len(price_results)} xStock prices")
        except Exception as e:
            logger.error(f"[AGENT] Price update failed: {e}")

        try:
            if not get_trade_mode_users or not run_consensus:
                continue

            trade_users = get_trade_mode_users()
            for profile in trade_users:
                logger.info(f"[AGENT] Scanning user {profile.user_id}")
                try:
                    # Fetch actual on-chain holdings from backend
                    positions = {}
                    try:
                        # Use wallet address if available, otherwise use signer address from backend
                        wallet = profile.user_id if profile.user_id.startswith("0x") else os.getenv("DEMO_WALLET", "0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174")
                        async with aiohttp.ClientSession() as session:
                            async with session.get(f"http://localhost:4000/api/holdings/{wallet}") as resp:
                                if resp.status == 200:
                                    data = await resp.json()
                                    total_val = sum(h.get("valueUsd", 0) for h in data.get("holdings", []))
                                    if total_val > 0:
                                        for h in data["holdings"]:
                                            positions[h["symbol"]] = round(h["valueUsd"] / total_val * 100, 1)
                    except Exception as e:
                        logger.warning(f"[AGENT] Could not fetch holdings: {e}")

                    # Fallback to recommended allocation if no on-chain holdings
                    if not positions and recommend_allocation:
                        positions = recommend_allocation(profile)

                    request = ConsensusRequest(
                        user=profile.user_id,
                        positions=positions,
                        strategy=profile.strategy,
                        mode=Mode.TRADE,
                    )
                    result = await run_consensus(request)

                    # Store latest result for frontend polling
                    import time
                    _agent_results[profile.user_id] = {
                        **asdict(result),
                        "timestamp": time.time(),
                        "positions": positions,
                    }

                    if result.consensus_label != RiskLabel.LOW:
                        logger.info(
                            f"[AGENT] User {profile.user_id}: "
                            f"{result.consensus_label} (score: {result.consensus_score}) "
                            f"→ {len(result.moves)} rebalance moves"
                        )
                        for tr in result.trade_results:
                            status = "OK" if tr["success"] else "FAIL"
                            logger.info(f"  {status} {tr['action']} {tr['pct']}% {tr['token']} → {tr.get('tx_hash', 'N/A')}")
                    else:
                        logger.info(f"[AGENT] User {profile.user_id}: LOW risk, no action")

                except Exception as e:
                    logger.error(f"[AGENT] Error for user {profile.user_id}: {e}")

        except Exception as e:
            logger.error(f"[AGENT] Scan error: {e}")


# ============================================================
# PYDANTIC MODELS (request/response schemas)
# ============================================================
class HealthResponse(BaseModel):
    status: str = "ok"
    model_loaded: bool = False
    features: int = N_FEATURES
    tickers: int = len(TICKERS)

class ConsensusRequestBody(BaseModel):
    user: str
    positions: dict = {}
    strategy: str = "balanced"
    mode: str = "conseil"

class ChatRequestBody(BaseModel):
    user_id: str
    message: str
    positions: Optional[dict] = None

class ProfileRequestBody(BaseModel):
    user_id: str
    risk_tolerance: str = "moderate"
    investment_horizon: str = "medium"
    financial_goals: str = "growth"
    capital_available: float = 1000.0
    sector_preferences: list = []

class OpenAIChatRequest(BaseModel):
    model: str = "radogost-risk"
    messages: list = []


# ============================================================
# ENDPOINTS
# ============================================================

@app.get("/api/agent/latest/{user_id}")
async def agent_latest(user_id: str):
    """Get the latest autonomous agent result for a user."""
    result = _agent_results.get(user_id)
    if not result:
        raise HTTPException(404, "No agent results yet")
    return result


@app.get("/health")
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=onnx_session is not None,
    )


@app.get("/api/prices")
async def get_prices():
    """Get live xStock prices from yfinance."""
    from consensus.update_prices import fetch_live_prices
    prices = await fetch_live_prices()
    return {"prices": prices, "source": "yfinance", "count": len(prices)}


@app.post("/api/consensus")
async def consensus_endpoint(body: ConsensusRequestBody):
    """Full consensus pipeline — what Kassim calls from the frontend."""
    if not run_consensus:
        raise HTTPException(503, "Consensus module not available yet")

    request = ConsensusRequest(
        user=body.user,
        positions=body.positions,
        strategy=body.strategy,
        mode=Mode(body.mode),
    )

    result = await run_consensus(request)
    return asdict(result)


@app.post("/api/chat")
async def chat_endpoint(body: ChatRequestBody):
    """Chatbot conversation — wraps consensus in plain language."""
    if not handle_message:
        raise HTTPException(503, "Chat module not available yet")

    response = await handle_message(
        user_id=body.user_id,
        message=body.message,
        run_consensus_fn=run_consensus,
        current_positions=body.positions,
    )

    # Serialize consensus if present
    if response.get("consensus"):
        response["consensus"] = asdict(response["consensus"])

    return response


@app.post("/api/profile")
async def create_profile(body: ProfileRequestBody):
    """Create or update investor profile."""
    if not create_or_update_profile:
        raise HTTPException(503, "Profile module not available yet")

    profile = create_or_update_profile(
        user_id=body.user_id,
        risk_tolerance=body.risk_tolerance,
        investment_horizon=body.investment_horizon,
        financial_goals=body.financial_goals,
        capital_available=body.capital_available,
        sector_preferences=body.sector_preferences,
    )
    return asdict(profile)


@app.get("/api/profile/{user_id}")
async def get_profile_endpoint(user_id: str):
    """Get investor profile."""
    if not get_profile:
        raise HTTPException(503, "Profile module not available yet")

    profile = get_profile(user_id)
    if not profile:
        raise HTTPException(404, f"Profile not found for {user_id}")
    return asdict(profile)


class SetModeBody(BaseModel):
    user_id: str
    mode: str  # "conseil" or "trade"

@app.post("/api/profile/mode")
async def set_mode_endpoint(body: SetModeBody):
    """Switch user mode between conseil and trade."""
    if not set_mode:
        raise HTTPException(503, "Profile module not available yet")
    # Auto-create profile if it doesn't exist
    if get_profile and not get_profile(body.user_id):
        if create_or_update_profile:
            create_or_update_profile(user_id=body.user_id)
    profile = set_mode(body.user_id, Mode(body.mode))
    if not profile:
        raise HTTPException(404, f"Profile not found for {body.user_id}")
    return asdict(profile)


@app.post("/api/recommend")
async def recommend_endpoint(body: ProfileRequestBody):
    """Get portfolio recommendation based on profile."""
    if not create_or_update_profile or not recommend_allocation:
        raise HTTPException(503, "Profile module not available yet")

    profile = create_or_update_profile(
        user_id=body.user_id,
        risk_tolerance=body.risk_tolerance,
        investment_horizon=body.investment_horizon,
    )
    allocation = recommend_allocation(profile)
    return {"strategy": profile.strategy, "allocation": allocation}


@app.post("/v1/chat/completions")
async def xgboost_provider(body: OpenAIChatRequest):
    """
    XGBoost provider endpoint — OpenAI API format.
    This is what 0G Compute calls (or the orchestrator directly).
    Parses features from messages[-1].content, runs ONNX inference.
    """
    if not onnx_session:
        raise HTTPException(503, "ONNX model not loaded")

    try:
        # Parse features from the last message
        content = body.messages[-1]["content"]
        data = json.loads(content)
        features = data["features"]

        assert len(features) == N_FEATURES, f"Expected {N_FEATURES} features, got {len(features)}"

        # Run inference
        input_array = np.array([features], dtype=np.float32)
        input_name = onnx_session.get_inputs()[0].name

        # Get probability of drawdown (class 1)
        proba = onnx_session.run(None, {input_name: input_array})

        # proba[1] is the probability array for each class
        if len(proba) > 1:
            risk_score = float(proba[1][0][1]) * 100  # probability of class 1 × 100
        else:
            risk_score = float(proba[0][0]) * 100

        # Determine label
        if risk_score > 70:
            risk_label = "HIGH"
        elif risk_score > 40:
            risk_label = "MEDIUM"
        else:
            risk_label = "LOW"

        # Top factors (from feature importance — simplified for hackathon)
        top_factors = _get_top_factors(features)

        result = {
            "risk_score": round(risk_score, 1),
            "risk_label": risk_label,
            "top_factors": top_factors,
            "source": "xgboost",
        }

        # Return in OpenAI API format
        return {
            "id": "radogost-risk-001",
            "object": "chat.completion",
            "model": "radogost-risk",
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": json.dumps(result),
                },
                "finish_reason": "stop",
            }],
        }

    except Exception as e:
        raise HTTPException(400, f"Inference error: {str(e)}")


def _get_top_factors(features: list) -> list:
    """Identify top 3 risk factors from feature values."""
    factors = []
    for i, ticker in enumerate(TICKERS):
        base = i * 4
        ret_7d = features[base]
        vol_30d = features[base + 2]
        rsi = features[base + 3]

        if rsi > 70:
            factors.append((f"{ticker} RSI overbought ({rsi:.0f})", rsi))
        elif rsi < 30:
            factors.append((f"{ticker} RSI oversold ({rsi:.0f})", 100 - rsi))
        if vol_30d > 0.03:
            factors.append((f"{ticker} high volatility ({vol_30d:.1%})", vol_30d * 1000))
        if ret_7d < -0.05:
            factors.append((f"{ticker} dropped {ret_7d:.1%} this week", abs(ret_7d) * 100))

    factors.sort(key=lambda x: x[1], reverse=True)
    return [f[0] for f in factors[:3]] or ["No major risk factors identified"]


# ============================================================
# MAIN
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
