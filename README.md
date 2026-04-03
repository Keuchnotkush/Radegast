# RADEGAST
makepushtest
[![CI](https://github.com/0x11semprez/radegast/actions/workflows/ci.yml/badge.svg)](https://github.com/0x11semprez/radegast/actions)

**AI-powered tokenized stock portfolio on 0G & Dynamic.**

🔗 [Live Demo](https://radegast.app) · 📹 [Video](https://youtube.com) · 🐙 [GitHub](https://github.com/0x11semprez/radegast)

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## The problem

A 28-year-old in Lisbon wants to invest in Tesla, Apple, NVIDIA. Today she needs a US brokerage account (she can't get one easily from Portugal), can only trade during Wall Street hours, pays advisor fees, and when she wants a mortgage, her crypto holdings are invisible to the bank.

Radegast solves this in three ways.

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Use case 1 — Invest in US stocks from anywhere, 24/7

Sign in with Google. Pick a strategy. Your money buys tokenized US equities (xStocks by Backed/Kraken) that live in your wallet as ERC-20 tokens. Trade 24/7, fractional from $1, no brokerage needed.

xStocks are real: $25B+ volume, 185k+ holders, backed 1:1 by actual shares held by licensed custodians. Available as ERC-20 on Ethereum mainnet since September 2025.

```
🛡️ Conservative    60% S&P 500 + 25% Nasdaq + 15% stablecoin
⚖️ Balanced        Mix indices + individual picks
🚀 Growth          NVDA 30% + TSLA 25% + AAPL 20% + META 15% + AMZN 10%
🔥 Aggressive      TSLA 35% + MSTR 25% + NVDA 20% + rotations
```

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## Use case 2 — AI advisor that watches (or trades) for you

Three independent AI models on 0G Compute analyze your portfolio in real-time. They vote. Majority wins. Every decision is settled on-chain and auditable on 0G DA.

Two modes — you choose your level of autonomy:

```
🛡️ ADVISORY (beginners)               🤖 TRADE (advanced)
AI analyzes + gives advice              AI analyzes + executes
you learn, you decide                   fully autonomous

"TSLAx is 35% of your portfolio,        Agent auto-sells 10% TSLAx
 strategy target is 25% — consider       and buys NVDAx.
 reducing exposure"                      You get a confirmation.
```

The AI consensus uses 3 providers to avoid single-model bias: one XGBoost model (statistical patterns) plus two LLMs (semantic understanding). If 0G goes down, inference falls back to the browser via WebAssembly. The demo cannot crash.

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Use case 3 — Prove your wealth to a bank without revealing your portfolio

This is real and timely. On March 26, 2026, Fannie Mae began accepting crypto-backed mortgages through Coinbase and Better Home & Finance. Milo, Figure, and Griffin Funding already offer crypto-collateralized home loans. The market exists.

**The problem today:** to prove your crypto holdings, you provide screenshots, exchange statements, or CSV exports. These are trivially forgeable. Banks know it. Some require 60-120 day "seasoning" — keeping assets in an account just to prove they're real. It's friction that costs time and trust.

**What Radegast does:** generate a **zero-knowledge proof** that your xStock portfolio exceeds a threshold (e.g. $50,000) — without revealing which stocks you hold, how many, or your total value. The proof is verified on-chain. A PDF with a QR code links to the verification page. The bank scans it and sees "verified above $50,000" — nothing else.

```
What the proof says:         "this wallet is worth more than $50,000"
What it does NOT reveal:     positions, amounts, total value, transaction history
```

**How it works:**

```
User clicks "Prove my assets"
    │
    ▼
Noir.js runs in the browser (WASM) — nothing leaves the device
    │  private inputs: balances, prices, secret
    │  public input: threshold ($50,000)
    │
    │  circuit: assert Σ(balance × price) > threshold
    │           commitment = Poseidon(balances, secret)
    │
    ▼
ZK proof generated (~10 seconds)
    │
    ▼
UltraVerifier smart contract on 0G Chain verifies the proof
    │  stores: threshold, commitment, timestamp, verifyId
    │  the contract never sees the private inputs
    │
    ▼
radegast.app/verify/{verifyId}
    │  anyone can check: "Portfolio verified above $50,000 ✓"
    │  + downloadable PDF with QR code
    │
    ▼
User sends PDF to mortgage broker / bank / Milo / Better
```

**Why ZK and not just a signed attestation?** A signed attestation requires trusting the signer (Radegast). A ZK proof is mathematically verifiable — the proof is valid regardless of who generated it. Even if Radegast disappears, the on-chain proof remains. No trust needed, just math.

**Real example:** Sarah in Lisbon holds $80,000 in xStocks (TSLAx, NVDAx, AAPLx, SPYx). She wants a mortgage from a European bank. She generates a proof that her portfolio exceeds €50,000, sends the PDF to her broker, and the broker verifies it on-chain in 2 seconds. No screenshots, no exchange logins, no 60-day seasoning. Cryptographic certainty.

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## How xStocks work in Radegast

xStocks are **ERC-20 tokens in the user's wallet**. Radegast never holds user assets.

```
Buy:   user pays USDC → swap on DEX → xStocks land in user's wallet
       (testnet: backend mints ERC-20 mock tokens into wallet)

Sell:  xStocks leave wallet → swap → USDC received
       (testnet: backend burns mock tokens)

Rebalance (trade mode):
       AI detects drift → burn overweight + mint underweight
       tokens move inside the user's own wallet
```

> xStocks exist as ERC-20 on Ethereum mainnet since Sept 2025 (Backed/Kraken). Testnet mocks replicate the same standard. Production = CCIP bridge + real DEX swaps.

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## Pipeline

```
User → Dynamic (Google + embedded wallet + onramp USDC)
     → pick strategy + mode (advisory / trade)
     → mint xStocks ERC-20 into wallet (0G Chain)
     → fetch.py reads balances + prices → 37 features
     → orchestrator → 3 providers on 0G Compute:
         ├── XGBoost ONNX (custom provider registered on 0G)
         ├── LLM A
         └── LLM B
     → vote.py → majority consensus
     → 0G Chain (settlement) + 0G DA (audit blob)
     → agent.py:
         advisory → text suggestions → notification
         trade    → auto burn/mint → confirmation

ZK:  "Prove my assets" → Noir.js (browser) → UltraVerifier (0G Chain)
     → PDF + QR → bank verifies on-chain
```

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## 0G Full Stack (4/4)

```
Compute    3 AI providers + XGBoost = public service → earns fees
Storage    ONNX model with provenance (root_hash)
Chain      consensus settlement + xStocks ERC-20 + ZK verifier
DA         every AI decision = verifiable audit blob

autonomous       → background agent + trade mode
verifiable       → Chain + DA + daHash cross-reference
self-sustaining  → XGBoost provider earns compute fees
```

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Dynamic SDK (11 features)

```
auth social          Google login — 1-click onboarding
auth email           magic link
auth passkey         biometric
embedded wallet      auto-created — xStocks live here
external wallet      WalletConnect
network switching    Solana ↔ EVM
onramp               fiat → USDC in-app
events               AI alerts + trade confirmations
MFA                  trade approval (advisory mode)
captcha              anti-bot
gasless              auto-trades (trade mode)
```

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## Contracts (Solady)

Gas-optimized using [Solady](https://github.com/Vectorized/solady) — the same library used by Optimism and Coinbase. ~30% cheaper transfers, ~60% cheaper deploys vs OpenZeppelin.

| Contract | Address |
|----------|---------|
| TSLAx | `0x…` |
| AAPLx | `0x…` |
| NVDAx | `0x…` |
| GOOGx | `0x…` |
| AMZNx | `0x…` |
| METAx | `0x…` |
| SPYx | `0x…` |
| NDXx | `0x…` |
| MSTRx | `0x…` |
| ConsensusSettlement | `0x…` |
| ProofOfSolvency | `0x…` |

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## Setup

```bash
git clone https://github.com/0x11semprez/radegast.git
cd radegast
make dev    # installs everything + starts local stack
```

```bash
make deploy-og    # deploy to 0G testnet
make test         # forge tests
make up           # docker production
```

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Stack

| | |
|---|---|
| Frontend | Next.js 14, Tailwind |
| Auth | Dynamic JS SDK |
| Contracts | Solidity 0.8.24, Foundry, Solady |
| AI | XGBoost, ONNX, FastAPI |
| ZK | Noir, UltraPlonk, Noir.js (WASM) |
| Infra | Docker, Caddy, GitHub Actions |
| Chain | 0G (Compute + Storage + Chain + DA) |

## Team

| | | |
|---|---|---|
| Kassim | Frontend + Dynamic SDK | [@0x11semprez](https://x.com/0x11semprez) |
| Kamil | AI + 0G Integration | TG: @k1000 |
| Manny | Smart Contracts | TG: @manny |
| Keuch | ZK (Noir) | TG: @keuch |

---

*ETHGlobal Cannes 2026. 3 days. 4 builders.*

*Radogost (slavic: "the one who welcomes with joy") — a joyful guardian of your investments.*
