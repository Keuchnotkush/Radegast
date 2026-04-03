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
