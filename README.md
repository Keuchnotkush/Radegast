<p align="center">
  <img src="frontend/public/logo-no-dots.svg" alt="Radegast" width="320" />
</p>

<h3 align="center">AI-native tokenized stock portfolio on 0G</h3>

<p align="center">
  <strong>Autonomous AI agents trade tokenized US stocks, settle consensus on-chain, store audit data on 0G DA, and prove solvency with zero-knowledge proofs — all invisible to the user.</strong>
</p>

<p align="center">
  <a href="https://youtu.be/I3K0wETMDaY">Demo Video (&lt;3 min)</a> &bull;
  <a href="https://github.com/0x11semprez/radegast">GitHub</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/0G_Chain-16602-00C896?style=flat-square" />
  <img src="https://img.shields.io/badge/0G_Compute-LLM_Broker-blueviolet?style=flat-square" />
  <img src="https://img.shields.io/badge/0G_Storage-Consensus_DA-orange?style=flat-square" />
  <img src="https://img.shields.io/badge/0G_DA-Audit_Blobs-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Privy-Social_Auth_%2B_Wallets-6851FF?style=flat-square" />
  <img src="https://img.shields.io/badge/Noir-ZK_Proofs-black?style=flat-square" />
</p>

---

## TL;DR

Radegast lets anyone invest in tokenized US stocks (TSLA, AAPL, NVDA...) 24/7 from anywhere with Google login. Three AI models vote on risk — 2 LLMs via **0G Compute** broker + 1 XGBoost ONNX model — consensus results are stored on **0G Storage (DA)**, and settled on **0G Chain**. An autonomous agent rebalances portfolios automatically. Users can generate **zero-knowledge proofs** of solvency (Noir/UltraPlonk) to prove portfolio value to banks without revealing holdings.

**The user never sees a wallet, gas fee, or blockchain term. It's a stock investing app.**

---

## The Problem

A 28-year-old in Lisbon wants to invest in Tesla, Apple, NVIDIA. Today she needs a US brokerage (hard from Portugal), can only trade during Wall Street hours, pays advisor fees, and when she wants a mortgage, her crypto holdings are invisible to the bank.

Radegast solves this in three ways.

---

## How It Works

### 1. Invest in US Stocks 24/7

Sign in with Google. Pick a strategy. Your money buys tokenized US equities (xStocks) as ERC-20 tokens on 0G Chain. Trade 24/7, fractional from $1, no brokerage needed.

```
User clicks "Buy $100 of Tesla"
  → POST /api/trade { action: "buy", ticker: "TSLA", usdAmount: 100 }
  → Backend reads on-chain price via XStockMock.price()
  → Burns USDC from user wallet (MockUSDC.burn)
  → Mints TSLAx to user wallet (XStockMock.mint) on 0G Chain
  → Frontend updates portfolio from on-chain balances
```

### 2. AI Consensus Protocol (3-Model Voting)

Three independent AI models analyze your portfolio. They vote. Majority wins. Every decision is settled on-chain and auditable.

```
Portfolio data (61 features: RSI, volatility, returns, correlation)
    │
    ├── XGBoost (ONNX)          → risk score + label     ← local FastAPI
    ├── LLM A (Bull Analyst)    → risk score + factors   ← 0G Compute broker
    └── LLM B (Bear Auditor)    → risk score + factors   ← 0G Compute broker
    │
    ▼ Majority vote
    ConsensusResult { score, label, confidence, suggestions }
    │
    ├── Upload to 0G Storage → rootHash (= daHash for cross-reference)
    └── Submit to ConsensusSettlement.sol on 0G Chain
```

**Two modes:**
- **Advisory** — AI analyzes and recommends, user decides
- **Trade** — AI analyzes and auto-executes rebalances (autonomous agent, every 60s)

### 3. ZK Proof of Solvency

Generate a zero-knowledge proof that your portfolio exceeds a threshold (e.g. $50,000) without revealing which stocks you hold.

