"use client";

import { DynamicContextProvider, useDynamicContext, useUserWallets } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { useEffect, useRef, useState, useCallback } from "react";
import { CreditToast } from "./dashboard/shared";

const ogTestnet = {
  blockExplorerUrls: ["https://chainscan-newton.0g.ai"],
  chainId: 16602,
  chainName: "0G Newton Testnet",
  iconUrls: ["https://0g.ai/favicon.ico"],
  name: "0G Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "A0GI",
    symbol: "A0GI",
  },
  networkId: 16602,
  rpcUrls: ["https://evmrpc-testnet.0g.ai"],
  vanityName: "0G Testnet",
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Auto-credit $10,000 demo dollars when wallet becomes available
function AutoFaucet({ children }: { children: React.ReactNode }) {
  const { user } = useDynamicContext();
  const userWallets = useUserWallets();
  const wallet = userWallets?.[0];
  const claimed = useRef(false);
  const [showToast, setShowToast] = useState(false);
  const [creditedAmount, setCreditedAmount] = useState(0);
  const hideToast = useCallback(() => setShowToast(false), []);

  useEffect(() => {
    if (!wallet?.address || !user?.email || claimed.current) return;
    const key = `radegast_faucet_${wallet.address.toLowerCase()}`;
    if (localStorage.getItem(key)) return;

    claimed.current = true;
    // Re-register with wallet to trigger auto-faucet
    fetch(`${API}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        firstName: user.firstName || localStorage.getItem("radegast_firstName") || "",
        lastName: user.lastName || "",
        walletAddress: wallet.address,
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
  }, [wallet?.address, user?.email, user?.firstName, user?.lastName]);

  return (
    <>
      <CreditToast amount={creditedAmount} visible={showToast} onDone={hideToast} />
      {children}
    </>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [EthereumWalletConnectors],
        overrides: {
          evmNetworks: [ogTestnet],
        },
        cssOverrides: `
          /* ─── Radegast theme for Dynamic modals ─── */
          .dynamic-widget-modal, .dynamic-widget-card {
            font-family: 'Sora', sans-serif !important;
            border-radius: 20px !important;
          }
          /* Background & surfaces */
          :root {
            --dynamic-font-family: 'Sora', sans-serif;
            --dynamic-base-1: #F0EDE8;
            --dynamic-base-2: #D8D2C8;
            --dynamic-base-3: #C4C4C430;
            --dynamic-base-4: #C4C4C460;
            --dynamic-text-primary: #2A2A2A;
            --dynamic-text-secondary: #6B6B6B;
            --dynamic-text-tertiary: #6B6B6B80;
            --dynamic-brand-primary-color: #38A88A;
            --dynamic-brand-hover-color: #2D8E74;
            --dynamic-badge-primary-background: #38A88A18;
            --dynamic-badge-primary-color: #38A88A;
            --dynamic-border: #C4C4C430;
            --dynamic-hover: #D8D2C840;
            --dynamic-connect-button-background: #38A88A;
            --dynamic-connect-button-color: #FFFFFF;
            --dynamic-connect-button-border-radius: 12px;
            --dynamic-modal-border-radius: 20px;
            --dynamic-widget-border-radius: 20px;
            --dynamic-modal-padding: 24px;
          }
          /* Primary button (Continue, etc.) */
          .button--primary, [data-testid="dynamic-button-primary"] {
            background: #2A2A2A !important;
            color: #FFFFFF !important;
            border-radius: 12px !important;
            font-family: 'Sora', sans-serif !important;
            font-weight: 600 !important;
          }
          .button--primary:hover, [data-testid="dynamic-button-primary"]:hover {
            background: #38A88A !important;
          }
          /* Input fields */
          .dynamic-widget-modal input, .dynamic-widget-card input {
            font-family: 'Sora', sans-serif !important;
            border-radius: 12px !important;
            border: 1.5px solid #C4C4C440 !important;
            background: #D8D2C8 !important;
          }
          .dynamic-widget-modal input:focus, .dynamic-widget-card input:focus {
            border-color: #38A88A !important;
          }
          /* Sandbox badge — hide or restyle */
          [data-testid="sandbox-badge"], .sandbox-badge {
            background: #C8A415 !important;
            border-radius: 8px !important;
            font-family: 'Sora', sans-serif !important;
          }
          /* Modal overlay */
          .dynamic-modal-overlay {
            background: rgba(42, 42, 42, 0.4) !important;
            backdrop-filter: blur(4px) !important;
          }
          /* Section labels */
          .dynamic-widget-modal label, .dynamic-widget-card label {
            font-family: 'Lexend', sans-serif !important;
            text-transform: uppercase !important;
            font-size: 11px !important;
            letter-spacing: 0.05em !important;
            color: #6B6B6B !important;
          }
        `,
        events: {
          onAuthSuccess: (args) => {
            console.log("[Dynamic] Auth success", args);
            // Auto-register user on backend
            const user = args?.user;
            if (user?.email) {
              fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/user/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: user.email,
                  firstName: user.firstName || "",
                  lastName: user.lastName || "",
                }),
              }).catch(() => {});
            }
          },
          onLogout: () => console.log("[Dynamic] Logged out"),
        },
      }}
    >
      <AutoFaucet>{children}</AutoFaucet>
    </DynamicContextProvider>
  );
}
