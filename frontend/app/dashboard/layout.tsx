"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { PortfolioProvider, SettingsProvider, LivePriceProvider, WalletProvider } from "./store";
import { BottomTabBar } from "./shared";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.replace("/get-started");
    }
  }, [ready, authenticated, router]);

  if (!ready || !authenticated) return null;

  return (
    <LivePriceProvider>
      <WalletProvider>
        <SettingsProvider>
          <PortfolioProvider>
            <div className="pb-20 md:pb-0">{children}</div>
            <BottomTabBar />
          </PortfolioProvider>
        </SettingsProvider>
      </WalletProvider>
    </LivePriceProvider>
  );
}
