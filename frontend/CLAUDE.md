@AGENTS.md

# Frontend — Dynamic SDK Integration

## Stack
- Next.js 16, React 19, Tailwind 4, TypeScript 5, pnpm
- Framer Motion (animations)

## Target User
Zero crypto knowledge. Investing in stocks. Must feel like a banking/fintech app.

## Design System — Palette Radegast

### Base
| Role | Hex |
|---|---|
| Fond | `#D8D2C8` (taupe casse) |
| Texte principal | `#2A2A2A` |
| Texte secondaire | `#6B6B6B` |
| Bordures | `#C4C4C4` |

### Branding
| Role | Hex |
|---|---|
| Radegast (logo, CTA, nav) | `#38A88A` (jade) |
| Jade accent | `#45BA9A` |
| Bouton secondaire | `#504141` (dark brown) |

### Stocks (couleurs rares)
| Stock | Couleur | Hex |
|---|---|---|
| Tesla | Jade | `#45BA9A` |
| NVIDIA | Indigo electrique | `#4B0082` |
| Apple | Terracotta brule | `#CC5A3A` |
| Meta | Moutarde safran | `#C8A415` |
| Amazon | Rose ancien | `#B5506A` |

### Finance
| Role | Hex |
|---|---|
| Gains (+) | `#2E8B57` |
| Pertes (-) | `#C62828` |

### Polices
- **Sora** — corps, chiffres, UI
- **Lexend** — labels de sections, uppercase tracking
- **Cinzel Decorative** — logo "Radegast" uniquement

### Style Rules
- Layout FLAT — pas de rectangles/cards, sections separees par espace + lignes fines
- Fond uni partout (pas de cards avec background different)
- Stats avec petite barre coloree au-dessus (pas de box)
- Pas de logo carre, juste le texte "Radegast" en Cinzel Decorative jade
- Ghost cursor jade sur la landing page
- Motion design: Framer Motion, fade-up au scroll, hover scale, parallax hero

## Implementation Status

### IMPLEMENTED (functional)
- **Auth (Dynamic SDK)** — Google + Apple + Email OTP via `useSocialAccounts` + `useConnectWithOtp` (`get-started/page.tsx`)
- **DynamicContextProvider** — root layout wraps all pages (`layout.tsx` → `providers.tsx`)
- **Auth guard** — `useIsLoggedIn` in `dashboard/layout.tsx` redirects to `/get-started` if not authenticated
- **useUser() hook** — centralized user data from Dynamic SDK → localStorage → default (`store.tsx`)
- **Events** — `onAuthSuccess` + `onLogout` listeners active
- **Landing page** — MetaMask hero, floating trémas, how-it-works, nav
- **Auth page** — tabs, deblur effect, social login buttons
- **How it works page** — 7-step pipeline explanation
- **Verify pages** — calls `GET /api/proof/:id` on backend, shows result from API
- **Dashboard portfolio** — donut chart, metrics, allocation bar, empty state when no holdings
- **Dashboard invest** — stock discovery grid, search, sector filters, stock cards
- **Dashboard advisor** — empty state, calls backend for AI recommendations when connected
- **Dashboard settings** — reads user from Dynamic, investor profile, autonomous trading config
- **Dashboard solvency** — calls `POST /api/proof/generate` on backend, proof history (session)
- **TradeModal** — buy/sell with real chart data, amount input, order summary
- **Portfolio store** — holdings + cash, starts empty (0 holdings, $0 cash)
- **Settings store** — AI suggestions toggle, autonomous trading session management
- **Stock price chart API** — `/api/chart` route fetches real Yahoo Finance data
- **Root redirect** — `/` redirects to `/landing`

### Backend API calls (wired, needs backend endpoints)
- `POST /api/user/register` — called on signup (`get-started/page.tsx`)
- `POST /api/consensus` — advisor page will call when backend is ready
- `POST /api/proof/generate` — solvency page calls to generate proof (`solvency/page.tsx`)
- `GET /api/proof/:id` — verify pages call to check proof (`verify/page.tsx`, `verify/[id]/page.tsx`)

See `backend/CLAUDE.md` for the full API contract.

### Dynamic SDK (needs wiring, not backend-dependent)
- **Add Funds onramp** — replace `setTimeout` in `AddFundsModal` with Dynamic Coinbase onramp
- **Trade execution** — replace `setTimeout` in `TradeModal` with embedded wallet signature
- **Embedded wallet balance** — replace `cash` state with `primaryWallet.getBalance()`
- **Gasless transactions** — needs ZeroDev/Pimlico smart account config
- **Portfolio holdings** — read from on-chain xStock balances via wallet

### Stretch goals
- WalletConnect, Bridge (LI.FI), Swap (Circle), MFA, Captcha, Passkeys

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

## Design Decisions (current)

### Landing page
- MetaMask-style hero: giant logo (95vw) with clip-path reveal animation, no heading text
- Logo uses `logo-no-dots.svg` (without trémas) — the 4 dots are overlaid as separate elements that float independently with different rhythms
- Subtitle only: "Buy Tesla, NVIDIA, Apple as tokens..."
- No badge pills (removed the uppercase tracking jade pills from all pages)
- No logo in the nav corner on landing — the hero IS the logo
- Below hero: 3 use cases (Invest 24/7, AI advisor, ZK proof) simple layout
- Footer: just "ETHGlobal Cannes 2026"

### Auth page (get-started)
- Heading: "The märkets never sleep. Neither should your money." (jade)
- Tabs (Sign in / Create account): dark bg when active, text transition effect on switch
- Submit button: black (#2A2A2A), deblur effect on hover (text goes blur→sharp)
- Labels (EMAIL, etc.): dark color, not gray
- Social login: Google + Apple

### Navigation
- Floating pill, top-right, no logo in corner
- Links: Home, How it works, Verify, Get Started (black pill)

### Micro-interactions
- Framer Motion everywhere: fade-up on scroll, spring hover, deblur on buttons
- Tréma dots float with different durations (2.6s–3.2s) and delays for organic feel
- Tab switch: text re-renders with fade-up transition
- No neon/glow effects — keep it clean and flat

## Commands
```bash
pnpm dev     # Start dev server
pnpm build   # Production build
pnpm lint    # ESLint
```
