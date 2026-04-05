"use client";

import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useRef, useState, useCallback } from "react";
import { CreditToast } from "./dashboard/shared";
import { ogTestnet } from "../lib/contracts/client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Auto-credit $10,000 demo dollars when wallet becomes available
function AutoFaucet({ children }: { children: React.ReactNode }) {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const wallet = wallets?.[0];
  const claimed = useRef(false);
  const [showToast, setShowToast] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState(0);
  const hideToast = useCallback(() => setShowToast(false), []);

  useEffect(() => {
    const address = wallet?.address;
    const email = user?.email?.address;
    if (!address || !email || claimed.current) return;
    const key = `radegast_faucet_${address.toLowerCase()}`;
    if (localStorage.getItem(key)) return;

    claimed.current = true;
    fetch(`${API}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        firstName: localStorage.getItem("radegast_firstName") || "",
        lastName: "",
        walletAddress: address,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.credited > 0) {
          localStorage.setItem(key, String(Date.now()));
          setCreditedAmount(data.credited);
          setShowToast(true);
          console.log(`[Radegast] $${data.credited.toLocaleString()} demo credits added`);
        }
      })
      .catch(() => {});
  }, [wallet?.address, user?.email?.address]);

  return (
    <>
      <CreditToast amount={creditedAmount} visible={showToast} onDone={hideToast} />
      {children}
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#38A88A",
          logo: "https://0g.ai/favicon.ico",
        },
        loginMethods: ["email", "google", "discord"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "all-users",
          },
        },
        supportedChains: [ogTestnet],
        defaultChain: ogTestnet,
      }}
    >
      <AutoFaucet>{children}</AutoFaucet>
    </PrivyProvider>
  );
}
