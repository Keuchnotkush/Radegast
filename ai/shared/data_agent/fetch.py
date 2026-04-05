"""Fetch live market features for inference. Same feature engineering as train.py."""
import json
from pathlib import Path

import yfinance as yf
import pandas as pd
import numpy as np

from shared.constants import TICKERS, N_FEATURES
from shared.types import PortfolioInput
from shared.data_agent.utils import compute_rsi


MOCK_PRICES_PATH = Path(__file__).parent / "mock_prices.json"


def fetch_features(positions: dict) -> PortfolioInput:
    """
    Download last 60 days of prices, compute 61 features.
    Falls back to mock_prices.json if yfinance is unavailable.
    """
    try:
        data = yf.download(TICKERS, period='60d', interval='1d')['Close']
        if data.empty or len(data) < 35:
            raise ValueError("Insufficient data from yfinance")
    except Exception:
        data = _load_mock_prices()

    returns = data.pct_change().dropna()
    row = _compute_feature_row(data, returns)

    assert len(row) == N_FEATURES, f"Expected {N_FEATURES} features, got {len(row)}"

    return PortfolioInput(
        features=row,
        tickers=TICKERS,
        positions=positions,
    )


def _compute_feature_row(data: pd.DataFrame, returns: pd.DataFrame) -> list:
    """Compute the latest feature vector (61 values)."""
    row = []
    for ticker in TICKERS:
        ret_7d = returns[ticker].iloc[-7:].sum()
        ret_30d = returns[ticker].iloc[-30:].sum()
        vol_30d = returns[ticker].iloc[-30:].std()
        rsi = compute_rsi(data[ticker]).iloc[-1]
        row.extend([ret_7d, ret_30d, vol_30d, rsi])

    # avg_correlation
    corr_matrix = returns.iloc[-30:].corr()
    avg_corr = corr_matrix.values[np.triu_indices_from(corr_matrix.values, k=1)].mean()
    row.append(avg_corr)

    return [float(x) if not np.isnan(x) else 0.0 for x in row]


def _load_mock_prices() -> pd.DataFrame:
    """Load mock prices from JSON file as fallback."""
    with open(MOCK_PRICES_PATH) as f:
        raw = json.load(f)
    return pd.DataFrame(raw).set_index("date")
