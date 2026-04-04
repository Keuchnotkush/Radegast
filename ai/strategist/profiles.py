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
