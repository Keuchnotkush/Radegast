# Radegast AI — Workflow complet

## Vue d'ensemble

```
Frontend (Next.js)
    │
    ├── POST /api/chat         → Chatbot conversationnel
    ├── POST /api/consensus    → Analyse de risque (conseil ou trade)
    ├── POST /api/recommend    → Allocation recommandée
    ├── POST /api/profile      → Création/update profil
    ├── GET  /api/profile/:id  → Lecture profil
    ├── GET  /health           → Status serveur + modèle
    └── POST /v1/chat/completions → Provider XGBoost (format OpenAI)
```

---

## Les 3 modes d'exécution

### Mode 1 — Conseil (advisory)
```
User → /api/consensus (mode: "conseil")
  → orchestrator.run_consensus()
    → fetch_features()          # 61 features
    → 3 providers en parallèle  # XGBoost + Bull + Bear
    → compute_consensus()       # vote majorité
    → submit_to_da()            # upload 0G Storage
    → generate_suggestions()    # texte lisible
  ← ConsensusResult { label, score, confidence, suggestions[], da_hash }
```

### Mode 2 — Trade (autonomous)
```
User → /api/consensus (mode: "trade")
  → orchestrator.run_consensus()
    → fetch_features()
    → 3 providers en parallèle
    → compute_consensus()
    → submit_to_da()            # upload 0G Storage
    → submit_onchain()          # ConsensusSettlement.submit() on-chain
    → build_rebalance_moves()   # sell/buy actions
  ← ConsensusResult { label, score, confidence, moves[], da_hash, tx_hash }
```

### Mode 3 — Chat (conversationnel)
```
User → /api/chat (message texte)
  → advisor.handle_message()
    → Détection d'intent (greeting/profile/risk/recommend/explain)
    → Si risk → run_consensus() injecté via callback
    → Réponse en langage naturel (zero jargon crypto)
  ← { reply: str, consensus: optional, action: str }
```

### Background — Agent autonome
```
server.py startup → asyncio.create_task(autonomous_agent())
  → Toutes les 60s :
    → get_trade_mode_users()
    → Pour chaque user en mode Trade :
      → run_consensus(mode=TRADE)
      → Si label != LOW → log les moves à exécuter
```

---

## Pipeline de consensus détaillé

```
run_consensus(ConsensusRequest)
│
├── 1. FETCH FEATURES
│   └── fetch_features(positions)
│       ├── yfinance.download(15 tickers, 60 jours)
│       │   └── Fallback → mock_prices.json (43 jours simulés)
│       └── _compute_feature_row()
│           ├── Par ticker (×15) : ret_7d, ret_30d, vol_30d, rsi
│           └── avg_correlation (matrice 30j)
│           → PortfolioInput { features[61], tickers[15], positions }
│
├── 2. CALL 3 PROVIDERS (asyncio.gather, parallèle)
│   │
│   ├── Provider 1 : XGBoost (HTTP direct)
│   │   └── POST localhost:8000/v1/chat/completions
│   │       └── server.py → onnx_session.run() → RiskOutput
│   │           source: "xgboost"
│   │
│   ├── Provider 2 : Bull Analyst (0G Compute)
│   │   └── og_compute.call_provider(OG_PROVIDER_ADDR, bull_prompt)
│   │       └── og_compute_call.mjs → broker SDK
│   │           ├── broker.inference.acknowledgeProviderSigner()
│   │           ├── broker.inference.getServiceMetadata() → endpoint, model
│   │           ├── broker.inference.getRequestHeaders() → signed headers
│   │           ├── fetch(endpoint/chat/completions) → Qwen 2.5 7B
│   │           └── broker.inference.processResponse() → verified=true
│   │       → RiskOutput { source: "bull_analyst" }
│   │
│   └── Provider 3 : Bear Auditor (0G Compute)
│       └── Même flow que Provider 2, mais avec bear_prompt
│           → RiskOutput { source: "bear_auditor" }
│
│   Fallback : Si < 2 providers répondent →
│       ConsensusResult(label=MEDIUM, score=50, confidence=0.0)
│
├── 3. VOTE (consensus/vote.py)
│   ├── Majority vote sur risk_label (Counter.most_common)
│   ├── Score = moyenne des risk_scores
│   ├── Confidence = agreed / total (ex: 2/3 = 0.67)
│   └── Top factors = merge dédupliqué par fréquence
│   → ConsensusResult { label, score, confidence, providers_agreed }
│
├── 4. SUBMIT TO DA (consensus/submit_da.py)
│   ├── MOCK_DA=true → SHA-256 hash (pas de réseau)
│   └── MOCK_DA=false → _upload_via_node()
│       └── subprocess → scripts/og_storage_upload.mjs
│           ├── new MemData(json) → merkleTree() → rootHash
│           └── indexer.upload() → 0G Storage testnet
│       → da_hash = "0x..." (rootHash)
│
├── 5. SUBMIT ON-CHAIN (consensus/submit_onchain.py)
│   │   (Mode Trade uniquement)
│   ├── MOCK_ONCHAIN=true → "0xmock_..." hash
│   └── MOCK_ONCHAIN=false →
│       ├── Web3(HTTPProvider(evmrpc-testnet.0g.ai))
│       ├── ConsensusSettlement.submit(
│       │     user,           # address
│       │     score × 100,    # uint16 basis points (72.3 → 7230)
│       │     confidence × 10000, # uint16 (0.67 → 6700)
│       │     label,          # uint8 (LOW=0, MEDIUM=1, HIGH=2)
│       │     agreed,         # uint8
│       │     total,          # uint8
│       │     da_hash         # bytes32
│       │   )
│       └── wait_for_transaction_receipt(timeout=30)
│       → tx_hash = "0x..."
│
└── 6. GENERATE SUGGESTIONS / MOVES (strategist/agent.py)
    ├── Mode Conseil → generate_suggestions()
    │   ├── Compare positions vs STRATEGY_TARGETS
    │   ├── Flag over/under-allocated (seuil 5%)
    │   └── Ajoute alertes si HIGH risk
    │   → suggestions: List[str]
    │
    └── Mode Trade → build_rebalance_moves()
        ├── Calcule les deltas vs target
        ├── Trie sells (descending) et buys (descending)
        ├── Scale pour matcher sell_pool / buy_pool
        └── Minimum 1% par move
        → moves: List[RebalanceMove { token, action, pct }]
```

