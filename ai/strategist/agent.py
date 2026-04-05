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
