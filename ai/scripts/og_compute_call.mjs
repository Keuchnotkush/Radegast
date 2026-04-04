// Usage:
//   node og_compute_call.mjs list                     → liste les services disponibles
//   node og_compute_call.mjs call <providerAddr> <prompt_json>  → appelle un provider
//   node og_compute_call.mjs setup <amount>            → dépose des fonds dans le ledger

import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";

const RPC_URL = process.env.OG_RPC || "https://evmrpc-testnet.0g.ai";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.log(JSON.stringify({ error: "PRIVATE_KEY not set" }));
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

let broker;
try {
  broker = await createZGComputeNetworkBroker(wallet);
} catch (e) {
  console.log(JSON.stringify({ error: `Broker init failed: ${e.message}` }));
  process.exit(1);
}

const command = process.argv[2];

// ===================== LIST =====================
if (command === "list") {
  try {
    const services = await broker.inference.listService();
    const result = services.map(s => ({
      provider: s.provider,
      model: s.model,
      serviceType: s.serviceType,
      url: s.url,
    }));
    console.log(JSON.stringify({ services: result }));
  } catch (e) {
    console.log(JSON.stringify({ error: `List failed: ${e.message}` }));
    process.exit(1);
  }
}

// ===================== SETUP =====================
else if (command === "setup") {
  const amount = process.argv[3] || "0.1";
  try {
    await broker.ledger.addLedger(parseFloat(amount));
    const account = await broker.ledger.getLedger();
    console.log(JSON.stringify({
      success: true,
      balance: ethers.formatEther(account.totalBalance || account.balance || "0"),
    }));
  } catch (e) {
    console.log(JSON.stringify({ error: `Setup failed: ${e.message}` }));
    process.exit(1);
  }
}

// ===================== CALL =====================
else if (command === "call") {
  const providerAddress = process.argv[3];
  const promptJson = process.argv[4];

  if (!providerAddress || !promptJson) {
    console.log(JSON.stringify({ error: "Usage: call <providerAddr> <prompt_json>" }));
    process.exit(1);
  }

  try {
    // Acknowledge provider signer (needed first time)
    try {
      await broker.inference.acknowledgeProviderSigner(providerAddress);
    } catch { /* may already be acknowledged */ }

    // Get service metadata
    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);

    // Build the actual body FIRST, then sign it
    const messages = JSON.parse(promptJson);
    const body = JSON.stringify({ messages, model });

    // Generate single-use auth headers over the real body
    const headers = await broker.inference.getRequestHeaders(providerAddress, body);

    // Make the actual call
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.log(JSON.stringify({ error: `HTTP ${response.status}: ${text}` }));
      process.exit(1);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Verify response (optional but good for judges)
    const chatID = response.headers.get("ZG-Res-Key") || data.id;
    let verified = false;
    if (chatID) {
      try {
        verified = await broker.inference.processResponse(providerAddress, chatID);
      } catch { verified = false; }
    }

    console.log(JSON.stringify({
      content,
      model,
      provider: providerAddress,
      verified,
    }));

  } catch (e) {
    console.log(JSON.stringify({ error: `Call failed: ${e.message}` }));
    process.exit(1);
  }
}

else {
  console.log(JSON.stringify({ error: "Unknown command. Use: list, setup, call" }));
  process.exit(1);
}