---

## Chatbot — Routing des intents

```
handle_message(user_id, message, run_consensus_fn, positions)
│
├── GREETING ("hello", "hi", "bonjour")
│   ├── Avec profil → "Welcome back! Strategy = X"
│   └── Sans profil → "I'm your advisor. Conservative, moderate, or aggressive?"
│
├── PROFILE ("conservative", "aggressive", "strategy", "tolerance")
│   ├── Détecte risk_tolerance et horizon depuis le texte
│   ├── create_or_update_profile()
│   ├── recommend_allocation() → top 5 stocks
│   └── "Got it! Strategy = X. Here's your allocation..."
│
├── RISK ("risk", "safe", "crash", "volatile", "worried")
│   ├── Si pas de positions → utilise recommend_allocation()
│   ├── Crée ConsensusRequest → await run_consensus_fn()
│   └── _format_consensus_response()
│       ├── HIGH → "Red alert, elevated risk..."
│       ├── MEDIUM → "Moderate risk, some adjustments..."
│       └── LOW → "Portfolio looks solid..."
│
├── RECOMMEND ("recommend", "suggest", "buy", "invest", "portfolio")
│   ├── recommend_allocation(profile)
│   ├── Trie par % descendant
│   └── "Based on your X strategy: NVDA 15%, TSLA 12%..."
│
├── EXPLAIN ("explain", "what is", "why", "how")
│   ├── RSI, volatility, diversification, drawdown, rebalancing
│   └── Explications en langage simple
│
└── DEFAULT → Menu d'aide avec les options disponibles
```

---

## Profils investisseur

```
profiles.py — stockage en mémoire (dict)

create_or_update_profile(user_id, risk_tolerance, horizon)
│
├── risk_tolerance → strategy mapping :
│   ├── "conservative" → strategy "conservative"
│   ├── "moderate"     → strategy "balanced"
│   └── "aggressive"   → strategy "aggressive"
│
└── InvestorProfile { user_id, risk_tolerance, horizon, strategy, mode }

recommend_allocation(profile)
│
├── Base = STRATEGY_TARGETS[profile.strategy]
├── Boost secteurs préférés (+5% chacun)
├── Normalise à 100%
└── → dict { "TSLAx": 15.0, "SPYx": 10.0, ... }

set_mode(user_id, Mode.TRADE | Mode.CONSEIL)

get_trade_mode_users() → List[InvestorProfile] où mode == TRADE
```

---

