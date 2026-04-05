# AI Integration — Current Flow & Status

## What Works End-to-End

### Consensus Pipeline
```
Frontend (advisor page)
  → POST /api/consensus (backend :4000)
    → POST /api/consensus (AI :8000)
      → fetch_features() — 61 features from yfinance (15 tickers, 60 days)
      → 3 providers in parallel:
        1. XGBoost — ONNX model (portfolio_risk.onnx) ✅
        2. Bull Analyst — 0G Compute (Qwen 2.5 7B) ✅
        3. Bear Auditor — 0G Compute (Qwen 2.5 7B) ✅
      → Majority vote → ConsensusResult
      → Submit to 0G Storage (DA) — mock hash ✅
      → Submit on-chain (ConsensusSettlement) — mock tx ✅
    ← { consensus_label, consensus_score, confidence, suggestions, moves }
  ← Displayed on advisor page
```

### Autonomous Agent (Background)
```
AI server startup → asyncio task every 60s
  → get_trade_mode_users()
  → For each trade-mode user:
    → Fetch on-chain holdings from backend (/api/holdings/:address)
    → run_consensus(mode=TRADE)
    → build_rebalance_moves() — compare holdings vs strategy targets
    → execute_rebalance() — mock trades (MOCK_TRADES=true)
  → Results stored in memory → GET /api/agent/latest/:userId
  → Dashboard polls every 15s and displays results
```

### Frontend Pages
- **Advisor page** — toggle AI Advisor → fetches consensus → shows risk score, model votes, recommendations
- **Dashboard** — AI Activity section polls agent results, shows trades/suggestions
- **Settings** — autonomous trading toggle registers user in AI service for background agent

## What's Hardcoded / Needs Fixing

### 1. Demo Wallet Address
**File:** `ai/server.py` (autonomous agent)
**Issue:** Agent uses hardcoded `0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174` to fetch holdings when user_id isn't a wallet address.
**Fix:** Pass actual Dynamic wallet address when activating trade mode. The `activateAuto()` in `store.tsx` sends `user_id: "default"` — should send the wallet address from `useDynamicContext().primaryWallet.address`.

### 2. Mock Trades
**File:** `ai/consensus/execute_trades.py`
**Issue:** `MOCK_TRADES=true` by default — trades are logged but not executed on-chain.
**Fix:** Set `MOCK_TRADES=false` in `ai/.env` when ready. The code already supports real execution via `mint()`/`burn()` on xStock contracts.

### 3. Mock On-Chain Settlement
**File:** `ai/.env` — `MOCK_ONCHAIN=true`
**Issue:** ConsensusSettlement.submit() is mocked — doesn't write to 0G Chain.
**Fix:** Set `MOCK_ONCHAIN=false`. Requires the signer to have SUBMITTER_ROLE on the ConsensusSettlement contract.

### 4. Mock DA (Data Availability)
**File:** `ai/.env` — `MOCK_DA=true`
**Issue:** Consensus results aren't uploaded to 0G Storage.
**Fix:** Set `MOCK_DA=false`. Requires `OG_STORAGE_INDEXER` and `PRIVATE_KEY` with funds for gas.

### 5. Local Fallback Providers
**File:** `ai/consensus/orchestrator.py`
**Issue:** If fewer than 2 real providers respond, local fallback providers are injected (hardcoded LOW/MEDIUM risk). This is a dev safety net.
**Fix:** Remove once all 3 providers are reliably available. The fallback while loop should be removed for production.

### 6. Positions Not Sent from Frontend Advisor
**File:** `frontend/app/dashboard/advisor/page.tsx`
**Issue:** The `useAI` hook version (Kassim's) may not pass portfolio positions correctly to the consensus call.
**Fix:** Verify `buildPositions()` generates correct xStock percentages from holdings.

### 7. Agent Results Not Persisted
**File:** `ai/server.py` — `_agent_results` dict
**Issue:** Agent results are stored in memory — lost on restart.
**Fix:** Store in a database or file for persistence. Not critical for hackathon demo.

## Environment Files

### `ai/.env`
```env
PRIVATE_KEY=0x...
OG_RPC=https://evmrpc-testnet.0g.ai/
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai/
MOCK_DA=true              # ← set false for real DA
MOCK_ONCHAIN=true         # ← set false for real chain
MOCK_TRADES=true          # ← set false for real trades (add to .env)
CONSENSUS_SETTLEMENT=0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f
OG_COMPUTE_PROVIDER_ADDR=0xa48f01287233509FD694a22Bf840225062E67836
AGENT_INTERVAL=60
```

### `backend/.env`
```env
PRIVATE_KEY=0x...
OG_RPC=https://evmrpc-testnet.0g.ai
MOCK_ONCHAIN=true
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
```

## API Endpoints (AI Integration)

| Endpoint | Method | Flow |
|---|---|---|
| `/api/consensus` | POST | Frontend → Backend → AI service |
| `/api/profile/mode` | POST | Frontend → Backend → AI (set trade/conseil mode) |
| `/api/agent/latest/:userId` | GET | Frontend → Backend → AI (poll agent results) |
| `/api/holdings/:address` | GET | AI agent → Backend → 0G Chain (on-chain balances) |
| `/v1/chat/completions` | POST | AI orchestrator → AI XGBoost provider (internal) |

## Running Locally

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — AI Service
cd ai && source venv/bin/activate && uvicorn server:app --port 8000

# Terminal 3 — Frontend
cd frontend && npx next dev --turbo
```

## Priority for Demo
1. ✅ Consensus pipeline works (3 providers)
2. ✅ Advisor page shows recommendations
3. ✅ Dashboard shows AI activity
4. ⬜ Wire real wallet address to agent (instead of hardcoded)
5. ⬜ Set MOCK_TRADES=false for live demo
6. ⬜ Remove fallback providers
