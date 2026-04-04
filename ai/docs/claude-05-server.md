# claude-05-server.md — FastAPI Server + Background Task

## What this file creates
```
ai/
├── server.py              # Main FastAPI app — ALL endpoints + background task
├── providers.json         # Provider configuration
├── requirements.txt       # Pinned dependencies
└── Dockerfile             # python:3.11-slim → Railway/Render
```

## Dependencies (imports from other modules)
```python
from shared.constants import TICKERS, XSTOCK_SYMBOLS, N_FEATURES, STRATEGY_TARGETS
from shared.types import (
    ConsensusRequest, ConsensusResult, InvestorProfile,
    RiskOutput, RiskLabel, Mode, PortfolioInput
)
from shared.data_agent.fetch import fetch_features
from consensus.orchestrator import run_consensus
from consensus.vote import compute_consensus
from strategist.agent import generate_suggestions, build_rebalance_moves
from strategist.profiles import (
    get_profile, create_or_update_profile, get_trade_mode_users,
    recommend_allocation, set_mode
)
from chat.advisor import handle_message
```

**This file is the LAST to be fully wired.** It can be scaffolded early (Day 1) with stubs, then modules are plugged in as they become available.

---

## File 1: `ai/server.py`

```python
"""Radegast AI Server — FastAPI with consensus pipeline + autonomous agent."""
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
    if MODEL_PATH.exists():
        onnx_session = ort.InferenceSession(str(MODEL_PATH))
        logger.info(f"ONNX model loaded from {MODEL_PATH}")
    else:
        logger.warning(f"ONNX model not found at {MODEL_PATH} — /v1/chat/completions will fail")


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
        try:
            if not get_trade_mode_users or not run_consensus:
                continue

            trade_users = get_trade_mode_users()
            for profile in trade_users:
                logger.info(f"[AGENT] Scanning user {profile.user_id}")
                try:
                    positions = recommend_allocation(profile) if recommend_allocation else {}
                    request = ConsensusRequest(
                        user=profile.user_id,
                        positions=positions,
                        strategy=profile.strategy,
                        mode=Mode.TRADE,
                    )
                    result = await run_consensus(request)

                    if result.consensus_label != RiskLabel.LOW:
                        logger.info(
                            f"[AGENT] User {profile.user_id}: "
                            f"{result.consensus_label} (score: {result.consensus_score}) "
                            f"→ {len(result.moves)} rebalance moves"
                        )
                        # In production: execute burn/mint via web3
                        # For hackathon: log the moves
                        for move in result.moves:
                            logger.info(f"  → {move.action} {move.pct}% {move.token}")
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

@app.get("/health")
async def health():
    return HealthResponse(
        status="ok",
        model_loaded=onnx_session is not None,
    )


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
```

---

## File 2: `ai/providers.json`
```json
{
  "providers": [
    {
      "name": "xgboost",
      "url": "${XGBOOST_URL}",
      "fallback_url": null,
      "timeout_ms": 8000,
      "type": "onnx"
    },
    {
      "name": "llm_a",
      "url": "${LLM_A_URL}",
      "fallback_url": "${LLM_A_FALLBACK_URL}",
      "timeout_ms": 8000,
      "type": "llm"
    },
    {
      "name": "llm_b",
      "url": "${LLM_B_URL}",
      "fallback_url": "${LLM_B_FALLBACK_URL}",
      "timeout_ms": 8000,
      "type": "llm"
    }
  ]
}
```

---

## File 3: `ai/requirements.txt`
```
fastapi==0.111.0
uvicorn[standard]==0.30.1
aiohttp==3.9.5
pydantic==2.7.4
onnxruntime==1.18.0
xgboost==2.0.3
onnxmltools==1.12.0
scikit-learn==1.5.0
pandas==2.2.2
numpy==1.26.4
yfinance==0.2.40
web3==6.19.0
python-dotenv==1.0.1
eth-account==0.13.0
0g-storage-sdk==0.3.0
```

---

## File 4: `ai/Dockerfile`
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Environment Variables (.env)
```bash
# Provider URLs
XGBOOST_URL=http://localhost:8000/v1/chat/completions
LLM_A_URL=
LLM_B_URL=
LLM_A_FALLBACK_URL=
LLM_B_FALLBACK_URL=

# 0G Network
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai
OG_RPC=https://evmrpc-testnet.0g.ai
PRIVATE_KEY=
CONSENSUS_SETTLEMENT=
CONSENSUS_ABI=[]

# Agent
AGENT_INTERVAL=60
MOCK_ONCHAIN=true
MOCK_DA=true

# Server
PORT=8000
YFINANCE_CACHE_TTL=300
```

---

## Verification
```bash
cd ai

# 1. Start server (modules may not all be ready — that's OK)
uvicorn server:app --reload --port 8000

# 2. Health check
curl http://localhost:8000/health
# → {"status":"ok","model_loaded":true,"features":61,"tickers":15}

# 3. Test XGBoost provider (if model exists)
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"radogost-risk","messages":[{"role":"user","content":"{\"features\":[0.1]*61,\"positions\":{}}"}]}'

# 4. Test consensus (when all modules ready)
curl -X POST http://localhost:8000/api/consensus \
  -H "Content-Type: application/json" \
  -d '{"user":"0x123","positions":{"TSLAx":35,"AAPLx":20},"strategy":"balanced","mode":"conseil"}'
```
