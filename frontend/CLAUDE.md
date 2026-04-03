@AGENTS.md

# Frontend — Dynamic SDK Integration

## Stack
- Next.js 16, React 19, Tailwind 4, TypeScript 5, pnpm

## Target User
Zero crypto knowledge. Investing in stocks. Must feel like a banking/fintech app.

## Dynamic SDK — What we integrate

### Core (must-have)
- **Google social login** — 1-click onboarding
- **Embedded wallet** — auto-created on signup, user never sees it
- **Onramp** — fiat -> USDC via Coinbase (Apple Pay, no KYC up to $500)
- **Gasless transactions** — ZeroDev/Pimlico, user never pays gas
- **Events** — onAuthSuccess, onWalletAdded, onEmbeddedWalletCreated, trade confirmations
- **MFA** — trade approval in advisory mode
- **Captcha** — anti-bot on auth
- **Session JWT** — persistent auth

### Stretch goals
- WalletConnect (power users with external wallet)
- Bridge (LI.FI cross-chain)
- Swap (Circle USDC Gateway)
- Transaction simulation (preview before execute)
- Delegated access (AI agent server-side wallet ops)
- Stablecoin accounts (USDC transfers by email/phone)
- Chainalysis (compliance)
- Email magic link + Passkey auth

## Dynamic SDK Reference
- Docs: https://www.dynamic.xyz/docs/javascript
- Full docs: https://www.dynamic.xyz/docs/llms.txt
- Packages: `@dynamic-labs/sdk-react-core`, `@dynamic-labs/ethereum`
- Components: DynamicWidget, DynamicConnectButton, DynamicEmbeddedWidget, DynamicUserProfile, DynamicNav
- Hooks: useDynamicContext, useDynamicEvents, useUserWallets, useIsLoggedIn
- Events: onAuthSuccess, onAuthFailure, onWalletAdded, onEmbeddedWalletCreated
- Gasless providers: ZeroDev, Alchemy, Biconomy, Pimlico, Safe, Gelato
- Onramp providers: Coinbase (Apple Pay no KYC), Crypto.com, Kraken, Iron (SEPA)

## UX Rules
1. No mention of wallets, gas, chains, signing, seed phrases in UI
2. Financial language: "portfolio", "invest", "stocks" — not "tokens", "mint", "swap"
3. All blockchain interactions happen behind the scenes
4. Progressive disclosure: advanced features only when relevant

## Commands
```bash
pnpm dev     # Start dev server
pnpm build   # Production build
pnpm lint    # ESLint
```
