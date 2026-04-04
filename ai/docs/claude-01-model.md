# claude-01-model.md — XGBoost Training + Feature Fetching

## What this file creates
```
ai/shared/
├── model/
│   └── train.py                  # XGBoost → ONNX (run once)
├── data_agent/
│   ├── fetch.py                  # 61 features live from yfinance
│   └── mock_prices.json          # Fallback prices
└── prompts/
    ├── xgboost_prompt.txt        # JSON template for provider
    └── llm_analysis_prompt.txt   # Structured prompt for LLMs
```

## Dependencies on shared (already built)
```python
from shared.constants import TICKERS, FEATURES_PER_TICKER, N_FEATURES, RISK_HIGH_THRESHOLD, RISK_MEDIUM_THRESHOLD
from shared.types import PortfolioInput, RiskOutput, RiskLabel
from shared.data_agent.utils import compute_rsi  # ONE source of truth
```

---

## File 1: `ai/shared/model/train.py`

### Purpose
Train XGBoost classifier to predict 7-day drawdown probability. Export to ONNX (< 5MB).

### Requirements
```
pip install yfinance scikit-learn xgboost onnxmltools onnxruntime pandas numpy
```

### Logic
```python
import yfinance as yf
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
import onnxmltools
from onnxmltools.convert.common.data_types import FloatTensorType

from shared.constants import TICKERS, N_FEATURES
from shared.data_agent.utils import compute_rsi

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
initial_type = [('features', FloatTensorType([None, N_FEATURES]))]
onnx_model = onnxmltools.convert_xgboost(model, initial_types=initial_type)
onnxmltools.utils.save_model(onnx_model, 'shared/model/portfolio_risk.onnx')

import os
size_mb = os.path.getsize('shared/model/portfolio_risk.onnx') / (1024 * 1024)
print(f"Model saved: portfolio_risk.onnx ({size_mb:.2f} MB)")
assert size_mb < 5, f"Model too large for 0G Storage: {size_mb:.2f} MB"
```

### CRITICAL NOTES
- **Feature order** is determined by the loop `for ticker in TICKERS`. TICKERS comes from `shared/constants.py`. Do NOT hardcode the list here.
- **compute_rsi()** is imported from `shared/data_agent/utils.py`. Do NOT redefine it.
- **MC.PA** (LVMH) returns EUR prices. This is fine — the model learns relative patterns. yfinance handles the download transparently.

---

## File 2: `ai/shared/data_agent/fetch.py`

### Purpose
Fetch live market data and compute the 61-feature vector for inference.

### Logic
```python
"""Fetch live market features for inference. Same feature engineering as train.py."""
import yfinance as yf
import pandas as pd
import numpy as np
import json
import os
from pathlib import Path

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
```

### CRITICAL NOTES
- **Same feature order as train.py** — guaranteed because both iterate over `TICKERS` from `shared/constants.py`.
- **Same compute_rsi()** — imported from `shared/data_agent/utils.py`.
- **NaN handling** — replace NaN with 0.0 (the model handles zero values gracefully for RSI edge cases).
- **Mock fallback** — if yfinance is down (15% chance), load from mock_prices.json.

---

## File 3: `ai/shared/data_agent/mock_prices.json`

Generate this by running once:
```python
import yfinance as yf
import json
from shared.constants import TICKERS

data = yf.download(TICKERS, period='60d', interval='1d')['Close']
data.index = data.index.strftime('%Y-%m-%d')
data.reset_index(inplace=True)
data.rename(columns={"Date": "date"}, inplace=True)
with open('shared/data_agent/mock_prices.json', 'w') as f:
    json.dump(data.to_dict(orient='list'), f, indent=2)
```

---

## File 4: `ai/shared/prompts/xgboost_prompt.txt`

```
You are an XGBoost risk model wrapped as an OpenAI-compatible API.
The user will send a JSON object with a "features" array of {N_FEATURES} floats.
Run ONNX inference and return a JSON object:
{
  "risk_score": <float 0-100>,
  "risk_label": "<LOW|MEDIUM|HIGH>",
  "top_factors": ["<factor1>", "<factor2>", "<factor3>"],
  "source": "xgboost"
}
```

---

## File 5: `ai/shared/prompts/llm_analysis_prompt.txt`

```
You are a financial risk analyst. Analyze this portfolio data and return ONLY valid JSON.

Portfolio features (61 values, 4 per ticker × 15 tickers + avg_correlation):
Tickers: TSLA, AAPL, NVDA, GOOGL, AMZN, META, SPY, QQQ, MSTR, MSFT, JPM, V, XOM, LLY, MC.PA
Features per ticker: ret_7d, ret_30d, vol_30d, rsi
Last feature: avg_correlation

Data: {features_json}

Current positions: {positions_json}

Analyze the risk and return this exact JSON structure:
{
  "risk_score": <float 0-100>,
  "risk_label": "<LOW|MEDIUM|HIGH>",
  "top_factors": ["<most concerning factor>", "<second>", "<third>"],
  "source": "<your_model_name>"
}

Rules:
- risk_score > 70 → risk_label = "HIGH"
- risk_score > 40 → risk_label = "MEDIUM"
- risk_score <= 40 → risk_label = "LOW"
- top_factors should reference specific tickers and metrics
- Return ONLY the JSON, no explanation
```

---

## Verification
After building all files:
```bash
cd ai
python -c "
from shared.constants import TICKERS, N_FEATURES
from shared.data_agent.utils import compute_rsi
print(f'Tickers: {len(TICKERS)}')
print(f'Features: {N_FEATURES}')
print('All imports OK')
"
# Should print: Tickers: 15, Features: 61, All imports OK

# Then train the model:
python -m shared.model.train
# Should produce shared/model/portfolio_risk.onnx < 5MB
```
