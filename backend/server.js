import "dotenv/config";
import express from "express";
import cors from "cors";
import { createTransport } from "nodemailer";
import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";

// ── 0G Chain ──
const ogTestnet = defineChain({
  id: 16602,
  name: "0G Newton Testnet",
  nativeCurrency: { name: "A0GI", symbol: "A0GI", decimals: 18 },
  rpcUrls: { default: { http: [process.env.OG_RPC || "https://evmrpc-testnet.0g.ai"] } },
  testnet: true,
});

const publicClient = createPublicClient({ chain: ogTestnet, transport: http() });

const signerAccount = process.env.PRIVATE_KEY
  ? privateKeyToAccount(process.env.PRIVATE_KEY.startsWith("0x") ? process.env.PRIVATE_KEY : `0x${process.env.PRIVATE_KEY}`)
  : null;
const walletClient = signerAccount
  ? createWalletClient({ account: signerAccount, chain: ogTestnet, transport: http() })
  : null;

// ── Contract addresses (0G Testnet) ──
const CONTRACTS = {
  proofOfSolvency: "0x9ad38b9e70a23BE95186C5935930C6Ab05C49dD9",
  proofRegistry: "0x2a768566eF8C8a44129B0b04fD8a2AD240620255",
  consensusSettlement: "0x3dBCdad5Da3a7f345353d8387c7BE6EBe5F6524f",
  xStocks: {
    TSLAx: "0x2dC821592626Ab6375E5B84b4EF94eCb1478EBa6",
    AAPLx: "0xbF7878757DcbCF28E024aEFa7B03B3cF6267aE8c",
    NVDAx: "0xC82291F9b5f22FAecB5530DcF54E6D2086b45fde",
    GOOGx: "0x4eb8fEe5CBDBC434ee88F7781948e8799Ed7Fb82",
    AMZNx: "0xEfF7d05B11CC848Bf7EAbA74a6021B0567aB841d",
    METAx: "0xa483a4342F4D4D8e27364876cF55f3baaFb93310",
    SPYx:  "0xC04F35d970F08F09c23b8C97538fCf62a57c255C",
    NDXx:  "0x88B700918cd051ffa6B02274DE53584695E06bce",
    MSTRx: "0x6ce30D33c6091425bbe162cA353CDbffF7C090d9",
    MSFTx: "0x26F1B3D351Cb8a23E6cCeA93d5143Dc1e185cFA0",
    JPMx:  "0x43da4eCBa6DfD3b901Dd5238a77608c52C420e5b",
    Vx:    "0x781C0de58df40F5f6a1b661F3CB0a5B551A3b683",
    XOMx:  "0x2bEd346a985866B497E052fB807bE4E3FB4D015E",
    LLYx:  "0xa37e660218B3De658444648873d3016E1aD1681d",
    LVMHx: "0x425f1CF3e4f3762B58a32d24a80b7d767Af58441",
  },
};

