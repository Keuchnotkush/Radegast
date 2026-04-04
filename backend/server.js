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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
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
    const attestation = await publicClient.readContract({
      address: CONTRACTS.proofOfSolvency,
      abi: proofOfSolvencyAbi,
      functionName: "check",
      args: [vid],
    });
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

  // Real flow: submit ZK proof on-chain
  if (!walletClient) {
    return res.status(500).json({ error: "No signer configured — set PRIVATE_KEY in .env" });
  }
  try {
    const hash = await walletClient.writeContract({
      address: CONTRACTS.proofOfSolvency,
      abi: proofOfSolvencyAbi,
      functionName: "verify",
      args: [proof, publicInputs],
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const verifyId = receipt.logs[0]?.topics[3] || hash;
    res.json({
      hash: verifyId,
      txHash: hash,
      threshold,
      result: true,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Proof generate error:", err.message);
    res.status(500).json({ error: "Failed to submit proof on-chain" });
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

// ── Trade: buy (mint) or sell (burn) xStocks ──
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

  try {
    // Read on-chain price to calculate shares
    const price = await publicClient.readContract({
      address: contractAddr, abi: xStockAbi, functionName: "price", args: [],
    });
    const priceUsd = Number(price) / 1e6;
    const shares = usdAmount / priceUsd;
    // Convert shares to 18-decimal wei
    const weiAmount = BigInt(Math.floor(shares * 1e18));

    let txHash;
    if (action === "buy") {
      txHash = await walletClient.writeContract({
        address: contractAddr, abi: xStockAbi, functionName: "mint",
        args: [walletAddress, weiAmount],
      });
    } else if (action === "sell") {
      txHash = await walletClient.writeContract({
        address: contractAddr, abi: xStockAbi, functionName: "burn",
        args: [walletAddress, weiAmount],
      });
    } else {
      return res.status(400).json({ error: "action must be 'buy' or 'sell'" });
    }

    // Don't wait for receipt — 0G testnet is slow but txs go through
    res.json({
      success: true,
      txHash,
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
