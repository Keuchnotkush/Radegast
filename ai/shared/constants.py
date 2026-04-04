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

# On-chain xStock token addresses (0G Testnet, Chain 16602)
XSTOCK_ADDRESSES = {
    "TSLAx": "0x2dC821592626Ab6375E5B84b4EF94eCb1478EBa6",
    "AAPLx": "0xbF7878757DcbCF28E024aEFa7B03B3cF6267aE8c",
    "NVDAx": "0xC82291F9b5f22FAecB5530DcF54E6D2086b45fde",
    "GOOGx": "0x4eb8fEe5CBDBC434ee88F7781948e8799Ed7Fb82",
    "AMZNx": "0xEfF7d05B11CC848Bf7EAbA74a6021B0567aB841d",
    "METAx": "0xa483a4342F4D4D8e27364876cF55f3baaFb93310",
    "SPYx":  "0xC04F35d970F08F09c23b8C97538fCf62a57c255C",
    "NDXx":  "0x88B700918cd051ffa6B02274DE53584695E06bce",
    "MSTRx": "0x6ce30D33c6091425bbe162cA353CDbffF7C090d9",
    "MSFTx": "0x26F1B3D351Cb8a23E6cCeA93d5143Dc1e185cFA0",
    "JPMx":  "0x43da4eCBa6DfD3b901Dd5238a77608c52C420e5b",
    "Vx":    "0x781C0de58df40F5f6a1b661F3CB0a5B551A3b683",
    "XOMx":  "0x2bEd346a985866B497E052fB807bE4E3FB4D015E",
    "LLYx":  "0xa37e660218B3De658444648873d3016E1aD1681d",
    "LVMHx": "0x425f1CF3e4f3762B58a32d24a80b7d767Af58441",
}
