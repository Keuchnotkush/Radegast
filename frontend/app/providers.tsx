"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
        walletConnectors: [EthereumWalletConnectors],
        events: {
          onAuthSuccess: (args) => console.log("[Dynamic] Auth success", args),
          onLogout: () => console.log("[Dynamic] Logged out"),
        },
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
