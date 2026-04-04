# RADEGAST

[![CI](https://github.com/0x11semprez/radegast/actions/workflows/ci.yml/badge.svg)](https://github.com/0x11semprez/radegast/actions)

**AI-powered tokenized stock portfolio on 0G & Dynamic.**

[Live Demo](https://radegast.app) | [Video](https://youtube.com) | [GitHub](https://github.com/0x11semprez/radegast)


/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## The problem

A 28-year-old in Lisbon wants to invest in Tesla, Apple, NVIDIA. Today she needs a US brokerage account (she can't get one easily from Portugal), can only trade during Wall Street hours, pays advisor fees, and when she wants a mortgage, her crypto holdings are invisible to the bank.

Radegast solves this in three ways.

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Use case 1 — Invest in US stocks from anywhere, 24/7

Sign in with Google. Pick a strategy. Your money buys tokenized US equities (xStocks) that live in your wallet as ERC-20 tokens. Trade 24/7, fractional from $1, no brokerage needed.

xStocks are real: $25B+ volume, 185k+ holders, backed 1:1 by actual shares held by licensed custodians. Available as ERC-20 on Ethereum mainnet since September 2025.

```
Conservative    60% S&P 500 + 25% Nasdaq + 15% stablecoin
Balanced        Mix indices + individual picks
Growth          NVDA 30% + TSLA 25% + AAPL 20% + META 15% + AMZN 10%
Aggressive      TSLA 35% + MSTR 25% + NVDA 20% + rotations
```

**What actually happens when you buy:**

```
1. User clicks "Buy $100 of Tesla"
2. Frontend calls POST /api/trade { action: "buy", ticker: "TSLA", usdAmount: 100 }
3. Backend calculates shares: 100 / price = 0.277 shares
4. Backend calls TSLAx.mint(userWallet, 0.277e18) on 0G Chain
5. xStock ERC-20 lands in user's embedded wallet
6. Frontend updates portfolio from on-chain balances
```

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## Use case 2 — AI advisor that watches (or trades) for you

Three independent AI models on 0G Compute analyze your portfolio in real-time. They vote. Majority wins. Every decision is settled on-chain and auditable on 0G DA.

```
ADVISORY MODE (beginners)              TRADE MODE (advanced)
AI analyzes + gives advice             AI analyzes + executes
you learn, you decide                  fully autonomous

"TSLAx is 35% of your portfolio,       Agent auto-sells 10% TSLAx
 strategy target is 25% — consider      and buys NVDAx.
 reducing exposure"                     You get a confirmation.
```

**What actually happens:**

```
1. User clicks "Analyze my portfolio" on /dashboard/advisor
2. Frontend converts holdings to xStock positions (% allocation)
3. POST /api/consensus → Backend proxies to AI service (FastAPI :8000)
4. AI service runs 3 providers:
   ├── XGBoost ONNX   (37 statistical features: RSI, MACD, Bollinger, correlation)
   ├── LLM A          (sentiment: news, social, earnings calls)
   └── LLM B          (macro: Fed rates, CPI, sector rotation)
5. Each provider votes with a risk score + label (LOW/MEDIUM/HIGH)
6. Orchestrator computes majority consensus
7. Result submitted to ConsensusSettlement contract on 0G Chain
8. Audit blob stored on 0G DA (daHash returned)
9. Frontend displays: risk score, confidence %, suggestions, trade moves
10. In TRADE mode: backend auto-executes mint/burn via /api/trade
```

**Fallback chain:** If 0G Compute is down, AI falls back to local ONNX inference via WebAssembly. The demo cannot crash.

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Use case 3 — Prove your wealth to a bank without revealing your portfolio

On March 26, 2026, Fannie Mae began accepting crypto-backed mortgages through Coinbase and Better Home & Finance. Milo, Figure, and Griffin Funding already offer crypto-collateralized home loans. The market exists.

**The problem today:** to prove your crypto holdings, you provide screenshots or CSV exports. These are trivially forgeable. Banks know it. Some require 60-120 day "seasoning". It's friction that costs time and trust.

**What Radegast does:** generate a **zero-knowledge proof** that your xStock portfolio exceeds a threshold (e.g. $50,000) — without revealing which stocks you hold, how many, or your total value.

```
What the proof says:         "this wallet is worth more than $50,000"
What it does NOT reveal:     positions, amounts, total value, transaction history
```

**What actually happens:**

```
1. User opens /dashboard/solvency, selects threshold ($50,000)
2. Frontend reads REAL portfolio: usePortfolio() holdings + useLiveMarket() prices
3. Maps to 9-slot Noir circuit inputs:
   ├── balances[9] = shares × 100 (integer scaling, private)
   ├── prices[9]   = price × 100  (integer scaling, private)
   ├── secret      = crypto.getRandomValues() (private, never leaves browser)
   ├── threshold    = $50,000 × 10,000 (public)
   └── commitment   = Poseidon(balances, secret) (public)
4. Noir.js compiles + executes circuit in browser (WASM):
   ├── assert: Σ(balance[i] × price[i]) > threshold
   └── assert: commitment == Poseidon(hash_9(balances), secret)
5. UltraHonk proof generated (~10 seconds, all client-side)
6. Frontend sends proof + publicInputs to POST /api/proof/generate
7. Backend calls ProofRegistry.submit(user, threshold, commitment) on 0G Chain
8. Returns on-chain verifyId hash
9. Anyone verifies at radegast.app/verify/{verifyId}
   ├── Backend queries ProofRegistry.check(verifyId) on-chain
   └── Returns: threshold, timestamp, commitment, chain, circuit
10. User downloads PDF certificate with QR code → sends to bank
```

**Why ZK and not just a signed attestation?** A signed attestation requires trusting the signer (Radegast). A ZK proof is mathematically verifiable — the proof is valid regardless of who generated it. Even if Radegast disappears, the on-chain proof remains. No trust needed, just math.

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## Architecture

```
User → Next.js (:3000) → Express.js (:4000) → FastAPI (:8000)
           │                    │                    │
           │                    │                    ├── XGBoost ONNX
           │                    │                    ├── LLM A (Sentiment)
           │                    │                    └── LLM B (Macro)
           │                    │
           │                    ├── 0G Chain (xStocks, Consensus, ZK Verifier)
           │                    └── 0G DA (audit blobs)
           │
           ├── Dynamic SDK (auth, embedded wallet, onramp)
           └── Noir.js (ZK proof generation, client-side WASM)
```

Frontend NEVER calls AI or chain directly. Backend is the single gateway.

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## API Endpoints (all implemented)

| Method | Endpoint | What it does |
|--------|----------|-------------|
| `POST` | `/api/user/register` | Register user (email, firstName, lastName) |
| `GET` | `/api/user/:key` | Lookup user by ID or email |
| `PATCH` | `/api/user/:key` | Update strategy, aiMode, profile |
| `GET` | `/api/holdings/:address` | Read xStock ERC-20 balances from 0G Chain |
| `GET` | `/api/prices` | Read on-chain prices for all 15 xStocks |
| `POST` | `/api/trade` | Buy/sell xStocks (mint/burn on-chain) |
| `GET` | `/api/consensus/:address` | Read latest AI consensus from ConsensusSettlement |
| `POST` | `/api/proof/generate` | Store ZK proof attestation on ProofRegistry |
| `GET` | `/api/proof/:id` | Verify proof on-chain (ProofRegistry.check) |
| `POST` | `/api/email/send` | Send email (Nodemailer) |
| `POST` | `/api/email/welcome` | Welcome email with dashboard link |
| `GET` | `/health` | Health check |

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Contracts — 0G Testnet (Chain 16602)

All contracts use [Solady](https://github.com/Vectorized/solady) — the same library used by Optimism and Coinbase. ~30% cheaper transfers, ~60% cheaper deploys vs OpenZeppelin. `Ownable` for access control, `ERC20` for token standard.

**RPC:** `https://evmrpc-testnet.0g.ai`
**Deployer:** `0x5FB77900D139f2Eee6F312F3BF98fc8ad700C174`

### xStock Tokens (ERC-20, Solady)

| Token | Ticker | Contract Address |
|-------|--------|-----------------|
| TSLAx | Tesla | `0x2dC821592626Ab6375E5B84b4EF94eCb1478EBa6` |
| AAPLx | Apple | `0xbF7878757DcbCF28E024aEFa7B03B3cF6267aE8c` |
| NVDAx | NVIDIA | `0xC82291F9b5f22FAecB5530DcF54E6D2086b45fde` |
| GOOGx | Alphabet | `0x4eb8fEe5CBDBC434ee88F7781948e8799Ed7Fb82` |
| AMZNx | Amazon | `0xEfF7d05B11CC848Bf7EAbA74a6021B0567aB841d` |
| METAx | Meta | `0xa483a4342F4D4D8e27364876cF55f3baaFb93310` |
| SPYx | S&P 500 ETF | `0xC04F35d970F08F09c23b8C97538fCf62a57c255C` |
| NDXx | Nasdaq 100 ETF | `0x88B700918cd051ffa6B02274DE53584695E06bce` |
| MSTRx | MicroStrategy | `0x6ce30D33c6091425bbe162cA353CDbffF7C090d9` |
| MSFTx | Microsoft | `0x26F1B3D351Cb8a23E6cCeA93d5143Dc1e185cFA0` |
| JPMx | JPMorgan | `0x43da4eCBa6DfD3b901Dd5238a77608c52C420e5b` |
| Vx | Visa | `0x781C0de58df40F5f6a1b661F3CB0a5B551A3b683` |
| XOMx | ExxonMobil | `0x2bEd346a985866B497E052fB807bE4E3FB4D015E` |
| LLYx | Eli Lilly | `0xa37e660218B3De658444648873d3016E1aD1681d` |
| LVMHx | LVMH | `0x425f1CF3e4f3762B58a32d24a80b7d767Af58441` |

### Protocol Contracts

| Contract | Purpose | Address |
|----------|---------|---------|
| ConsensusSettlement | On-chain AI consensus record (submit, latestOf, verifyDA) | `0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f` |
| ProofOfSolvency | ZK proof attestation with on-chain verification | `0x9ad38b9e70a23BE95186C5935930C6Ab05C49dD9` |
| ProofRegistry | Proof storage (submit, check) — used by backend | `0x2a768566eF8C8a44129B0b04fD8a2AD240620255` |
| HonkVerifier | UltraPlonk verifier (2,449 lines, Noir-generated) | `0x1ea85eef4b5dad2667b8177e1a10efc4d7bae187` |
| ZKTranscriptLib | ZK transcript library | `0xcadda54e5f5936b28b04368feb76ec5a190d4c36` |

### How xStocks work on-chain

```
Buy:   POST /api/trade { action: "buy", ticker: "TSLA", usdAmount: 100 }
       → backend calls TSLAx.mint(userWallet, shares) on 0G Chain
       → ERC-20 token lands in user's embedded wallet

Sell:  POST /api/trade { action: "sell", ticker: "TSLA", usdAmount: 50 }
       → backend calls TSLAx.burn(userWallet, shares) on 0G Chain
       → USDC equivalent credited

Read:  GET /api/holdings/0x...
       → reads balanceOf for all 15 xStocks on-chain
       → returns: [{ symbol: "TSLAx", shares: 0.277, price: 360.59, value: 99.88 }]
```

/*´:°•.°+.\*•´.\*:˚.°\*.˚•´.°:°•.°•.\*•´.\*:˚.°\*.˚•´.°:°•.°+.\*•´.\*:*/

## ZK Circuit (Noir)

```
zk/proof-of-solvency/src/main.nr

fn main(
    balances:   [Field; 9],    // PRIVATE — shares per stock (scaled ×100)
    prices:     [Field; 9],    // PRIVATE — price per stock (scaled ×100)
    secret:     Field,         // PRIVATE — random nonce
    threshold:  pub Field,     // PUBLIC  — minimum value to prove
    commitment: pub Field      // PUBLIC  — Poseidon(balances, secret)
) {
    let mut total: Field = 0;
    for i in 0..9 { total = total + balances[i] * prices[i]; }
    assert(total as u64 > threshold as u64);
    let hash = bn254::hash_9(balances);
    assert(commitment == bn254::hash_2([hash, secret]));
}
```

**Prover:** `@noir-lang/noir_js` v1.0.0-beta.15 + `@aztec/bb.js` (UltraHonk backend)
**Verifier:** HonkVerifier.sol (Noir-generated, Sumcheck + Shplemini pairing checks)
**Commitment:** Poseidon hash (BN254 curve) — binds proof to specific balances without revealing them

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## 0G Full Stack (4/4)

```
Compute    3 AI providers (XGBoost + 2 LLMs) = public service → earns fees
Storage    ONNX model with provenance (root_hash)
Chain      ConsensusSettlement + 15 xStock ERC-20 + ProofOfSolvency + HonkVerifier
DA         every AI decision = verifiable audit blob (daHash)

autonomous       → background agent + trade mode
verifiable       → Chain + DA + daHash cross-reference
self-sustaining  → XGBoost provider earns compute fees
```

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Dynamic SDK

| Feature | Implementation |
|---------|---------------|
| Social auth | Google login via `useSocialAccounts` — 1-click onboarding |
| Email OTP | 6-digit code via `useConnectWithOtp` |
| Embedded wallet | Auto-created on signup — xStocks live here |
| Ethereum connectors | `EthereumWalletConnectors` for 0G Chain |
| Onramp | Fiat → USDC via `useOnramp` (Coinbase, Apple Pay) |
| Token balances | `useTokenBalances` — real USDC balance display |
| Wallet hooks | `useUserWallets` — address, balance, signing |
| Auto-register | `onAuthSuccess` event → POST /api/user/register |
| Auth guard | Dashboard protected via `useIsLoggedIn` |
| Events | onAuthSuccess, onLogout, onWalletAdded |
| Gasless | ZeroDev/Pimlico smart account (trade mode) |

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16, React 19, Tailwind 4, Framer Motion 12 |
| Auth/Wallet | Dynamic JS SDK v4 (social login, embedded wallet, onramp) |
| Backend | Express.js (port 4000) — API gateway |
| AI | XGBoost ONNX, FastAPI (port 8000), 0G Compute |
| Contracts | Solidity 0.8.24, Foundry, Solady — on 0G Chain (16602) |
| ZK | Noir, UltraPlonk, Noir.js (WASM), @aztec/bb.js |
| Infra | Docker, Caddy, GitHub Actions |

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

## Project Structure

```
Radegast/
  frontend/          Next.js 16, React 19, Tailwind 4, Dynamic SDK
    app/
      landing/       Hero, use case accordions, floating tréma dots
      get-started/   Split layout, email OTP, Google social login
      how-it-works/  7-step pipeline, xStocks list
      verify/        ZK verify page — paste ID, check on-chain
      dashboard/
        page.tsx     Portfolio: donut chart, metrics, stock rows, AddFundsModal
        invest/      Stock discovery: grid, search, sector filters, top movers
        advisor/     AI models: XGBoost/Sentiment/Macro, consensus results
        solvency/    ZK proof generator: real holdings → Noir.js → on-chain
        settings/    Account, investor profile, autonomous trading
        onboarding/  Post-signup flow: profile → fund → pick stocks
        edit/        Edit profile (useUser hook, no mock data)
      api/
        chart/       Yahoo Finance price data proxy
        proof-pdf/   jsPDF ZK proof certificate generator
    lib/
      theme.ts       P (palette), ease, spring — single source of truth
      noir/prover.ts ZK proof generation engine (Noir.js + bb.js WASM)
      hooks/useAI.ts AI consensus hook (frontend → backend → FastAPI)

  backend/           Express.js API gateway (port 4000)
    server.js        All routes: user, trade, holdings, proof, consensus, email

  ai/                Python FastAPI (port 8000)
    consensus/       Orchestrator, vote, execute_trades, submit_da, submit_onchain
    chat/            AI chat advisor
    providers.json   XGBoost + LLM A + LLM B provider configs

  contracts/         Solidity 0.8.24, Foundry, Solady
    src/
      XStockMock.sol        ERC-20 tokenized stock (Solady ERC20 + Ownable)
      ConsensusSettlement.sol  On-chain AI consensus record
      ProofOfSolvency.sol   ZK proof attestation with verify()
      ProofRegistry.sol     Proof storage (submit, check)
      UltraVerifier.sol     Noir-generated UltraPlonk verifier (2,449 lines)

  zk/                Noir circuits
    proof-of-solvency/   assert Σ(balance × price) > threshold
    compute-commitment/  Poseidon(balances, secret)

  docker/            Docker compose + Caddy
  scripts/           Deployment scripts
```

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

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

## Environment

```env
PRIVATE_KEY=                                    # Deployer/signer for 0G Chain
OG_RPC=https://evmrpc-testnet.0g.ai           # 0G testnet RPC
AI_SERVICE_URL=http://localhost:8000            # FastAPI AI service
NEXT_PUBLIC_API_URL=http://localhost:4000       # Frontend → backend
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=             # Dynamic SDK env ID
```

/*.•°:°.´+˚.\*°.˚:\*.´•\*.+°.•°:´\*.´•\*.•°.•°:°.´:•˚°.\*°.˚:\*.´+°.•*/

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
