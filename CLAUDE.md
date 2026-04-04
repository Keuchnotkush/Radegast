# RADEGAST

AI-powered tokenized stock portfolio on 0G & Dynamic. ETHGlobal Cannes 2026.

## Vision
Allow anyone — especially people who know nothing about crypto — to invest in US stocks (tokenized as xStocks ERC-20) from anywhere, 24/7, with AI portfolio management and ZK proof-of-solvency for banks.

## UX Principle (NON-NEGOTIABLE)
The user must NEVER know they're using crypto. Zero wallet jargon, zero gas, zero seed phrases. This is a stock investing app, not a dApp.

## Use Cases
1. **Invest 24/7** — Google login, pick strategy, buy xStocks. Fractional from $1.
2. **AI Advisor / Agent** — 3 AI models vote. Advisory mode (suggestions) or Trade mode (auto-execute).
3. **ZK Proof of Solvency** — Prove portfolio value to banks without revealing holdings. Noir.js in browser.

## Project Structure
```
Radegast/
  frontend/       # Next.js 16, React 19, Tailwind 4, Dynamic SDK — Kassim
  backend/        # Express.js, API gateway, proxies to AI service — Kassim + Kamil
  ai/             # Python FastAPI, XGBoost ONNX, 0G Compute — Kamil
  contracts/      # Solidity 0.8.24, Foundry, Solady — Manny
  docker/         # Docker compose + Caddy
  scripts/        # Deployment scripts
  .github/        # CI/CD
```
Each subdirectory has its own CLAUDE.md with domain-specific context.

## Team
- Kassim (@0x11semprez) — Frontend + Dynamic SDK
- Kamil — AI + 0G Integration + Backend endpoints
- Manny — Smart Contracts
- Keuch — ZK (Noir)

## Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind 4, Dynamic JS SDK |
| Backend | Express.js (port 4000) — API gateway between frontend and services |
| Auth/Wallet | Dynamic (social login, embedded wallet, onramp, gasless) |
| Contracts | Solidity 0.8.24, Foundry, Solady — on 0G Chain |
| AI | XGBoost, ONNX, FastAPI (port 8000), 0G Compute |
| ZK | Noir, UltraPlonk, Noir.js (WASM) |
| Infra | Docker, Caddy, GitHub Actions, 0G Chain |

## Data Flow
```
User → Frontend (Next.js :3000) → Backend (Express :4000) → AI Service (FastAPI :8000)
                                                            → 0G Chain (contracts)
```
Frontend NEVER calls AI or chain directly. Backend is the single gateway.

## API Contract Summary

| Endpoint | Method | Owner | Status |
|---|---|---|---|
| `/api/user/register` | POST | Kassim | Done (in-memory) |
| `/api/user/:key` | GET | Kassim | Done (in-memory) |
| `/api/user/:key` | PATCH | Kassim | Done (in-memory) |
| `/api/consensus` | POST | Kamil | Needs impl — proxy to AI |
| `/api/proof/generate` | POST | Kamil | Needs impl — on-chain or store |
| `/api/proof/:id` | GET | Kamil | Needs impl — ProofOfSolvency.check() |
| `/api/email/send` | POST | Kassim | Done |
| `/api/email/welcome` | POST | Kassim | Done |
| `/api/chart` | GET | Frontend | Done (Yahoo Finance, Next.js API route) |
| `/api/proof-pdf` | POST | Frontend | Done (Next.js API route) |
| `/health` | GET | Both | Done on both :4000 and :8000 |

Full API contract with request/response shapes: **`backend/CLAUDE.md`**

## Smart Contracts (0G Testnet)

| Contract | Purpose | Key Methods |
|---|---|---|
| `XStockMock` | ERC-20 tokenized stock | `mint`, `burn`, `setPrice`, `valueOf`, `balanceOf` |
| `ConsensusSettlement` | On-chain AI consensus record | `submit`, `latestOf`, `verifyDA` |
| `ProofOfSolvency` | ZK proof attestation | `verify`, `check`, `setVerifier` |

**Not yet deployed.** Run `make deploy-og` after setting `PRIVATE_KEY` in `.env`.

## Commands
```bash
make dev          # Start local dev stack (anvil + ai + backend + frontend)
make deploy-og    # Deploy contracts to 0G testnet
make test         # Forge tests
make up           # Docker production
```

## Environment (.env)
```env
PRIVATE_KEY=                                    # Deployer/signer for 0G Chain
OG_RPC=https://evmrpc-testnet.0g.ai           # 0G testnet RPC
AGENT_INTERVAL=60                               # AI background loop (seconds)
PORT=4000                                       # Backend port
FRONTEND_URL=http://localhost:3000              # For CORS + email links
AI_SERVICE_URL=http://localhost:8000            # AI FastAPI
NEXT_PUBLIC_API_URL=http://localhost:4000       # Frontend → backend
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=             # Dynamic SDK env ID
SMTP_HOST=smtp.gmail.com                       # Email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```
