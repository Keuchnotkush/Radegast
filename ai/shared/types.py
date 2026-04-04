"""All dataclasses shared across the project. Import from here, never redefine."""
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum


class RiskLabel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Mode(str, Enum):
    CONSEIL = "conseil"
    TRADE = "trade"


@dataclass
class PortfolioInput:
    """61 features vector + metadata."""
    features: List[float]  # length = N_FEATURES (61)
    tickers: List[str]     # length = 15
    positions: dict        # {"TSLAx": 35.0, "AAPLx": 20.0, ...} — percentages


@dataclass
class RiskOutput:
    """What each provider returns."""
    risk_score: float          # 0-100
    risk_label: RiskLabel      # LOW / MEDIUM / HIGH
    top_factors: List[str]     # top 3 risk factors
    source: str = "unknown"    # "xgboost" / "llm_a" / "llm_b" / "local_fallback" / "rules"


@dataclass
class RebalanceMove:
    """A single trade action."""
    token: str      # "TSLAx"
    action: str     # "buy" or "sell"
    pct: float      # percentage to move


@dataclass
class ConsensusResult:
    """Final output — what the frontend receives."""
    consensus_label: RiskLabel
    consensus_score: float
    confidence: float              # 0.0 - 1.0
    providers_agreed: str          # "2/3" or "3/3"
    suggestions: List[str] = field(default_factory=list)       # Conseil mode
    moves: List[RebalanceMove] = field(default_factory=list)   # Trade mode
    trade_results: List[dict] = field(default_factory=list)    # Trade execution receipts
    tx_hash: Optional[str] = None  # Trade mode only
    da_hash: Optional[str] = None  # 0G Storage rootHash


@dataclass
class ConsensusRequest:
    """What the frontend sends."""
    user: str           # wallet address or user ID
    positions: dict     # {"TSLAx": 35.0, ...}
    strategy: str       # "conservative" / "balanced" / "growth" / "aggressive"
    mode: Mode          # "conseil" / "trade"


@dataclass
class InvestorProfile:
    """User's investment profile for chatbot personalization."""
    user_id: str
    risk_tolerance: str       # "conservative" / "moderate" / "aggressive"
    investment_horizon: str   # "short" / "medium" / "long"
    financial_goals: str      # "growth" / "income" / "preservation"
    capital_available: float  # in USD
    sector_preferences: List[str] = field(default_factory=list)
    strategy: str = "balanced"
    mode: Mode = Mode.CONSEIL
