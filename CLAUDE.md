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
  ai/             # Python FastAPI, XGBoost ONNX, 0G Compute — Kamil
  contracts/      # Solidity 0.8.24, Foundry, Solady — Manny
  docker/         # Docker compose + Caddy
  scripts/        # Deployment scripts
  .github/        # CI/CD
```
Each subdirectory has its own CLAUDE.md with domain-specific context.

## Team
- Kassim (@0x11semprez) — Frontend + Dynamic SDK
- Kamil — AI + 0G Integration
- Manny — Smart Contracts
- Keuch — ZK (Noir)

## Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind 4, Dynamic JS SDK |
| Auth/Wallet | Dynamic (social login, embedded wallet, onramp, gasless) |
| Contracts | Solidity 0.8.24, Foundry, Solady |
| AI | XGBoost, ONNX, FastAPI, 0G Compute |
| ZK | Noir, UltraPlonk, Noir.js (WASM) |
| Infra | Docker, Caddy, GitHub Actions, 0G Chain |

## Commands
```bash
make dev          # Start local dev stack
make deploy-og    # Deploy to 0G testnet
make test         # Forge tests
make up           # Docker production
```
