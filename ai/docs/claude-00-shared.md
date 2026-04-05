# claude-00-shared.md — Foundation (BUILD FIRST)

## What this file creates
```
ai/shared/
├── constants.py          # TICKERS, N_FEATURES, STRATEGY_TARGETS
├── types.py              # All dataclasses used across the project
└── data_agent/
    └── utils.py          # compute_rsi() — ONE source of truth
```

## Why first
Every other claude-XX.md imports from `shared/`. If this doesn't exist, nothing compiles. Build this, commit, then launch the other terminals.

---

## File 1: `ai/shared/constants.py`

```python
"""Single source of truth for tickers, features, and strategy targets."""

# The 15 xStocks — ORDER MATTERS (feature vector follows this order)
TICKERS = [
    "TSLA", "AAPL", "NVDA", "GOOGL", "AMZN",
    "META", "SPY", "QQQ", "MSTR", "MSFT",
    "JPM", "V", "XOM", "LLY", "MC.PA"
]

# xStock token names (on-chain)
XSTOCK_SYMBOLS = [
    "TSLAx", "AAPLx", "NVDAx", "GOOGx", "AMZNx",
    "METAx", "SPYx", "NDXx", "MSTRx", "MSFTx",
    "JPMx", "Vx", "XOMx", "LLYx", "LVMHx"
]

# Mapping yfinance ticker → xStock symbol
TICKER_TO_XSTOCK = dict(zip(TICKERS, XSTOCK_SYMBOLS))

# Feature count: 4 features × 15 tickers + 1 (avg_correlation) = 61
FEATURES_PER_TICKER = ["ret_7d", "ret_30d", "vol_30d", "rsi"]
N_FEATURES = len(TICKERS) * len(FEATURES_PER_TICKER) + 1  # 61

# Strategy allocation targets (percentages, must sum to 100)
STRATEGY_TARGETS = {
    "conservative": {
        "SPYx": 25, "Vx": 15, "JPMx": 15, "XOMx": 10, "LLYx": 10,
        "AAPLx": 5, "MSFTx": 5, "GOOGx": 5, "LVMHx": 5, "NDXx": 5,
        "NVDAx": 0, "TSLAx": 0, "METAx": 0, "AMZNx": 0, "MSTRx": 0,
    },
    "balanced": {
        "SPYx": 15, "NDXx": 10, "AAPLx": 10, "MSFTx": 10, "GOOGx": 8,
        "NVDAx": 8, "JPMx": 7, "Vx": 7, "AMZNx": 5, "METAx": 5,
        "LLYx": 5, "XOMx": 5, "LVMHx": 3, "TSLAx": 2, "MSTRx": 0,
    },
    "growth": {
        "NVDAx": 15, "TSLAx": 12, "AMZNx": 10, "METAx": 10, "MSFTx": 10,
        "GOOGx": 8, "AAPLx": 8, "NDXx": 7, "MSTRx": 5, "LLYx": 5,
        "SPYx": 4, "JPMx": 2, "Vx": 2, "LVMHx": 2, "XOMx": 0,
    },
    "aggressive": {
        "NVDAx": 20, "TSLAx": 15, "MSTRx": 12, "METAx": 10, "AMZNx": 10,
        "GOOGx": 8, "NDXx": 8, "MSFTx": 7, "AAPLx": 5, "LLYx": 3,
        "LVMHx": 2, "SPYx": 0, "JPMx": 0, "Vx": 0, "XOMx": 0,
    },
}

# Risk thresholds
RISK_HIGH_THRESHOLD = 70
RISK_MEDIUM_THRESHOLD = 40

# Provider config
MIN_PROVIDERS_REQUIRED = 2
PROVIDER_TIMEOUT_S = 8
```

---

## File 2: `ai/shared/types.py`

```python
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
```

---

## File 3: `ai/shared/data_agent/utils.py`

```python
"""Shared utility functions. compute_rsi() is defined HERE and NOWHERE ELSE."""
import pandas as pd
import numpy as np


def compute_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    """
    RSI (Relative Strength Index) over `period` days.
    Used by BOTH train.py and fetch.py — never duplicate this function.
    """
    delta = series.diff()
    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)
    avg_gain = gain.rolling(window=period, min_periods=period).mean()
    avg_loss = loss.rolling(window=period, min_periods=period).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi
```

---

## After building these 3 files
1. Create `ai/shared/__init__.py` and `ai/shared/data_agent/__init__.py` (empty)
2. Verify imports work: `python -c "from shared.constants import TICKERS; print(len(TICKERS))"`  → should print `15`
3. Commit and push
4. **Then** launch the other 5 terminals