```noir
// zk/proof-of-solvency/src/main.nr
fn main(
    balances:   [Field; 9],   // PRIVATE — shares per stock
    prices:     [Field; 9],   // PRIVATE — price per stock
    secret:     Field,        // PRIVATE — random nonce
    threshold:  pub Field,    // PUBLIC  — $50,000
    commitment: pub Field     // PUBLIC  — Poseidon(balances, secret)
) {
    assert(Σ(balance × price) > threshold);
    assert(commitment == Poseidon(hash_9(balances), secret));
}
```

Proof generated entirely client-side (Noir.js WASM in `lib/noir/prover.ts`), attestation stored on-chain via `ProofRegistry` on 0G Chain. Anyone verifies at `radegast.app/verify/{id}`.

---

## 0G Full Stack Integration (4/4)

We use **every layer** of the 0G stack.

### 0G Compute — AI Inference

| Component | Implementation | File |
|-----------|---------------|------|
| XGBoost Provider | ONNX model served via OpenAI-compatible `/v1/chat/completions` endpoint on FastAPI | `ai/server.py:344` |
| LLM Broker | `@0glabs/0g-serving-broker` — calls LLM providers via 0G Compute, generates single-use auth headers, verifies responses | `ai/scripts/og_compute_call.mjs` |
| Service Discovery | `broker.inference.listService()` — lists available LLM providers on 0G Compute network | `ai/scripts/og_compute_call.mjs:38` |
| Response Verification | `broker.inference.processResponse()` — verifies provider response authenticity after each call | `ai/scripts/og_compute_call.mjs:118` |
| Ledger Management | `broker.ledger.addLedger()` — deposits A0GI funds for inference payments | `ai/scripts/og_compute_call.mjs:55` |

SDK: `@0glabs/0g-serving-broker` v0.7.4

### 0G Storage — Data Availability

| Component | Implementation | File |
|-----------|---------------|------|
| Consensus Blob Upload | AI consensus results serialized to JSON, uploaded to 0G Storage via `@0gfoundation/0g-ts-sdk` | `ai/scripts/og_storage_upload.mjs` |
| Merkle Tree | `MemData.merkleTree()` → `rootHash` used as `daHash` for on-chain cross-reference | `ai/scripts/og_storage_upload.mjs:60` |
| Download/Verify | Retrieve stored data by rootHash from 0G Storage indexer | `ai/scripts/og_storage_download.mjs` |

SDK: `@0gfoundation/0g-ts-sdk` v1.2.1 (Indexer, MemData)

### 0G Chain — Settlement (Chain 16602)

