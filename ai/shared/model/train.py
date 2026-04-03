"""XGBoost training → ONNX export. Run once: python -m shared.model.train"""
import os

import yfinance as yf
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType

from shared.constants import TICKERS, N_FEATURES
from shared.data_agent.utils import compute_rsi


def train_and_export():
    # 1. Download 2 years of daily close prices
    data = yf.download(TICKERS, period='2y', interval='1d')['Close']
    returns = data.pct_change().dropna()

    # 2. Build 61 features for each row
    features = pd.DataFrame(index=returns.index)
    for ticker in TICKERS:
        features[f"{ticker}_ret_7d"] = returns[ticker].rolling(7).sum()
        features[f"{ticker}_ret_30d"] = returns[ticker].rolling(30).sum()
        features[f"{ticker}_vol_30d"] = returns[ticker].rolling(30).std()
        features[f"{ticker}_rsi"] = compute_rsi(data[ticker])

    # Average pairwise correlation
    features["avg_correlation"] = returns.rolling(30).corr().groupby(level=0).mean().mean(axis=1)

    features = features.dropna()

    # 3. Target: drawdown > 3% in next 7 days
    portfolio_returns = returns.loc[features.index].mean(axis=1)
    future_drawdown = portfolio_returns.rolling(7).min().shift(-7).abs()
    target = (future_drawdown > 0.03).astype(int)

    # Align
    common_idx = features.index.intersection(target.dropna().index)
    X = features.loc[common_idx]
    y = target.loc[common_idx]

    assert X.shape[1] == N_FEATURES, f"Expected {N_FEATURES} features, got {X.shape[1]}"

    # 4. Train
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
    model = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, eval_metric='logloss')
    model.fit(X_train, y_train)

    print(f"Train accuracy: {model.score(X_train, y_train):.3f}")
    print(f"Test accuracy:  {model.score(X_test, y_test):.3f}")

    # 5. Export ONNX
    output_path = os.path.join(os.path.dirname(__file__), 'portfolio_risk.onnx')
    initial_type = [('features', FloatTensorType([None, N_FEATURES]))]
    onnx_model = onnxmltools.convert_xgboost(model, initial_types=initial_type)
    onnxmltools.utils.save_model(onnx_model, output_path)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"Model saved: {output_path} ({size_mb:.2f} MB)")
    assert size_mb < 5, f"Model too large for 0G Storage: {size_mb:.2f} MB"


if __name__ == "__main__":
    train_and_export()
