# claude-04-chat.md — Chatbot Financial Advisor

## What this file creates
```
ai/chat/
├── __init__.py
└── advisor.py       # Chatbot logic — wraps consensus in plain language
```

## Dependencies
```python
from shared.types import ConsensusResult, ConsensusRequest, InvestorProfile, Mode, RiskLabel
from shared.constants import TICKER_TO_XSTOCK, XSTOCK_SYMBOLS
from strategist.profiles import get_profile, create_or_update_profile, recommend_allocation
# Consensus is called via orchestrator — but advisor.py does NOT import it directly.
# server.py handles the orchestration and passes the result to advisor.
```

## Key principle
**No crypto jargon.** Say "stock" not "token". Say "portfolio" not "wallet". Say "investment" not "position". The user thinks they're using a stock advisor app, not a DeFi tool.

---

## File 1: `ai/chat/advisor.py`

### Purpose
Process user messages, determine intent, respond in plain language.
If the user asks about risk or portfolio analysis → trigger consensus (via server.py callback).

```python
"""Chatbot financial advisor. Wraps AI consensus in human-friendly language."""
import re
from typing import Optional, Callable, Awaitable

from shared.types import ConsensusResult, ConsensusRequest, InvestorProfile, Mode, RiskLabel
from shared.constants import XSTOCK_SYMBOLS, TICKER_TO_XSTOCK
from strategist.profiles import (
    get_profile, create_or_update_profile,
    recommend_allocation, set_mode
)


# Intent detection keywords
RISK_KEYWORDS = ["risk", "safe", "danger", "volatile", "crash", "drop", "worried", "concern", "protect"]
RECOMMEND_KEYWORDS = ["recommend", "suggest", "advice", "what should", "buy", "invest", "allocat", "portfolio"]
PROFILE_KEYWORDS = ["profile", "strategy", "tolerance", "horizon", "goal", "conservative", "aggressive", "moderate"]
EXPLAIN_KEYWORDS = ["explain", "why", "how", "what is", "mean", "understand"]
GREETING_KEYWORDS = ["hello", "hi", "hey", "bonjour", "salut", "good morning"]


async def handle_message(
    user_id: str,
    message: str,
    run_consensus_fn: Optional[Callable[..., Awaitable[ConsensusResult]]] = None,
    current_positions: Optional[dict] = None,
) -> dict:
    """
    Process a user message and return a response.
    
    Args:
        user_id: wallet address or user ID
        message: the user's message text
        run_consensus_fn: async callback to run consensus pipeline (injected by server.py)
        current_positions: user's current portfolio percentages
    
    Returns:
        {"reply": str, "consensus": Optional[ConsensusResult], "action": Optional[str]}
    """
    msg = message.lower().strip()
    profile = get_profile(user_id)

    # Greeting
    if _matches(msg, GREETING_KEYWORDS):
        if profile:
            return {
                "reply": (
                    f"Welcome back! Your strategy is set to {profile.strategy}. "
                    f"Would you like me to analyze your portfolio or adjust your strategy?"
                ),
                "consensus": None,
                "action": "greeting",
            }
        else:
            return {
                "reply": (
                    "Hi! I'm your investment advisor. Before I can help you, "
                    "I need to understand your investment style.\n\n"
                    "Are you more conservative (prefer stability), "
                    "moderate (balanced approach), or aggressive (maximize growth)?"
                ),
                "consensus": None,
                "action": "onboarding",
            }

    # Profile setup / update
    if _matches(msg, PROFILE_KEYWORDS) or not profile:
        return _handle_profile_setup(user_id, msg, profile)

    # Risk analysis → trigger consensus
    if _matches(msg, RISK_KEYWORDS):
        return await _handle_risk_analysis(
            user_id, msg, profile, run_consensus_fn, current_positions
        )

    # Recommendation request
    if _matches(msg, RECOMMEND_KEYWORDS):
        return _handle_recommendation(user_id, msg, profile)

    # Explanation
    if _matches(msg, EXPLAIN_KEYWORDS):
        return _handle_explanation(msg)

    # Default: treat as general question
    return {
        "reply": (
            "I can help you with:\n"
            "• **Analyze** your portfolio risk\n"
            "• **Recommend** stocks based on your profile\n"
            "• **Explain** investment concepts\n"
            "• **Adjust** your investment strategy\n\n"
            "What would you like to do?"
        ),
        "consensus": None,
        "action": "help",
    }


def _handle_profile_setup(user_id: str, msg: str, profile: Optional[InvestorProfile]) -> dict:
    """Handle profile creation or update."""
    # Detect risk tolerance from message
    risk = "moderate"
    if any(w in msg for w in ["conservative", "safe", "low risk", "stability"]):
        risk = "conservative"
    elif any(w in msg for w in ["aggressive", "high risk", "maximum", "growth"]):
        risk = "aggressive"
    elif any(w in msg for w in ["moderate", "balanced", "middle"]):
        risk = "moderate"
    elif profile:
        risk = profile.risk_tolerance

    # Detect horizon
    horizon = "medium"
    if any(w in msg for w in ["short", "quick", "few months"]):
        horizon = "short"
    elif any(w in msg for w in ["long", "years", "retire"]):
        horizon = "long"
    elif profile:
        horizon = profile.investment_horizon

    new_profile = create_or_update_profile(
        user_id=user_id,
        risk_tolerance=risk,
        investment_horizon=horizon,
    )

    allocation = recommend_allocation(new_profile)
    top_5 = sorted(allocation.items(), key=lambda x: x[1], reverse=True)[:5]
    alloc_text = ", ".join(f"{sym} ({pct:.0f}%)" for sym, pct in top_5)

    strategy_desc = {
        "conservative": "stability and capital preservation",
        "balanced": "a mix of growth and stability",
        "growth": "maximizing long-term growth",
        "aggressive": "high-growth opportunities with higher risk",
    }

    return {
        "reply": (
            f"Got it! I've set your strategy to **{new_profile.strategy}** — "
            f"focused on {strategy_desc.get(new_profile.strategy, 'balanced growth')}.\n\n"
            f"Here's your recommended allocation:\n"
            f"{alloc_text}\n\n"
            f"Would you like me to analyze how risky this portfolio is right now?"
        ),
        "consensus": None,
        "action": "profile_updated",
    }


async def _handle_risk_analysis(
    user_id: str,
    msg: str,
    profile: InvestorProfile,
    run_consensus_fn,
    positions: Optional[dict],
) -> dict:
    """Run consensus and translate to plain language."""
    if not run_consensus_fn:
        return {
            "reply": "I can't run a risk analysis right now. Please try again later.",
            "consensus": None,
            "action": "error",
        }

    if not positions:
        positions = recommend_allocation(profile)

    request = ConsensusRequest(
        user=user_id,
        positions=positions,
        strategy=profile.strategy,
        mode=profile.mode,
    )

    consensus = await run_consensus_fn(request)
    reply = _format_consensus_response(consensus, profile)

    return {
        "reply": reply,
        "consensus": consensus,
        "action": "risk_analysis",
    }


def _handle_recommendation(user_id: str, msg: str, profile: InvestorProfile) -> dict:
    """Generate portfolio recommendation based on profile."""
    allocation = recommend_allocation(profile)
    top_stocks = sorted(allocation.items(), key=lambda x: x[1], reverse=True)

    # Clean token names for display (remove 'x' suffix)
    lines = []
    for sym, pct in top_stocks:
        if pct > 0:
            clean_name = sym.replace("x", "")
            lines.append(f"  • {clean_name}: {pct:.0f}%")

    return {
        "reply": (
            f"Based on your **{profile.strategy}** strategy, "
            f"here's my recommended portfolio:\n\n"
            + "\n".join(lines) + "\n\n"
            f"This targets {_strategy_goal_text(profile.strategy)}. "
            f"Want me to check how the market is doing right now?"
        ),
        "consensus": None,
        "action": "recommendation",
    }


def _handle_explanation(msg: str) -> dict:
    """Explain investment concepts in plain language."""
    explanations = {
        "rsi": (
            "RSI (Relative Strength Index) measures if a stock is overbought or oversold. "
            "Above 70 means it might be overvalued, below 30 means it could be undervalued. "
            "I use this as one of many factors in my analysis."
        ),
        "volatil": (
            "Volatility tells you how much a stock's price swings up and down. "
            "High volatility means bigger potential gains but also bigger potential losses. "
            "If you prefer stability, I recommend stocks with lower volatility."
        ),
        "diversif": (
            "Diversification means spreading your money across different stocks and sectors. "
            "If one sector drops, your other investments can cushion the blow. "
            "That's why I recommend a mix of tech, finance, energy, and more."
        ),
        "drawdown": (
            "A drawdown is how much your portfolio drops from its peak. "
            "For example, if your portfolio goes from $10,000 to $9,000, "
            "that's a 10% drawdown. My AI model predicts future drawdown risk."
        ),
        "rebalance": (
            "Rebalancing means adjusting your portfolio back to your target allocations. "
            "If tech stocks grew a lot and now make up too much of your portfolio, "
            "I'd suggest selling some and buying other sectors to stay balanced."
        ),
    }

    for keyword, explanation in explanations.items():
        if keyword in msg:
            return {"reply": explanation, "consensus": None, "action": "explain"}

    return {
        "reply": (
            "I can explain concepts like volatility, diversification, "
            "risk levels, and rebalancing. What would you like to know more about?"
        ),
        "consensus": None,
        "action": "explain",
    }


def _format_consensus_response(consensus: ConsensusResult, profile: InvestorProfile) -> str:
    """Translate ConsensusResult into plain language."""
    score = consensus.consensus_score
    label = consensus.consensus_label
    confidence = consensus.confidence
    agreed = consensus.providers_agreed

    if label == RiskLabel.HIGH:
        header = f"🔴 **High risk detected** (score: {score:.0f}/100)"
        body = (
            "My analysis shows elevated risk in your portfolio right now. "
            "Multiple indicators suggest potential downside in the coming days."
        )
    elif label == RiskLabel.MEDIUM:
        header = f"🟡 **Moderate risk** (score: {score:.0f}/100)"
        body = (
            "Your portfolio has some risk factors to watch. "
            "Nothing alarming, but a few adjustments could improve your position."
        )
    else:
        header = f"🟢 **Low risk** (score: {score:.0f}/100)"
        body = (
            "Your portfolio looks solid right now. "
            "Market conditions are favorable for your strategy."
        )

    confidence_text = (
        f"\n\n*Confidence: {confidence:.0%} — "
        f"{agreed} of my analysis models agree on this assessment.*"
    )

    suggestions_text = ""
    if consensus.suggestions:
        suggestions_text = "\n\n**Suggested actions:**\n"
        for s in consensus.suggestions[:5]:
            suggestions_text += f"• {s}\n"

    return header + "\n\n" + body + confidence_text + suggestions_text


def _strategy_goal_text(strategy: str) -> str:
    """Human-readable strategy goal."""
    goals = {
        "conservative": "steady returns with minimal risk",
        "balanced": "moderate growth with controlled risk",
        "growth": "strong growth over the medium to long term",
        "aggressive": "maximum growth, accepting higher volatility",
    }
    return goals.get(strategy, "balanced growth")


def _matches(msg: str, keywords: list) -> bool:
    """Check if message contains any of the keywords."""
    return any(k in msg for k in keywords)
```

---

## How server.py uses this
```python
from chat.advisor import handle_message
from consensus.orchestrator import run_consensus

@app.post("/api/chat")
async def chat(request: ChatRequest):
    response = await handle_message(
        user_id=request.user_id,
        message=request.message,
        run_consensus_fn=run_consensus,  # inject the consensus pipeline
        current_positions=request.positions,
    )
    return response
```

---

## Verification
```bash
cd ai
python -c "
import asyncio
from chat.advisor import handle_message

async def test():
    # Test greeting (no profile)
    r = await handle_message('user1', 'Hello!')
    print(r['action'], '→', r['reply'][:60])

    # Test profile setup
    r = await handle_message('user1', 'I am conservative and want stability')
    print(r['action'], '→', r['reply'][:60])

    # Test recommendation
    r = await handle_message('user1', 'What stocks do you recommend?')
    print(r['action'], '→', r['reply'][:60])

asyncio.run(test())
"
```