| Contract | Purpose | Address |
|----------|---------|---------|
| XStockMock (x15) | ERC-20 tokenized stocks with on-chain price oracle, role-based mint/burn | See [Deployed Contracts](#deployed-contracts) |
| ConsensusSettlement | Records AI consensus votes (score, confidence, label, provider agreement, daHash) | `0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f` |
| ProofOfSolvency | ZK attestation with on-chain Noir proof verification via HonkVerifier | `0x9ad38b9e70a23BE95186C5935930C6Ab05C49dD9` |
| ProofRegistry | Attestation store (submit/check) for proof results | `0x2a768566eF8C8a44129B0b04fD8a2AD240620255` |
| HonkVerifier | Noir-generated UltraPlonk verifier (Sumcheck + Shplemini pairing) | `0x71E560eC76Ac0CBA7F44D6ba557f0706257deFa1` |
| MockUSDC | Demo stablecoin for trading (6 decimals, auto-faucet $10k on signup) | `0x0cd4BADcDA55B01d312d4AF9E163090Ab301e694` |

Stack: Solidity 0.8.24, Foundry, [Solady](https://github.com/Vectorized/solady) (OwnableRoles, ERC20)

### 0G DA — Audit Trail

Every AI consensus decision produces a `daHash` — either from a real 0G Storage upload (`rootHash` via `og_storage_upload.mjs`) or a deterministic SHA-256 hash in dev mode. This hash is submitted on-chain as `daHash` in `ConsensusSettlement.submit()`, creating a cross-reference between the on-chain record and the full audit data.

```
ConsensusResult JSON → 0G Storage upload → rootHash
                                              │
ConsensusSettlement.submit(..., daHash) ◄─────┘
                                              │
ConsensusSettlement.verifyDA(id, rootHash) → true
```

---

## AI-Native DeFi Criteria

| Criteria | Implementation |
|----------|---------------|
| Autonomous | Background agent scans every 60s, runs consensus automatically, executes rebalance trades without user intervention |
| Verifiable | Every AI decision recorded on 0G Chain + full audit blob on 0G DA with cross-reference hash verification |
| Economically self-sustaining | LLM providers on 0G Compute earn inference fees; XGBoost ONNX model served locally with OpenAI-compatible API |
| Multi-agent | 3 independent AI models (XGBoost quantitative + LLM sentiment + LLM macro) coordinate via consensus voting protocol |

---

## Architecture

```
User ──► Next.js (:3000) ──► Express.js (:4000) ──► FastAPI (:8000)
              │                      │                      │
              │                      │                      ├── XGBoost ONNX (local FastAPI)
              │                      │                      ├── LLM A via 0G Compute broker
              │                      │                      └── LLM B via 0G Compute broker
              │                      │
              │                      ├── 0G Chain ← xStocks, Consensus, ZK Verifier, MockUSDC
              │                      ├── 0G Storage ← consensus blobs (DA)
              │                      └── 0G DA ← daHash cross-reference
              │
              ├── Privy SDK ← auth, embedded wallet, onramp
              └── Noir.js ← ZK proof generation (WASM, client-side)
```

Frontend never calls AI or chain directly. Backend is the single gateway.

---

## Deployed Contracts

**Network:** 0G Newton Testnet (Chain ID: `16602`) | **RPC:** `https://evmrpc-testnet.0g.ai` | **Explorer:** `https://chainscan-newton.0g.ai`

### xStock Tokens (15 ERC-20)

| Token | Symbol | Contract | Price |
|-------|--------|----------|-------|
| Tesla | TSLAx | `0x2dC821592626Ab6375E5B84b4EF94eCb1478EBa6` | $250 |
| Apple | AAPLx | `0xbF7878757DcbCF28E024aEFa7B03B3cF6267aE8c` | $198 |
| NVIDIA | NVDAx | `0xC82291F9b5f22FAecB5530DcF54E6D2086b45fde` | $140 |
| Alphabet | GOOGx | `0x4eb8fEe5CBDBC434ee88F7781948e8799Ed7Fb82` | $175 |
| Amazon | AMZNx | `0xEfF7d05B11CC848Bf7EAbA74a6021B0567aB841d` | $185 |
| Meta | METAx | `0xa483a4342F4D4D8e27364876cF55f3baaFb93310` | $510 |
| S&P 500 | SPYx | `0xC04F35d970F08F09c23b8C97538fCf62a57c255C` | $530 |
| Nasdaq 100 | NDXx | `0x88B700918cd051ffa6B02274DE53584695E06bce` | $480 |
| MicroStrategy | MSTRx | `0x6ce30D33c6091425bbe162cA353CDbffF7C090d9` | $1700 |
| Microsoft | MSFTx | `0x26F1B3D351Cb8a23E6cCeA93d5143Dc1e185cFA0` | $420 |
| JPMorgan | JPMx | `0x43da4eCBa6DfD3b901Dd5238a77608c52C420e5b` | $240 |
| Visa | Vx | `0x781C0de58df40F5f6a1b661F3CB0a5B551A3b683` | $310 |
| ExxonMobil | XOMx | `0x2bEd346a985866B497E052fB807bE4E3FB4D015E` | $115 |
| Eli Lilly | LLYx | `0xa37e660218B3De658444648873d3016E1aD1681d` | $780 |
| LVMH | LVMHx | `0x425f1CF3e4f3762B58a32d24a80b7d767Af58441` | $750 |

### Protocol Contracts

| Contract | Address | Purpose |
|----------|---------|---------|
| ConsensusSettlement | `0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f` | On-chain AI consensus (score, confidence, label, daHash) |
| ProofOfSolvency | `0x9ad38b9e70a23BE95186C5935930C6Ab05C49dD9` | ZK attestation with on-chain Noir verification |
| ProofRegistry | `0x2a768566eF8C8a44129B0b04fD8a2AD240620255` | Proof storage (submit/check) |
| HonkVerifier | `0x71E560eC76Ac0CBA7F44D6ba557f0706257deFa1` | Noir UltraPlonk verifier (Sumcheck + Shplemini) |
| MockUSDC | `0x0cd4BADcDA55B01d312d4AF9E163090Ab301e694` | Demo stablecoin (6 decimals, MINTER_ROLE mint/burn) |

---

## SDKs & Protocols

| 0G Component | SDK / Tool | What We Built |
|-------------|-----------|---------------|
| 0G Compute | `@0glabs/0g-serving-broker` v0.7.4 | 3-model AI consensus: XGBoost ONNX (local), 2 LLMs via 0G Compute broker with request signing + response verification |
| 0G Storage | `@0gfoundation/0g-ts-sdk` v1.2.1 (Indexer, MemData) | Upload consensus blobs to 0G Storage, get rootHash for DA cross-reference |
| 0G Chain | Solidity + Foundry + Solady | 20 deployed contracts: 15 xStock ERC-20, ConsensusSettlement, ProofOfSolvency, ProofRegistry, HonkVerifier, MockUSDC |
| 0G DA | 0G Storage rootHash as daHash | Every AI decision has a verifiable audit trail: `ConsensusSettlement.verifyDA(id, hash)` |
| Privy | `@privy-io/react-auth` v3.19.0 | Google/Discord/Email auth, embedded EVM wallets, onramp, 0G Newton Testnet as default chain |
| Noir | `@noir-lang/noir_js` v1.0.0-beta.15, `@aztec/bb.js` v3.0.0-nightly | Client-side ZK proof of solvency (Poseidon commitment, UltraHonk backend) |

---

## Privy SDK Integration

| Feature | Hook / Config | File | Status |
|---------|--------------|------|--------|
| Google OAuth | `useLoginWithOAuth({ provider: "google" })` | `get-started/page.tsx` | Live |
| Discord OAuth | `useLoginWithOAuth({ provider: "discord" })` | `get-started/page.tsx` | Live |
| Email OTP | `useLoginWithEmail()` → `sendCode()` + `loginWithCode()` | `get-started/page.tsx` | Live |
| Embedded Wallet | `embeddedWallets: { ethereum: { createOnLogin: "all-users" } }` | `providers.tsx` | Live |
| 0G Chain Default | `defaultChain: ogTestnet` + `supportedChains: [ogTestnet]` | `providers.tsx` | Live |
| Auth Guard | `usePrivy()` → `ready && !authenticated` → redirect | `dashboard/layout.tsx` | Live |
| Wallet Address | `useWallets()` → `wallets[0].address` via WalletProvider | `dashboard/store.tsx` | Live |
| USDC Balance | Polls `GET /api/usdc/:address` every 30s | `dashboard/store.tsx` | Live |
| Onramp | `useFundWallet()` → fund embedded wallet | `dashboard/page.tsx` | Live |
| Auto-Faucet | `AutoFaucet` component → mints $10k demo USDC on first wallet | `providers.tsx` | Live |
| Logout | `usePrivy()` → `logout()` | `dashboard/settings/page.tsx` | Live |
| Theme | `appearance: { theme: "light", accentColor: "#38A88A" }` | `providers.tsx` | Live |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind 4, Framer Motion 12, TypeScript |
| Auth/Wallet | Privy SDK v3 (social login, embedded wallet, onramp) |
| Backend | Express.js (port 4000) — API gateway, viem for chain reads/writes |
| AI | XGBoost, ONNX Runtime, FastAPI (port 8000), 0G Compute |
| Contracts | Solidity 0.8.24, Foundry, Solady (ERC20, OwnableRoles) |
| ZK | Noir, UltraPlonk, Noir.js (WASM), @aztec/bb.js, Poseidon BN254 |
| Infra | Docker, Caddy, GitHub Actions, 0G Newton Testnet |

---

## Project Structure

```
Radegast/
├── frontend/                 Next.js 16 + Privy SDK
│   ├── app/
│   │   ├── landing/          Hero, use case accordions
│   │   ├── get-started/      Google/Discord OAuth + email OTP (Privy)
│   │   ├── how-it-works/     7-step pipeline explainer
│   │   ├── verify/           ZK proof verifier (on-chain check)
│   │   ├── dashboard/
│   │   │   ├── page.tsx      Portfolio: donut chart, holdings, trade
│   │   │   ├── invest/       Stock discovery: grid, search, sectors
│   │   │   ├── advisor/      AI consensus: 3 models, advisory/trade modes
│   │   │   ├── solvency/     ZK proof generator (Noir.js WASM)
│   │   │   ├── settings/     Profile, autonomous trading controls
│   │   │   └── chat/         AI chat interface
│   │   └── api/
│   │       ├── chart/        Yahoo Finance price proxy
│   │       └── proof-pdf/    PDF certificate generator (jsPDF)
��   ├── lib/
│   │   ├── theme.ts          Design system: palette, ease, spring
│   │   └── noir/prover.ts    ZK proof engine (Noir.js + bb.js WASM)
│   └── providers.tsx         PrivyProvider + 0G Chain config + AutoFaucet
│
├── backend/                  Express.js API gateway (port 4000)
│   └── server.js             20+ endpoints: trade, holdings, consensus, proof, email
│
├── ai/                       Python FastAPI (port 8000)
│   ├── server.py             ONNX model loading + autonomous agent loop
│   ├── consensus/
│   │   ├── orchestrator.py   3-provider parallel calls + voting + DA + on-chain
│   │   ├── og_compute.py     0G Compute broker wrapper (Python → Node.js sidecar)
│   │   ├── submit_da.py      0G Storage upload (rootHash = daHash)
│   │   ├── submit_onchain.py ConsensusSettlement.submit() via web3.py
│   │   ├── vote.py           Majority consensus algorithm
│   │   └── execute_trades.py Auto-rebalance in Trade mode
│   ├── strategist/           Portfolio allocation + investor profiles
│   ├── chat/                 AI chat advisor (wraps consensus in plain language)
│   ├── shared/
│   │   ├── model/train.py    XGBoost training → ONNX export
│   │   └── data_agent/       Yahoo Finance feature fetching (61 features)
│   └── scripts/
│       ├── og_compute_call.mjs   0G Compute broker (list, setup, call)
│       ├── og_storage_upload.mjs 0G Storage upload (Indexer + MemData)
│       └── og_storage_download.mjs 0G Storage download + verify
│
├── contracts/                Solidity 0.8.24, Foundry, Solady
│   ├── src/
│   │   ├── XStockMock.sol          ERC-20 with price oracle + role-based access
│   │   ├── ConsensusSettlement.sol  AI consensus on-chain record + DA verification
│   │   ├── ProofOfSolvency.sol     ZK attestation with Noir verifier
│   │   ├── ProofRegistry.sol       Attestation store (submit/check)
│   │   ├── UltraVerifier.sol       Noir-generated HonkVerifier (UltraPlonk)
│   │   └── MockUSDC.sol            Demo stablecoin (6 decimals)
│   ├── script/
│   │   ├── Deploy.s.sol            Full deployment (15 tokens + protocol)
│   │   ├── DeployUSDC.s.sol        MockUSDC deployment
│   │   ��── DeployVerifier.s.sol    HonkVerifier + wire to ProofOfSolvency
│   │   └── RedeployPoS.s.sol       Redeploy ProofOfSolvency with verifier
│   └── test/                       Forge tests
│
├── zk/                       Noir circuits
│   ├── proof-of-solvency/    assert Σ(balance × price) > threshold + Poseidon commitment
│   └── compute-commitment/   Poseidon hash helper
│
├── docker/                   Docker Compose + Caddy reverse proxy
├── Makefile                  dev, deploy, test, build commands
└── .github/                  CI/CD workflows
```

---

## Setup & Run

**Prerequisites:** Node.js 20+, pnpm, Python 3.11+, Foundry, Docker (optional)

```bash
git clone https://github.com/0x11semprez/radegast.git
cd radegast
cp .env.example .env        # Add your PRIVATE_KEY
make install                # Install all dependencies
make dev                    # Start full stack (AI :8000, Backend :4000, Frontend :3000)
```

Individual services:

```bash
make front                  # Frontend only (Next.js :3000)
make backend                # Backend only (Express :4000)
cd ai && uvicorn server:app --reload --port 8000   # AI service
```

Smart contracts:

```bash
make build                  # forge build
make test                   # forge test -vvv
make deploy-og              # Deploy to 0G testnet
```

Docker (production):

```bash
make up                     # docker compose up (AI + Frontend + Caddy)
make down                   # stop
```

---

## Environment Variables

```env
# Required
PRIVATE_KEY=               # Deployer/signer for 0G Chain
NEXT_PUBLIC_PRIVY_APP_ID=  # Privy App ID (frontend auth)

# Services
OG_RPC=https://evmrpc-testnet.0g.ai
AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:4000

# 0G Storage
OG_STORAGE_INDEXER=https://indexer-storage-testnet-turbo.0g.ai

# 0G Compute
OG_COMPUTE_PROVIDER_ADDR=  # Provider address for LLM inference

# Contracts
USDC_ADDRESS=0x0cd4BADcDA55B01d312d4AF9E163090Ab301e694

# Optional
SMTP_HOST=smtp.gmail.com   # Email notifications
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/user/register` | Register + auto-faucet $10k demo USDC |
| `GET` | `/api/holdings/:address` | Read xStock balances from 0G Chain |
| `GET` | `/api/prices` | On-chain prices for all 15 xStocks |
| `POST` | `/api/trade` | Buy/sell xStocks (mint/burn on 0G Chain) |
| `POST` | `/api/consensus` | Trigger 3-model AI consensus pipeline |
| `GET` | `/api/consensus/:address` | Read latest consensus from chain |
| `POST` | `/api/proof/generate` | Store ZK proof attestation on-chain |
| `GET` | `/api/proof/:id` | Verify proof on-chain |
| `POST` | `/api/faucet` | Mint demo USDC |
| `GET` | `/api/usdc/:address` | USDC balance |
| `POST` | `/api/profile/mode` | Switch advisory/trade mode |
| `GET` | `/api/agent/latest/:userId` | Latest autonomous agent result |
| `GET` | `/health` | Health check (both :4000 and :8000) |

---

## Team

| Name | Role | X | Telegram | Discord |
|------|------|---|----------|---------|
| **Kassim** | DevOps, Frontend Engineer, Privy SDK | [@0x11semprez](https://x.com/0x11semprez) | @pupp3tm4st3r | 0x11semprez |
| **Kamil** | AI + 0G Integration + Backend | | | |
| **Manny** | Smart Contracts (Solidity/Foundry) | [@mvnny0_0](https://x.com/mvnny0_0) | @mvnny_28 | 0x7mvnny |
| **Keuch** | ZK Circuits (Noir) | [@0xFA2L](https://x.com/0xFA2L) | @BKRTZR | @metallicbat |

---

<p align="center">
  <strong>ETHGlobal Cannes 2026</strong><br/>
  <em>Radogost (slavic: "the one who welcomes with joy") — a joyful guardian of your investments.</em>
</p>
