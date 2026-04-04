"""XGBoost training → ONNX export. Run once: python -m shared.model.train"""
import os

import yfinance as yf
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, GridSearchCV, TimeSeriesSplit
from sklearn.metrics import classification_report
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

    # Rename columns to f0..fN so onnxmltools ONNX export works (requires 'f%d' pattern)
    X.columns = [f"f{i}" for i in range(X.shape[1])]

    # 4. Train with GridSearchCV
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    pos_count = y_train.sum()
    neg_count = len(y_train) - pos_count
    default_spw = neg_count / pos_count if pos_count > 0 else 1

    param_grid = {
        'n_estimators': [100, 200],
        'max_depth': [3, 5],
        'learning_rate': [0.05, 0.1],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0],
        'min_child_weight': [1, 3],
        'gamma': [0, 0.1],
        'scale_pos_weight': [1, default_spw],
    }

    base_model = XGBClassifier(eval_metric='logloss')
    tscv = TimeSeriesSplit(n_splits=5)

    print("Starting grid search...")
    grid_search = GridSearchCV(
        base_model,
        param_grid,
        cv=tscv,
        scoring='f1_weighted',
        n_jobs=-1,
        verbose=1,
    )
    grid_search.fit(X_train, y_train)
    print("Grid search done.")

    print(f"Best params: {grid_search.best_params_}")
    print(f"Best F1 score (CV): {grid_search.best_score_:.3f}")

    # Re-train final model with best params on full X_train
    model = XGBClassifier(eval_metric='logloss', **grid_search.best_params_)
    model.fit(X_train, y_train)

    print(f"Train accuracy: {model.score(X_train, y_train):.3f}")
    print(f"Test accuracy:  {model.score(X_test, y_test):.3f}")
    print("\nClassification report (test set):")
    print(classification_report(y_test, model.predict(X_test)))

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
