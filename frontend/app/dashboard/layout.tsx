"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsLoggedIn } from "@dynamic-labs/sdk-react-core";
import { PortfolioProvider, SettingsProvider, LivePriceProvider } from "./store";
import { BottomTabBar } from "./shared";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useIsLoggedIn();
  const router = useRouter();

  // TODO: re-enable auth guard before production
  // useEffect(() => {
  //   if (isLoggedIn === false) {
  //     router.replace("/get-started");
  //   }
  // }, [isLoggedIn, router]);

  // if (!isLoggedIn) return null;

  return (
    <LivePriceProvider>
      <SettingsProvider>
        <PortfolioProvider>
          <div className="pb-20 md:pb-0">{children}</div>
          <BottomTabBar />
        </PortfolioProvider>
      </SettingsProvider>
    </LivePriceProvider>
  );
}
