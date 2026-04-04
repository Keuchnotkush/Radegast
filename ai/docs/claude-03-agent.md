# claude-03-agent.md — Strategist Agent + Profiles

## What this file creates
```
ai/strategist/
├── __init__.py
├── agent.py          # generate_suggestions() + build_rebalance_moves()
└── profiles.py       # Investor profile logic
```

## Dependencies on shared (already built)
```python
from shared.constants import STRATEGY_TARGETS, TICKERS, TICKER_TO_XSTOCK, XSTOCK_SYMBOLS
from shared.types import (
    ConsensusResult, RiskLabel, RebalanceMove, InvestorProfile, Mode
)
```

## What calls these functions
- `consensus/orchestrator.py` calls `generate_suggestions()` and `build_rebalance_moves()`
- `server.py` calls `create_profile()`, `get_profile()`, `recommend_portfolio()`
- These functions are PURE (no side effects, no network calls). They take data in, return data out.

---

## File 1: `ai/strategist/agent.py`

### Purpose
Two functions, one per mode:
- **Conseil** → human-readable suggestion strings
- **Trade** → executable RebalanceMove list

```python
"""Strategist agent: generates suggestions (conseil) or moves (trade)."""
from typing import List

from shared.constants import STRATEGY_TARGETS, XSTOCK_SYMBOLS
from shared.types import ConsensusResult, RiskLabel, RebalanceMove


def generate_suggestions(
    consensus: ConsensusResult,
    positions: dict,
    strategy: str,
) -> List[str]:
    """
    Mode Conseil: generate human-readable suggestions.
    Compare current positions to strategy targets, flag deviations.
    
    Args:
        consensus: the voted consensus result
        positions: current portfolio {"TSLAx": 35.0, "AAPLx": 20.0, ...} (percentages)
        strategy: "conservative" / "balanced" / "growth" / "aggressive"
    
    Returns:
        List of suggestion strings for the frontend.
    """
    targets = STRATEGY_TARGETS.get(strategy, STRATEGY_TARGETS["balanced"])
    suggestions = []

    # Flag over-allocated positions
    for token in XSTOCK_SYMBOLS:
        current = positions.get(token, 0.0)
        target = targets.get(token, 0.0)
        diff = current - target

        if diff > 5:  # Over-allocated by more than 5%
            suggestions.append(
                f"{token} = {current:.0f}%, target = {target:.0f}% "
                f"→ reduce exposure by {diff:.0f}%"
            )
        elif diff < -5:  # Under-allocated by more than 5%
            suggestions.append(
                f"{token} = {current:.0f}%, target = {target:.0f}% "
                f"→ increase position by {abs(diff):.0f}%"
            )

    # Risk-specific suggestions
    if consensus.consensus_label == RiskLabel.HIGH:
        suggestions.insert(0, 
            f"⚠️ High risk detected (score: {consensus.consensus_score:.0f}/100). "
            f"Consider reducing volatile positions."
        )
        # Suggest moving to defensive assets
        defensive = ["SPYx", "Vx", "JPMx", "XOMx"]
        for token in defensive:
            current = positions.get(token, 0.0)
            if current < 10:
                suggestions.append(
                    f"Consider increasing {token} (currently {current:.0f}%) "
                    f"as a defensive hedge."
                )

    elif consensus.consensus_label == RiskLabel.MEDIUM:
        suggestions.insert(0,
            f"Moderate risk level (score: {consensus.consensus_score:.0f}/100). "
            f"Your portfolio could use some adjustments."
        )

    else:  # LOW
        if not suggestions:
            suggestions.append(
                f"✅ Low risk (score: {consensus.consensus_score:.0f}/100). "
                f"Your portfolio is aligned with your {strategy} strategy."
            )

    return suggestions[:8]  # Cap at 8 suggestions


def build_rebalance_moves(
    positions: dict,
    strategy: str,
) -> List[RebalanceMove]:
    """
    Mode Trade: compute exact rebalance moves to execute.
    Move from over-allocated to under-allocated positions.
    
    Args:
        positions: current portfolio {"TSLAx": 35.0, ...} (percentages)
        strategy: "conservative" / "balanced" / "growth" / "aggressive"
    
    Returns:
        List of RebalanceMove to execute (sell over → buy under).
    """
    targets = STRATEGY_TARGETS.get(strategy, STRATEGY_TARGETS["balanced"])
    moves = []

    # Calculate deviations
    sells = []  # (token, excess_pct)
    buys = []   # (token, deficit_pct)

    for token in XSTOCK_SYMBOLS:
        current = positions.get(token, 0.0)
        target = targets.get(token, 0.0)
        diff = current - target

        if diff > 2:  # Sell threshold: 2% over target
            sells.append((token, diff))
        elif diff < -2:  # Buy threshold: 2% under target
            buys.append((token, abs(diff)))

    # Sort: sell the most over-allocated first, buy the most under-allocated first
    sells.sort(key=lambda x: x[1], reverse=True)
    buys.sort(key=lambda x: x[1], reverse=True)

    # Match sells to buys
    sell_pool = sum(pct for _, pct in sells)
    buy_pool = sum(pct for _, pct in buys)

    if sell_pool == 0 or buy_pool == 0:
        return moves

    # Scale to match (can't buy more than we sell)
    scale = min(sell_pool, buy_pool)

    for token, pct in sells:
        move_pct = round(pct * scale / sell_pool, 1)
        if move_pct >= 1:  # Minimum 1% move
            moves.append(RebalanceMove(token=token, action="sell", pct=move_pct))

    for token, pct in buys:
        move_pct = round(pct * scale / buy_pool, 1)
        if move_pct >= 1:
            moves.append(RebalanceMove(token=token, action="buy", pct=move_pct))

    return moves
```

