"use client";

import { PortfolioProvider, SettingsProvider, LivePriceProvider } from "./store";
import { BottomTabBar } from "./shared";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