## Modèle XGBoost

```
Training (shared/model/train.py)
│
├── Download 2 ans de prix (yfinance, 15 tickers)
├── Feature engineering : ret_7d, ret_30d, vol_30d, rsi × 15 + avg_corr = 61
├── Target : drawdown 7 jours > 1% → binary classification
├── GridSearchCV (8 hyperparams, TimeSeriesSplit k=5)
├── Export XGBoost → ONNX (< 5MB)
└── → shared/model/portfolio_risk.onnx

Inference (server.py /v1/chat/completions)
│
├── Parse features[61] du body OpenAI-compatible
├── onnx_session.run(features) → proba[drawdown]
├── risk_score = proba × 100
├── risk_label = HIGH (>70) / MEDIUM (>40) / LOW
├── top_factors = top 3 feature importances
└── → RiskOutput { risk_score, risk_label, top_factors, source: "xgboost" }
```

---

## Intégration 0G — 4 composants

### 0G Compute (consumer)
```
Python (og_compute.py)
  → asyncio.create_subprocess_exec("node", "og_compute_call.mjs", "call", addr, prompt)
    → Node.js (og_compute_call.mjs)
      → createZGComputeNetworkBroker(wallet)
      → broker.inference.acknowledgeProviderSigner()
      → broker.inference.getServiceMetadata() → { endpoint, model }
      → broker.inference.getRequestHeaders(addr, body) → signed headers
      → fetch(endpoint + "/chat/completions", { headers, body })
      → broker.inference.processResponse() → verified
    ← stdout: { content, model, provider, verified }
  ← parsed JSON → RiskOutput
```

### 0G Storage (modèle ONNX)
```
scripts/og_storage_upload.mjs
  → Indexer(indexer_url) + MemData(onnx_bytes)
  → merkleTree() → rootHash
  → indexer.upload() → txHash
  → .env : OG_MODEL_ROOT_HASH, OG_MODEL_TX_HASH
```

### 0G Storage (DA proxy)
```
submit_da.py → _upload_via_node(consensus_json)
  → subprocess → og_storage_upload.mjs
    → Upload ConsensusResult JSON blob
  ← { rootHash, txHash }
  → consensus.da_hash = rootHash
```

### 0G Chain (settlement)
```
submit_onchain.py
  → Web3(evmrpc-testnet.0g.ai)
  → ConsensusSettlement.submit(user, score_bp, confidence_bp, label, agreed, total, da_hash)
  → sign + send_raw_transaction
  → wait_for_receipt
  → consensus.tx_hash = "0x..."
```

---

## Structure des fichiers

```
ai/
├── server.py                    # FastAPI : endpoints + agent autonome
├── .env                         # Config 0G (clé privée, RPC, contrat)
├── Dockerfile                   # Python 3.11 + Node.js 20
├── requirements.txt             # Dépendances Python
│
├── shared/
│   ├── constants.py             # 15 TICKERS, 61 N_FEATURES, STRATEGY_TARGETS, XSTOCK_ADDRESSES
│   ├── types.py                 # RiskOutput, ConsensusResult, ConsensusRequest, RebalanceMove, ...
│   ├── data_agent/
│   │   ├── utils.py             # compute_rsi() — source unique
│   │   ├── fetch.py             # fetch_features() → PortfolioInput (61 features)
│   │   └── mock_prices.json     # Fallback 15 tickers, 43 jours
│   ├── model/
│   │   ├── train.py             # XGBoost → ONNX (GridSearchCV)
│   │   └── portfolio_risk.onnx  # Modèle entraîné (28KB)
│   └── prompts/
│       ├── llm_analysis_prompt.txt  # Prompt bull analyst (Provider 2)
│       └── llm_bear_prompt.txt      # Prompt bear auditor (Provider 3)
│
├── consensus/
│   ├── orchestrator.py          # Pipeline complet : fetch → providers → vote → DA → chain
│   ├── vote.py                  # Majority vote (Counter.most_common)
│   ├── og_compute.py            # Wrapper async Python → Node.js sidecar
│   ├── submit_da.py             # Upload ConsensusResult → 0G Storage
│   └── submit_onchain.py        # ConsensusSettlement.submit() on-chain
│
├── strategist/
│   ├── agent.py                 # generate_suggestions() + build_rebalance_moves()
│   └── profiles.py              # Gestion profils investisseur + allocations
│
├── chat/
│   └── advisor.py               # Chatbot : intent routing + réponses plain language
│
├── scripts/
│   ├── package.json             # @0glabs/0g-serving-broker, @0gfoundation/0g-ts-sdk, ethers
│   ├── og_compute_call.mjs      # Sidecar Node.js : list / setup / call via broker SDK
│   └── og_storage_upload.mjs    # Upload données vers 0G Storage
│
└── tests/
    ├── test_smoke.py            # Tests unitaires rapides
    └── test_full_pipeline.sh    # Test E2E complet (50 checks)
```

