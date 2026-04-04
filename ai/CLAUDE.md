# Radegast — AI Consensus Protocol

> Wallet d'investissement en actions US tokenisées (xStocks).
> Login Google → profil investisseur → AI analyse → consensus 3 modèles → settlement on-chain.
> ETHGlobal Cannes 2026 | Track: 0G Best DeFi App ($5,000) + Dynamic SDK ($1,666)

## Specs détaillées
Les specs par module sont dans `ai/docs/claude-XX-*.md`. Lis le fichier qu'on te demande.

## Règles absolues (tous les terminaux)

### 15 tickers — NE JAMAIS hardcoder
```
TSLA, AAPL, NVDA, GOOGL, AMZN, META, SPY, QQQ, MSTR, MSFT, JPM, V, XOM, LLY, MC.PA
```
Toujours importer depuis `ai/shared/constants.py`. Jamais redéfinir la liste.

### 61 features (4 × 15 + 1)
Par ticker : ret_7d, ret_30d, vol_30d, rsi. Plus avg_correlation.

### compute_rsi() — UNE seule source
Défini dans `ai/shared/data_agent/utils.py`. Importé partout. Jamais dupliqué.

### Types partagés
Tous dans `ai/shared/types.py` : RiskOutput, ConsensusResult, ConsensusRequest, RebalanceMove, InvestorProfile, PortfolioInput. Ne jamais redéfinir.

## Architecture

```
ai/
├── shared/              # Constants, types, utils, model, prompts (BUILD FIRST)
├── consensus/           # orchestrator, vote, submit_da, submit_onchain
├── strategist/          # agent.py (suggestions + moves), profiles.py
├── chat/                # advisor.py (chatbot wraps consensus en langage humain)
├── fallback/            # onnx_inference.ts + rules.ts (TypeScript, frontend)
├── server.py            # FastAPI: tous les endpoints + background task autonomous
├── providers.json       # Config des 3 providers
├── Dockerfile
└── requirements.txt
```

## 2 modes
- **Conseil** : AI recommande, user décide. `agent.py:generate_suggestions()`
- **Trade** : AI exécute automatiquement. `agent.py:build_rebalance_moves()`

## Background task (autonomous agent)
En mode Trade, scan toutes les 60s, run consensus auto, exécute les rebalances.
C'est le mot "autonomous" pour les juges 0G.

## 4 composants 0G
- **Compute** (consumer) : appels LLM via `@0glabs/0g-serving-broker`
- **Compute** (provider) : FastAPI enregistré comme provider (stretch goal)
- **Storage** : upload modèle ONNX + consensus results (= DA proxy)
- **Chain** : ConsensusSettlement.submit() via web3.py

## Fallbacks
FastAPI down → ONNX.js browser → rules.ts hardcoded. Même format de réponse partout.

## Principe UX
**Zéro jargon crypto.** Dire "action" pas "token". Dire "portefeuille" pas "wallet".

## Commandes
```bash
make ai-train          # XGBoost → ONNX
uvicorn server:app --reload --port 8000
pytest tests/
docker build -t radegast-ai .
```