// ── ABIs (minimal) ──
const proofOfSolvencyAbi = [
  {
    type: "function", name: "check",
    inputs: [{ name: "vid", type: "bytes32" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "user", type: "address" },
        { name: "threshold", type: "uint64" },
        { name: "verifiedAt", type: "uint32" },
        { name: "commitment", type: "bytes32" },
        { name: "verifyId", type: "bytes32" },
      ],
    }],
    stateMutability: "view",
  },
  {
    type: "function", name: "verify",
    inputs: [{ name: "proof", type: "bytes" }, { name: "pub", type: "bytes32[]" }],
    outputs: [{ name: "id", type: "uint256" }, { name: "vid", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
];

const xStockAbi = [
  { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "price", inputs: [], outputs: [{ type: "uint192" }], stateMutability: "view" },
  { type: "function", name: "symbol", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { type: "function", name: "valueOf", inputs: [{ name: "a", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "mint", inputs: [{ name: "to", type: "address" }, { name: "a", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "burn", inputs: [{ name: "f", type: "address" }, { name: "a", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
];

// ── MockUSDC (6 decimals) ──
// Address TBD — Manny deploys with: forge script script/DeployUSDC.s.sol --rpc-url $OG_RPC --broadcast
const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x0000000000000000000000000000000000000000";
const USDC_DECIMALS = 6;
const FAUCET_AMOUNT = 10_000; // $10,000 demo credits on signup

const usdcAbi = [
  { type: "function", name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "mint", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "burn", inputs: [{ name: "from", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
];

/* Frontend ticker → xStock symbol */
const TICKER_TO_XSTOCK = {
  TSLA: "TSLAx", AAPL: "AAPLx", NVDA: "NVDAx", GOOGL: "GOOGx",
  AMZN: "AMZNx", META: "METAx", SPY: "SPYx", QQQ: "NDXx",
  MSTR: "MSTRx", MSFT: "MSFTx", JPM: "JPMx", V: "Vx",
  XOM: "XOMx", LLY: "LLYx", "MC.PA": "LVMHx",
};

const consensusSettlementAbi = [
  {
    type: "function", name: "latestOf",
    inputs: [{ name: "u", type: "address" }],
    outputs: [
      {
        name: "r", type: "tuple",
        components: [
          { name: "user", type: "address" },
          { name: "score", type: "uint16" },
          { name: "confidence", type: "uint16" },
          { name: "label", type: "uint8" },
          { name: "agreed", type: "uint8" },
          { name: "total", type: "uint8" },
          { name: "daHash", type: "bytes32" },
        ],
      },
      { name: "id", type: "uint256" },
    ],
    stateMutability: "view",
  },
];

const proofRegistryAbi = [
  {
    type: "function", name: "submit",
    inputs: [{ name: "user", type: "address" }, { name: "threshold", type: "uint64" }, { name: "commitment", type: "bytes32" }],
    outputs: [{ name: "id", type: "uint256" }, { name: "vid", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function", name: "check",
    inputs: [{ name: "vid", type: "bytes32" }],
    outputs: [{
      name: "", type: "tuple",
      components: [
        { name: "user", type: "address" },
        { name: "threshold", type: "uint64" },
        { name: "verifiedAt", type: "uint32" },
        { name: "commitment", type: "bytes32" },
        { name: "verifyId", type: "bytes32" },
      ],
    }],
    stateMutability: "view",
  },
];

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: process.env.FRONTEND_URL || true,  // true = reflect any origin (dev/codespaces)
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  credentials: true,
}));
app.use(express.json());

// ── Mail transporter ──
const mailer = createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ── Health ──
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ── Send email ──
app.post("/api/email/send", async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ error: "to, subject, and html are required" });
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err.message);
    res.status(500).json({ error: "Failed to send email" });
  }
});

// ── Welcome email (after signup) ──
app.post("/api/email/welcome", async (req, res) => {
  const { to, name } = req.body;
  if (!to || !name) {
    return res.status(400).json({ error: "to and name are required" });
  }
  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "Welcome to Radegast",
      html: `
        <div style="font-family:Sora,sans-serif;color:#2A2A2A">
          <h2>Welcome, ${name}!</h2>
          <p>Your portfolio is ready. Start investing in tokenized US stocks — 24/7, from anywhere.</p>
          <p style="margin-top:24px">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard"
               style="background:#38A88A;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
              Open Dashboard
            </a>
          </p>
        </div>
      `,
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Welcome email error:", err.message);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

// ── In-memory user store ──
const users = new Map();

// ── Register user (called on signup) ──
app.post("/api/user/register", (req, res) => {
  const { email, firstName, lastName } = req.body;
  if (!email || !firstName) {
    return res.status(400).json({ error: "email and firstName are required" });
  }
  const id = Buffer.from(email).toString("base64url");
  const user = { id, email, firstName, lastName: lastName || "", strategy: null, aiMode: "Advisory", createdAt: Date.now() };
  users.set(id, user);
  users.set(email, user); // index by email too
  res.json({ success: true, user });
});

// ── Get user by id or email ──
app.get("/api/user/:key", (req, res) => {
  const user = users.get(req.params.key);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// ── Update user (strategy, aiMode, etc.) ──
app.patch("/api/user/:key", (req, res) => {
  const user = users.get(req.params.key);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  Object.assign(user, req.body);
  res.json({ success: true, user });
});

// ── Verify proof on-chain (read) ──
app.get("/api/proof/:id", async (req, res) => {
  const vid = req.params.id;
  if (!vid || !vid.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid verification ID" });
  }

  try {
    // Try ProofRegistry first (new contract), then fall back to ProofOfSolvency
    let attestation;
    try {
      attestation = await publicClient.readContract({
        address: CONTRACTS.proofRegistry,
        abi: proofRegistryAbi,
        functionName: "check",
        args: [vid],
      });
    } catch {
      attestation = await publicClient.readContract({
        address: CONTRACTS.proofOfSolvency,
        abi: proofOfSolvencyAbi,
        functionName: "check",
        args: [vid],
      });
    }
    res.json({
      valid: true,
      threshold: `$${Number(attestation.threshold).toLocaleString()}`,
      verifiedAt: new Date(Number(attestation.verifiedAt) * 1000).toISOString(),
      chain: "0G Chain",
      circuit: "UltraPlonk",
      commitment: attestation.commitment,
      user: attestation.user,
    });
  } catch (err) {
    console.error("Proof check error:", err.message);
    res.status(404).json({ error: "Proof not found" });
  }
});

// ── Generate proof on-chain (write) ──
app.post("/api/proof/generate", async (req, res) => {
  const { threshold, proof, publicInputs } = req.body;
  if (!threshold) {
    return res.status(400).json({ error: "threshold is required" });
  }

  // Demo mode: no ZK proof provided — return a deterministic hash
  if (!proof || !publicInputs) {
    const ts = Date.now();
    const demoHash = "0x" + Buffer.from(`demo-${threshold}-${ts}`).toString("hex").padEnd(64, "0").slice(0, 64);
    return res.json({
      hash: demoHash,
      threshold,
      result: true,
      timestamp: new Date(ts).toISOString(),
      demo: true,
    });
  }

  // ZK proof was generated client-side — store attestation on-chain via ProofRegistry
  if (!walletClient) {
    return res.status(500).json({ error: "No signer configured — set PRIVATE_KEY in .env" });
  }
  try {
    // Parse threshold number and commitment from public inputs
    const thresholdNum = parseInt(threshold.replace(/[$,]/g, "")) || 0;
    const commitment = publicInputs.length > 1
      ? (publicInputs[1].startsWith("0x") ? publicInputs[1] : "0x" + publicInputs[1]).padEnd(66, "0")
      : "0x" + "0".repeat(64);

    console.log(`  📝 Storing attestation: threshold=${thresholdNum}, commitment=${commitment.slice(0, 18)}...`);

    const txHash = await walletClient.writeContract({
      address: CONTRACTS.proofRegistry,
      abi: proofRegistryAbi,
      functionName: "submit",
      args: [
        signerAccount.address,  // user
        BigInt(thresholdNum),    // threshold
        commitment,              // commitment from ZK proof
      ],
    });

    // Wait for receipt to get the verifyId from event logs
    let verifyId = txHash;
    try {
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 60_000 });
      // Find the Verified event (skip OwnershipTransferred etc)
      for (const log of receipt.logs) {
        if (log.data && log.data.length >= 130) {
          verifyId = "0x" + log.data.slice(66, 130);
          break;
        }
      }
      console.log(`  ✅ Attestation stored on-chain: ${verifyId.slice(0, 18)}...`);
    } catch {
      console.log("  ⚠️  Receipt timeout — retrying...");
      // Retry once with longer timeout
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 120_000 });
        for (const log of receipt.logs) {
          if (log.data && log.data.length >= 130) {
            verifyId = "0x" + log.data.slice(66, 130);
            break;
          }
        }
        console.log(`  ✅ Attestation stored (retry): ${verifyId.slice(0, 18)}...`);
      } catch {
        console.log("  ⚠️  Receipt still pending — tx submitted as", txHash.slice(0, 18));
      }
    }

    res.json({
      hash: verifyId,
      txHash,
      threshold,
      result: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Proof registry error:", err.message);
    res.status(500).json({ error: "Failed to store attestation on-chain: " + err.message });
  }
});

// ── Get latest agent result — proxy to AI service ──
app.get("/api/agent/latest/:userId", async (req, res) => {
  try {
    const aiRes = await fetch(`${AI_SERVICE_URL}/api/agent/latest/${req.params.userId}`);
    if (!aiRes.ok) return res.status(aiRes.status).json({ error: "No results" });
    res.json(await aiRes.json());
  } catch {
    res.status(502).json({ error: "AI service unavailable" });
  }
});

// ── Get xStock balances for a wallet address ──
app.get("/api/holdings/:address", async (req, res) => {
  const addr = req.params.address;
  if (!addr || !addr.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid address" });
  }
  try {
    const entries = Object.entries(CONTRACTS.xStocks);
    const holdings = await Promise.all(
      entries.map(async ([symbol, contractAddr]) => {
        const [balance, price] = await Promise.all([
          publicClient.readContract({ address: contractAddr, abi: xStockAbi, functionName: "balanceOf", args: [addr] }),
          publicClient.readContract({ address: contractAddr, abi: xStockAbi, functionName: "price", args: [] }),
        ]);
        const shares = Number(balance) / 1e18;
        const priceUsd = Number(price) / 1e6;
        return { symbol, shares, priceUsd, valueUsd: shares * priceUsd };
      })
    );
    res.json({ holdings: holdings.filter((h) => h.shares > 0.0001) });
  } catch (err) {
    console.error("Holdings error:", err.message);
    res.status(500).json({ error: "Failed to read holdings" });
  }
});

// ── POST consensus — proxy to AI service ──
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

app.post("/api/consensus", async (req, res) => {
  const { user, positions, strategy, mode } = req.body;
  try {
    const aiRes = await fetch(`${AI_SERVICE_URL}/api/consensus`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user: user || "0x0000000000000000000000000000000000000000",
        positions: positions || {},
        strategy: strategy || "balanced",
        mode: mode || "conseil",
      }),
    });
    if (!aiRes.ok) {
      const err = await aiRes.text();
      return res.status(aiRes.status).json({ error: err });
    }
    const data = await aiRes.json();
    res.json(data);
  } catch (err) {
    console.error("AI consensus proxy error:", err.message);
    res.status(502).json({ error: "AI service unavailable" });
  }
});

// ── Set user trade mode — proxy to AI service ──
app.post("/api/profile/mode", async (req, res) => {
  const { user_id, mode } = req.body;
  try {
    const aiRes = await fetch(`${AI_SERVICE_URL}/api/profile/mode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user_id || "default", mode: mode || "conseil" }),
    });
    if (!aiRes.ok) {
      const err = await aiRes.text();
      return res.status(aiRes.status).json({ error: err });
    }
    res.json(await aiRes.json());
  } catch (err) {
    console.error("AI profile/mode proxy error:", err.message);
    res.status(502).json({ error: "AI service unavailable" });
  }
});

// ── Get latest AI consensus for a user ──
app.get("/api/consensus/:address", async (req, res) => {
  const addr = req.params.address;
  if (!addr || !addr.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid address" });
  }
  try {
    const [record, id] = await publicClient.readContract({
      address: CONTRACTS.consensusSettlement,
      abi: consensusSettlementAbi,
      functionName: "latestOf",
      args: [addr],
    });
    const labels = ["hold", "buy", "sell"];
    res.json({
      id: Number(id),
      score: record.score,
      confidence: record.confidence,
      label: labels[record.label] || "unknown",
      agreed: record.agreed,
      total: record.total,
      daHash: record.daHash,
    });
  } catch {
    res.status(404).json({ error: "No consensus records" });
  }
});

// ── Get on-chain prices for all xStocks ──
app.get("/api/prices", async (_req, res) => {
  try {
    const entries = Object.entries(CONTRACTS.xStocks);
    const prices = await Promise.all(
      entries.map(async ([symbol, contractAddr]) => {
        const price = await publicClient.readContract({
          address: contractAddr, abi: xStockAbi, functionName: "price", args: [],
        });
        return { symbol, priceUsd: Number(price) / 1e6 };
      })
    );
    res.json({ prices });
  } catch (err) {
    console.error("Prices error:", err.message);
    res.status(500).json({ error: "Failed to read prices" });
  }
});

// ── Faucet: mint demo USDC to wallet (called on signup / add funds) ──
app.post("/api/faucet", async (req, res) => {
  const { walletAddress, amount } = req.body;
  if (!walletAddress) return res.status(400).json({ error: "walletAddress required" });
  if (!walletClient) return res.status(500).json({ error: "No signer — set PRIVATE_KEY" });
  if (USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return res.status(503).json({ error: "MockUSDC not deployed — set USDC_ADDRESS in .env" });
  }

  const usdAmount = amount || FAUCET_AMOUNT;
  const weiAmount = BigInt(usdAmount) * BigInt(10 ** USDC_DECIMALS);

  try {
    const txHash = await walletClient.writeContract({
      address: USDC_ADDRESS, abi: usdcAbi, functionName: "mint",
      args: [walletAddress, weiAmount],
    });
    res.json({ success: true, txHash, amount: usdAmount, symbol: "USDC" });
  } catch (err) {
    console.error("Faucet error:", err.message);
    res.status(500).json({ error: "Faucet failed: " + err.message });
  }
});

// ── USDC balance ──
app.get("/api/usdc/:address", async (req, res) => {
  if (USDC_ADDRESS === "0x0000000000000000000000000000000000000000") {
    return res.json({ balance: 0, formatted: "0.00" });
  }
  try {
    const raw = await publicClient.readContract({
      address: USDC_ADDRESS, abi: usdcAbi, functionName: "balanceOf",
      args: [req.params.address],
    });
    const formatted = (Number(raw) / 10 ** USDC_DECIMALS).toFixed(2);
    res.json({ balance: Number(raw), formatted, symbol: "USDC" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Trade: buy (burn USDC → mint xStock) or sell (burn xStock → mint USDC) ──
app.post("/api/trade", async (req, res) => {
  const { action, ticker, usdAmount, walletAddress } = req.body;
  if (!action || !ticker || !usdAmount || !walletAddress) {
    return res.status(400).json({ error: "action, ticker, usdAmount, and walletAddress are required" });
  }
  if (!walletClient) {
    return res.status(500).json({ error: "No signer configured — set PRIVATE_KEY in .env" });
  }

  const xSymbol = TICKER_TO_XSTOCK[ticker];
  if (!xSymbol) return res.status(400).json({ error: `Unknown ticker: ${ticker}` });

  const contractAddr = CONTRACTS.xStocks[xSymbol];
  if (!contractAddr) return res.status(400).json({ error: `No contract for ${xSymbol}` });

  const hasUsdc = USDC_ADDRESS !== "0x0000000000000000000000000000000000000000";

  try {
    // Read on-chain price to calculate shares
    const price = await publicClient.readContract({
      address: contractAddr, abi: xStockAbi, functionName: "price", args: [],
    });
    const priceUsd = Number(price) / 1e6;
    const shares = usdAmount / priceUsd;
    const weiShares = BigInt(Math.floor(shares * 1e18));
    const weiUsdc = BigInt(Math.floor(usdAmount * 10 ** USDC_DECIMALS));

    const txHashes = [];

    if (action === "buy") {
      // 1. Burn USDC from user (payment)
      if (hasUsdc) {
        const usdcTx = await walletClient.writeContract({
          address: USDC_ADDRESS, abi: usdcAbi, functionName: "burn",
          args: [walletAddress, weiUsdc],
        });
        txHashes.push({ step: "burn_usdc", txHash: usdcTx });
      }
      // 2. Mint xStock to user
      const stockTx = await walletClient.writeContract({
        address: contractAddr, abi: xStockAbi, functionName: "mint",
        args: [walletAddress, weiShares],
      });
      txHashes.push({ step: "mint_xstock", txHash: stockTx });
    } else if (action === "sell") {
      // 1. Burn xStock from user
      const stockTx = await walletClient.writeContract({
        address: contractAddr, abi: xStockAbi, functionName: "burn",
        args: [walletAddress, weiShares],
      });
      txHashes.push({ step: "burn_xstock", txHash: stockTx });
      // 2. Mint USDC to user (proceeds)
      if (hasUsdc) {
        const usdcTx = await walletClient.writeContract({
          address: USDC_ADDRESS, abi: usdcAbi, functionName: "mint",
          args: [walletAddress, weiUsdc],
        });
        txHashes.push({ step: "mint_usdc", txHash: usdcTx });
      }
    } else {
      return res.status(400).json({ error: "action must be 'buy' or 'sell'" });
    }

    res.json({
      success: true,
      txHashes,
      action,
      ticker,
      xSymbol,
      shares,
      usdAmount,
      priceUsd,
    });
  } catch (err) {
    console.error("Trade error:", err.message);
    res.status(500).json({ error: "Trade failed: " + err.message });
  }
});

app.listen(PORT, () => {
  console.log(`  ⚡ radegast backend — http://localhost:${PORT}`);
  console.log(`  ⛓  0G RPC: ${ogTestnet.rpcUrls.default.http[0]}`);
  console.log(`  📄 ProofOfSolvency: ${CONTRACTS.proofOfSolvency}`);
  console.log(`  🤖 ConsensusSettlement: ${CONTRACTS.consensusSettlement}`);
  console.log(`  💰 xStocks: ${Object.keys(CONTRACTS.xStocks).length} tokens`);
  if (!signerAccount) console.log(`  ⚠️  No PRIVATE_KEY — write operations disabled`);
});
