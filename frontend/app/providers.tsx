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
      {children}
    </DynamicContextProvider>
  );
}