---

## File 2: `ai/strategist/profiles.py`

### Purpose
Manage investor profiles. In-memory store for the hackathon (no DB).

```python
"""Investor profile management. In-memory store for hackathon."""
from typing import Optional, Dict

from shared.constants import STRATEGY_TARGETS
from shared.types import InvestorProfile, Mode


# In-memory store (resets on restart — fine for hackathon)
_profiles: Dict[str, InvestorProfile] = {}


def create_or_update_profile(
    user_id: str,
    risk_tolerance: str = "moderate",
    investment_horizon: str = "medium",
    financial_goals: str = "growth",
    capital_available: float = 1000.0,
    sector_preferences: list = None,
) -> InvestorProfile:
    """Create or update an investor profile."""
    # Map risk tolerance to strategy
    strategy_map = {
        "conservative": "conservative",
        "moderate": "balanced",
        "aggressive": "aggressive",
    }
    strategy = strategy_map.get(risk_tolerance, "balanced")

    profile = InvestorProfile(
        user_id=user_id,
        risk_tolerance=risk_tolerance,
        investment_horizon=investment_horizon,
        financial_goals=financial_goals,
        capital_available=capital_available,
        sector_preferences=sector_preferences or [],
        strategy=strategy,
        mode=Mode.CONSEIL,  # Default to advisory mode
    )

    _profiles[user_id] = profile
    return profile


def get_profile(user_id: str) -> Optional[InvestorProfile]:
    """Get an investor profile by user ID."""
    return _profiles.get(user_id)


def set_mode(user_id: str, mode: Mode) -> Optional[InvestorProfile]:
    """Switch a user's mode between conseil and trade."""
    profile = _profiles.get(user_id)
    if profile:
        profile.mode = mode
    return profile


def get_trade_mode_users() -> list:
    """Get all users currently in Trade mode (for background task)."""
    return [p for p in _profiles.values() if p.mode == Mode.TRADE]


def recommend_allocation(profile: InvestorProfile) -> dict:
    """
    Return recommended allocation percentages based on profile.
    Returns: {"TSLAx": 15.0, "AAPLx": 10.0, ...}
    """
    targets = STRATEGY_TARGETS.get(profile.strategy, STRATEGY_TARGETS["balanced"])

    # Adjust based on sector preferences
    allocation = dict(targets)

    if profile.sector_preferences:
        # Sector → tokens mapping
        sector_tokens = {
            "tech": ["TSLAx", "AAPLx", "NVDAx", "GOOGx", "AMZNx", "METAx", "MSFTx"],
            "finance": ["JPMx", "Vx"],
            "energy": ["XOMx"],
            "pharma": ["LLYx"],
            "luxury": ["LVMHx"],
            "index": ["SPYx", "NDXx"],
            "crypto": ["MSTRx"],
        }

        # Slight boost to preferred sectors (redistribute 5% max)
        preferred_tokens = []
        for sector in profile.sector_preferences:
            preferred_tokens.extend(sector_tokens.get(sector, []))

        if preferred_tokens:
            boost_per_token = 2.0  # +2% each
            total_boost = min(len(preferred_tokens) * boost_per_token, 10.0)

            # Boost preferred
            for token in preferred_tokens:
                if token in allocation:
                    allocation[token] = allocation[token] + boost_per_token

            # Reduce non-preferred proportionally
            non_preferred = [t for t in allocation if t not in preferred_tokens and allocation[t] > 0]
            if non_preferred:
                reduce_per = total_boost / len(non_preferred)
                for token in non_preferred:
                    allocation[token] = max(0, allocation[token] - reduce_per)

    # Normalize to 100%
    total = sum(allocation.values())
    if total > 0:
        allocation = {k: round(v * 100 / total, 1) for k, v in allocation.items()}

    return allocation
```

---

## Verification
```bash
cd ai
python -c "
from strategist.agent import generate_suggestions, build_rebalance_moves
from shared.types import ConsensusResult, RiskLabel

consensus = ConsensusResult(
    consensus_label=RiskLabel.HIGH,
    consensus_score=72.3,
    confidence=0.67,
    providers_agreed='2/3',
)
positions = {'TSLAx': 35, 'AAPLx': 20, 'NVDAx': 15, 'SPYx': 10, 'GOOGx': 10, 'AMZNx': 10}

suggestions = generate_suggestions(consensus, positions, 'balanced')
print('=== CONSEIL MODE ===')
for s in suggestions:
    print(f'  {s}')

moves = build_rebalance_moves(positions, 'balanced')
print('=== TRADE MODE ===')
for m in moves:
    print(f'  {m.action} {m.pct}% {m.token}')
"
```