---

## Types de données

```
PortfolioInput {
  features: float[61]       # 4 × 15 tickers + avg_correlation
  tickers: str[15]          # TSLA, AAPL, NVDA, ...
  positions: dict            # {"TSLAx": 35.0, "AAPLx": 20.0}
}

RiskOutput {
  risk_score: float          # 0-100
  risk_label: RiskLabel      # LOW / MEDIUM / HIGH
  top_factors: str[3]        # ex: "TSLA RSI overbought (72)"
  source: str                # "xgboost" / "bull_analyst" / "bear_auditor"
}

ConsensusResult {
  consensus_label: RiskLabel
  consensus_score: float     # moyenne des scores
  confidence: float          # 0.0 - 1.0 (agreed/total)
  providers_agreed: str      # "2/3" ou "3/3"
  suggestions: str[]         # Mode Conseil
  moves: RebalanceMove[]     # Mode Trade
  da_hash: str               # 0G Storage rootHash
  tx_hash: str               # 0G Chain tx (Trade only)
}

RebalanceMove {
  token: str                 # "TSLAx"
  action: str                # "buy" ou "sell"
  pct: float                 # pourcentage à déplacer
}

ConsensusRequest {
  user: str                  # adresse wallet
  positions: dict            # portfolio actuel
  strategy: str              # conservative / balanced / growth / aggressive
  mode: Mode                 # conseil / trade
}
```

---

## Fallback chain (3 niveaux)

```
Niveau 1 : FastAPI (Python)
  └── XGBoost ONNX + 2 LLMs via 0G Compute
      Timeout : 8s HTTP, 45s 0G Compute

Niveau 2 : ONNX.js (browser)
  └── frontend/lib/ai/onnx_inference.ts
      Même modèle portfolio_risk.onnx, exécuté en WASM

Niveau 3 : Rules hardcoded (browser)
  └── frontend/lib/ai/rules.ts
      Score de base 30 + pénalités :
        concentration > 30% → +20
        tech > 60% → +15
        volatile > 40% → +15
        pas de defensif → +10
        MSTR > 15% → +10

Toutes les réponses suivent le même format RiskOutput.
```

---

## Endpoints réseau

| Endpoint | Méthode | Input | Output |
|---|---|---|---|
| `/health` | GET | — | `{ status, model_loaded, tickers, features }` |
| `/api/consensus` | POST | `ConsensusRequestBody` | `ConsensusResult` |
| `/api/chat` | POST | `{ user_id, message, positions? }` | `{ reply, consensus?, action }` |
| `/api/profile` | POST | `{ user_id, risk_tolerance, ... }` | `InvestorProfile` |
| `/api/profile/:id` | GET | — | `InvestorProfile` |
| `/api/recommend` | POST | `{ user_id, risk_tolerance }` | `{ allocation }` |
| `/v1/chat/completions` | POST | OpenAI format | OpenAI format (XGBoost) |

---

## Variables d'environnement

| Variable | Valeur | Utilisé par |
|---|---|---|
| `PRIVATE_KEY` | Clé privée wallet 0G | og_compute, submit_da, submit_onchain |
| `OG_RPC` | `https://evmrpc-testnet.0g.ai` | og_compute, submit_onchain |
| `OG_STORAGE_INDEXER` | `https://indexer-storage-testnet-turbo.0g.ai` | og_storage_upload |
| `MOCK_DA` | `false` | submit_da.py |
| `MOCK_ONCHAIN` | `false` | submit_onchain.py |
| `CONSENSUS_SETTLEMENT` | `0x3dBC...524f` | submit_onchain.py |
| `OG_COMPUTE_PROVIDER_ADDR` | `0xa48f...7836` | orchestrator.py |
| `OG_MODEL_ROOT_HASH` | `0xf143...b179` | server.py (info) |
| `OG_MODEL_TX_HASH` | `0x2244...b2cd` | server.py (info) |
| `AGENT_INTERVAL` | `60` | server.py (agent autonome) |
