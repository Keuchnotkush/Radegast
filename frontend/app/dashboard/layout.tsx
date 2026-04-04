"use client";

import { PortfolioProvider, SettingsProvider } from "./store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <PortfolioProvider>{children}</PortfolioProvider>
    </SettingsProvider>
  );
}
