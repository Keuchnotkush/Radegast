# Backend — Express + AI Proxy

## Owner
Kamil (AI + 0G Integration) + Kassim (Frontend)

## Stack
- Node.js, Express, ES modules
- Nodemailer (email)
- In-memory store (replace with DB before prod)

## Architecture
```
backend/
  server.js           # Express app, mounts routes
  routes/
    user.js           # POST /api/user/register, GET/PATCH /api/user/:key
    email.js          # POST /api/email/send, POST /api/email/welcome
    proof.js          # GET /api/proof/:id, POST /api/proof/generate
    consensus.js      # POST /api/consensus (proxy to AI service)
  services/
    ai.js             # Fetch from AI FastAPI (http://localhost:8000)
    chain.js          # Read from 0G Chain (ProofOfSolvency, XStockMock, ConsensusSettlement)
  middleware/
    auth.js           # Validate Dynamic JWT (future)
```

## Commands
```bash
npm run dev    # node --watch server.js
npm start      # node server.js
```

## Environment
```env
PORT=4000
FRONTEND_URL=http://localhost:3000
AI_SERVICE_URL=http://localhost:8000
OG_RPC=https://evmrpc-testnet.0g.ai
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

---

## API CONTRACT (Frontend <-> Backend)

This is the source of truth. Frontend calls these endpoints. Backend implements them.

### 1. User

#### `POST /api/user/register`
Called on signup from `get-started/page.tsx`.
```
Request:  { email: string, firstName: string, lastName: string }
Response: { success: true, user: { id, email, firstName, lastName, strategy, aiMode, createdAt } }
```
Status: **IMPLEMENTED** (in-memory)

#### `GET /api/user/:key`
Lookup by ID (base64url of email) or by email.
```
Response: { id, email, firstName, lastName, strategy, aiMode, createdAt }
404:      { error: "User not found" }
```
Status: **IMPLEMENTED** (in-memory)

#### `PATCH /api/user/:key`
Update strategy, aiMode, profile, etc.
```
Request:  { strategy?: string, aiMode?: string, profile?: string }
Response: { success: true, user: { ... } }
```
Status: **IMPLEMENTED** (in-memory)

---

### 2. AI Consensus

#### `POST /api/consensus`
Frontend advisor page calls this to get AI recommendations.
Backend proxies to AI FastAPI at `AI_SERVICE_URL/api/consensus`.

```
Request:  { tickers: string[], userProfile?: string }
Response: {
  consensus_label: "HIGH" | "MEDIUM" | "LOW",
  consensus_score: number,       // 0-100
  confidence: number,            // 0-1
  models: [
    { name: "XGBoost", vote: "bullish" | "bearish" | "neutral", score: number },
    { name: "Sentiment", vote: "bullish" | "bearish" | "neutral", score: number },
    { name: "Macro", vote: "bullish" | "bearish" | "neutral", score: number }
  ],
  recommendations: [
    {
      ticker: string,
      type: "buy" | "sell" | "hold",
      confidence: number,        // 0-100
      headline: string,
      reasoning: string,
      amount: number             // suggested USD
    }
  ]
}
```
Status: **NEEDS IMPLEMENTATION** — AI service currently returns mock data.
AI endpoint: `POST http://localhost:8000/api/consensus`

---

### 3. ZK Proof of Solvency

#### `POST /api/proof/generate`
Called from `dashboard/solvency/page.tsx` when user generates a proof.
Backend should either:
- (a) Call ProofOfSolvency.verify() on-chain if Noir circuit is ready
- (b) Store the proof attestation and return a verifyId

```
Request:  { threshold: string }    // e.g. "$50,000" or "50000"
Response: {
  hash: string,                    // verifyId (bytes32 hex)
  threshold: string,
  result: boolean,
  timestamp: string
}
Error:    { error: string }
```
Status: **NEEDS IMPLEMENTATION**

#### `GET /api/proof/:id`
Called from `verify/page.tsx` and `verify/[id]/page.tsx` to check a proof.
Backend should call ProofOfSolvency.check(verifyId) on-chain.

```
Response: {
  valid: boolean,
  threshold: string,              // e.g. "$50,000"
  verifiedAt: string,             // ISO timestamp
  chain: "0G Chain",
  circuit: "UltraPlonk"
}
404:      { error: "Proof not found" }
```
Status: **NEEDS IMPLEMENTATION**

---

### 4. Email

#### `POST /api/email/send`
Generic email sender.
```
Request:  { to: string, subject: string, html: string }
Response: { success: true }
```
Status: **IMPLEMENTED** (needs SMTP env vars)

#### `POST /api/email/welcome`
Welcome email with dashboard link.
```
Request:  { to: string, name: string }
Response: { success: true }
```
Status: **IMPLEMENTED** (needs SMTP env vars)

---

### 5. Health

#### `GET /health`
```
Response: { status: "ok" }
```
Status: **IMPLEMENTED**

---

## Smart Contracts on 0G Chain

The backend reads/writes these contracts. Addresses TBD after deployment.

### XStockMock (ERC-20)
- `mint(address, uint256)` — MINTER_ROLE only
- `burn(address, uint256)` — MINTER_ROLE only
- `setPrice(uint192)` — owner only
- `valueOf(address)` → portfolio value in USD
- `balanceOf(address)` → shares held

### ConsensusSettlement
- `submit(user, score, confidence, label, agreed, total, daHash)` — SUBMITTER_ROLE
- `latestOf(address)` → latest consensus record
- `verifyDA(id, expectedHash)` → bool

### ProofOfSolvency
- `verify(proof, publicInputs)` → (id, verifyId)
- `check(verifyId)` → Attestation { user, threshold, verifiedAt, commitment, verifyId }
- `setVerifier(address)` — owner only

---

## Integration Notes

1. **Frontend never calls AI or chain directly** — everything goes through this backend
2. **CORS** is set to `FRONTEND_URL` (default `http://localhost:3000`)
3. **Frontend env var**: `NEXT_PUBLIC_API_URL` points to this backend (default `http://localhost:4000`)
4. **Docker**: backend needs to be added to `docker/docker-compose.yml` as a service on port 4000
5. **Auth**: currently no JWT validation. Future: validate Dynamic JWT in middleware/auth.js
