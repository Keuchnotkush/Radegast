@AGENTS.md

# Frontend — Radegast UI

## Stack
- Next.js 16, React 19, Tailwind 4, TypeScript 5, pnpm
- Framer Motion 12 (all animations)
- Dynamic SDK v4 (auth, wallets, onramp)

## Target User
Zero crypto knowledge. Investing in stocks. Must feel like Revolut/Trade Republic — a banking/fintech app, NOT a dApp.

## Project Structure

```
app/
├── lib/
│   └── theme.ts              # P (palette), ease, spring — SINGLE SOURCE OF TRUTH
├── components/
│   └── topography.tsx         # Animated canvas background (verify page)
├── providers.tsx              # DynamicContextProvider wrapper
├── layout.tsx                 # Root layout: Google Fonts (Sora, Lexend, Cinzel), metadata
├── globals.css                # Tailwind 4, CSS vars, scrollbar, .get-started-btn
├── page.tsx                   # Redirect / → /landing
│
├── landing/
│   ├── page.tsx               # Hero (giant logo + floating tréma dots), 3 use case accordions
│   └── nav.tsx                # Floating pill nav (desktop) + bottom tab bar (mobile)
│
├── get-started/
│   └── page.tsx               # Auth: split layout, tabs, email OTP, Google social login
│
├── how-it-works/
│   └── page.tsx               # 7-step pipeline accordions, xStocks list
│
├── verify/
│   ├── page.tsx               # ZK verify: jade overlay, step cards, input + result
│   └── [id]/page.tsx          # Direct verify by ID (server param)
│
├── dashboard/
│   ├── layout.tsx             # Auth guard + providers (LivePrice, Settings, Portfolio)
│   ├── shared.tsx             # NavAvatar, BottomTabBar, TradeModal, SectionTitle, TogglePill
│   ├── store.tsx              # Contexts: Portfolio, Settings, LivePrices, useUser, MARKET data
│   ├── page.tsx               # Portfolio: donut chart, metrics, allocation bar, stock rows, AddFundsModal
│   ├── invest/page.tsx        # Stock discovery: grid, search, sector filters, top movers
│   ├── advisor/page.tsx       # AI models: XGBoost/Sentiment/Macro, toggle modes, recommendations
│   ├── solvency/page.tsx      # ZK proof generator: threshold, export format, proof history
│   ├── settings/page.tsx      # Account, investor profile, autonomous trading, MFA modal
│   ├── onboarding/page.tsx    # Post-signup onboarding flow
│   └── edit/page.tsx          # Portfolio edit page
│   └── chat/page.tsx          # AI chat interface
│
└── api/
    ├── chart/route.ts         # GET — Yahoo Finance price data proxy
    └── proof-pdf/route.ts     # POST — jsPDF ZK proof certificate generator
```

## Design System — Palette Radegast

**Single source: `app/lib/theme.ts`** — all files import `{ P, ease, spring }` from here.

### Colors
| Token | Hex | Usage |
|---|---|---|
| `P.bg` | `#D8D2C8` | Page background (taupe cassé) |
| `P.surface` | `#F0EDE8` | Elevated surfaces, nav, modals |
| `P.dark` | `#2A2A2A` | Primary text, dark buttons |
| `P.gray` | `#6B6B6B` | Secondary text, labels |
| `P.border` | `#C4C4C4` | Borders, dividers (usually + opacity suffix like `30`) |
| `P.white` | `#FFFFFF` | White text on dark/colored backgrounds |
| `P.jade` | `#38A88A` | Brand primary — CTAs, active states, logo |
| `P.jadeAccent` | `#45BA9A` | Lighter jade for hover states |
| `P.jadeDark` | `#2D8E74` | Darker jade variant |
| `P.indigo` | `#4B0082` | NVIDIA, use case 02, accent |
| `P.terracotta` | `#CC5A3A` | Apple stock, use case 03, avatar |
| `P.safran` | `#C8A415` | Meta stock, accent |
| `P.roseAncien` | `#B5506A` | Amazon stock, accent |
| `P.gain` | `#2E8B57` | Positive returns (green) |
| `P.loss` | `#C62828` | Negative returns (red) |
| `P.cream` | `#D8D2C8` | Alias for bg (used in verify for contrast naming) |

### Stock Colors (in `store.tsx`)
| Ticker | Color | Hex |
|---|---|---|
| TSLA | Jade accent | `#45BA9A` |
| NVDA | Indigo | `#4B0082` |
| AAPL | Terracotta | `#CC5A3A` |
| META | Safran | `#C8A415` |
| AMZN | Rose ancien | `#B5506A` |
| GOOGL | Google blue | `#4285F4` |
| SPY | Jade | `#38A88A` |
| QQQ | Medium slate | `#7B68EE` |
| MSTR | Bitcoin orange | `#F7931A` |
| MSFT | Azure | `#00A4EF` |
| JPM | Navy | `#003A70` |
| V | Visa blue | `#1A1F71` |
| XOM | Red | `#ED1C24` |
| LLY | Crimson | `#D52B1E` |
| MC.PA | Gold | `#8B6914` |

### Fonts
- **Sora** — body, numbers, UI elements
- **Lexend** — section labels (11px, uppercase, tracking-wider, semibold)
- **Cinzel Decorative** — "Radegast" logo text only

### Animation Tokens
```ts
ease = [0.22, 1, 0.36, 1]     // cubic-bezier — smooth deceleration
spring = { type: "spring", stiffness: 400, damping: 20 }  // responsive spring
```

## Animation Patterns (Framer Motion)

Every animation follows these conventions. **Do not deviate.**

### Page Enter
- Elements fade up: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
- Staggered with `delay: 0.1 * index`
- Duration: 0.4–0.6s with `ease` bezier

### Hover
- Buttons: `whileHover={{ scale: 1.02–1.08 }} whileTap={{ scale: 0.95–0.97 }}`
- Always use `spring` transition for hover (snappy response)
- Stock rows: `whileHover={{ x: 10, scale: 1.01 }}` (subtle slide)

### Modals (Phantom-style)
- Backdrop: `rgba(42,42,42,0.4)` + `backdropFilter: blur(4px)`
- Panel: slides from bottom `initial={{ y: "100%" }} animate={{ y: 0 }}`
- Spring transition: `{ type: "spring", stiffness: 300, damping: 30 }`
- Content steps use `AnimatePresence mode="wait"` for smooth state transitions

### Deblur Effect (signature interaction)
- Button text re-renders on hover with: `initial={{ opacity: 0, filter: "blur(8px)", scale: 0.9 }}`
- Used on: Submit buttons (get-started), Save button (settings), Activate button (settings)
- Tracks hover count to trigger re-render: `onHoverStart={() => setHoverCount(h => h + 1)}`

### Clip-Path Reveals
- Landing logo: `clipPath: "inset(0 100% 0 0)" → "inset(0 0% 0 0)"` (left-to-right wipe)
- Get-started heading: same wipe but larger text
- Verify jade overlay: `clipPath: "circle(0% at 50% 50%)" → "circle(150% at 50% 50%)"`
- Get-started jade circle: expands on login success as page transition

### Accordion Pattern (reused on landing, how-it-works, advisor)
- Giant number (`text-7xl md:text-[120px]`) as button
- Number color fades: `${color}30` (dim) → `${color}` (full) when open
- Colored block deploys below: `initial={{ height: 0, borderRadius: 40 }} animate={{ height: "auto", borderRadius: 20 }}`
- Duration: 0.55s with `ease` bezier
- Content fades in with 0.15s delay after block opens

### Floating Tréma Dots (landing hero)
- 4 dots overlaid on logo SVG via absolute positioning
- CSS `@keyframes float0–3` with 6-point irregular paths
- Different durations (7s, 8.2s, 7.6s, 8.8s) for organic feel
- Enter via Framer: scale spring + opacity fade, delayed 2.0–3.3s after page load
- `will-change: transform` for GPU compositing

### Donut Chart (portfolio)
- SVG `<circle>` with `strokeDasharray` animation
- Each segment animates sequentially: `delay: 0.15 * index`
- Center text: scale from 0.8 with blur
- Allocation bar below uses same staggered width animation

### Mini Charts (invest cards, stock rows)
- Static SVG polylines with gradient fill
- In stock rows: `pathLength` animation from 0→1 (draw effect)
- Colors match stock's assigned color

## Style Rules (NON-NEGOTIABLE)

1. **FLAT layout** — no card backgrounds for stats/metrics, use thin borders + whitespace
2. **No dark mode** — fixed light palette, always `P.bg` background
3. **Stats** have a colored 3px bar above them (`h-[3px] rounded-full mb-3`)
4. **Section titles** are always: `<SectionTitle>` component = 11px, Lexend, uppercase, tracking-wider, semibold, gray
5. **Buttons** use `.get-started-btn` class (dark bg, jade on hover) OR inline jade bg
6. **Scrollbars** are thin, translucent, rounded (globals.css)
7. **Font**: body is Sora via Google Fonts link in `<head>` (not `next/font`)
8. **No card-like elements with different backgrounds** — use `P.surface` only for modals, nav, and explicit surface elements (settings sections, onboarding)

## Component Architecture

### Shared Components (`dashboard/shared.tsx`)
| Component | Props | Usage |
|---|---|---|
| `BottomTabBar` | none | Mobile nav — 5 tabs, fixed bottom |
| `NavAvatar` | `{ initial: string }` | Desktop nav — hover-expand pill, fixed top-right |
| `SectionTitle` | `{ children }` | Uppercase label (Lexend) |
| `TradeModal` | `{ stock: TradeStock, onClose }` | Buy/sell slide-up panel with chart |
| `TogglePill` | `{ checked, onChange, label, icon? }` | Toggle button (used in advisor, solvency) |

### Store (`dashboard/store.tsx`)
| Export | Type | Purpose |
|---|---|---|
| `logoUrl(ticker)` | function | Logo.dev API URL for stock logo |
| `STOCK_COLORS` | Record | Ticker → hex color mapping |
| `MARKET` | MarketStock[] | 15 stocks with static fallback prices |
| `LivePriceProvider` | Context | Fetches real prices from `/api/chart` every 60s |
| `useLivePrices()` | hook | Raw prices + loading state |
| `useLiveMarket()` | hook | MARKET with live price overlay |
| `PortfolioProvider` | Context | Holdings + cash + buy/sell/addFunds |
| `usePortfolio()` | hook | Access portfolio state + actions |
| `SettingsProvider` | Context | AI suggestions + autonomous trading session |
| `useSettings()` | hook | Toggle AI, manage auto session |
| `useUser()` | hook | Dynamic SDK → localStorage → "Investor" fallback |

### Navigation Pattern
- **Public pages** (landing, how-it-works, verify, get-started): `<Nav />` from `landing/nav.tsx`
  - Desktop: floating pill top-right, hover-expands to show links + "Get Started" CTA
  - Mobile: fixed bottom tab bar with 4 tabs
- **Dashboard pages**: `<NavAvatar />` from `shared.tsx` + `<BottomTabBar />` from layout
  - Desktop: floating pill top-right, hover-expands to show dashboard links + avatar
  - Mobile: fixed bottom tab bar with 5 tabs (Portfolio, Invest, AI, Proof, Settings)

## Page-by-Page UX Details

### Landing (`/landing`)
- Full-screen hero: giant `logo-no-dots.svg` (width: 100%) with clip-path left→right reveal
- 4 jade dots positioned to match tréma positions, float independently via CSS keyframes
- Below: subtitle text fades up
- 3 use case accordions: numbered 01/02/03, click to reveal colored content block
- Footer: "ETHGlobal Cannes 2026"

### Get Started (`/get-started`)
- Split layout: left = giant typographic statement ("The märkets never sleep"), right = auth form
- Mobile: heading above form (single column)
- Pill tabs: "Sign in" / "Create account" with dark bg toggle
- Email OTP: 6 individual input boxes, auto-advance, paste support
- Submit: deblur text effect on hover
- Social: Google only (Apple removed)
- On login success: jade circle expands as page transition → redirect to dashboard/onboarding

### How It Works (`/how-it-works`)
- 7-step numbered accordion pipeline
- Same accordion pattern as landing use cases
- xStocks ticker list with colored chips
- Manifesto section at top

### Verify (`/verify`)
- Jade overlay fills screen on load (circle clip-path)
- Giant "Verify" text with clip-path reveal
- Input: paste verification ID, hit Verify
- On loading: jade overlay retracts (cream bg shows), spinner
- Success: proof details card (threshold, circuit, chain, status)
- Error: "Proof not found" card
- Below: 5 "How it works" step cards with hover-to-expand
- Topography canvas background for visual depth

### Dashboard Portfolio (`/dashboard`)
- Welcome: "Good to see you, {name}." with staggered fade-in
- Hero section: donut chart + 4 metric cards + "Add funds" button + allocation bar with legend
- AI Activity section (if AI enabled): empty state with configure link
- Stock list: rows with logo, name, shares, value, mini chart, change%, chevron
- Click stock → TradeModal opens

### Dashboard Invest (`/dashboard/invest`)
- Cash pill showing available balance
- Top movers: horizontal scroll, 6 stocks sorted by |change|
- Search bar (rounded-full) + sector filter pills
- Grid: 2/3/4 columns, cards with logo, name, mini chart, price, change, sector tag, owned badge
- Click card → TradeModal opens

### Dashboard Advisor (`/dashboard/advisor`)
- Mode toggles: AI Advisor pill + Autonomous Trading pill
- Model consensus: 3 model names (XGBoost, Sentiment, Macro) as big text buttons
- Click model → colored block expands below with stats and detail cards
- Recommendations section: empty state (waiting for backend)
- Autonomous trades section: empty state with pulse "Live" badge
- Explainer card at bottom

### Dashboard Solvency (`/dashboard/solvency`)
- Threshold selector: pill buttons ($10K–$100K) + custom input
- Export format: PDF and QR Code toggle pills
- 4 step cards explaining ZK process
- Generate button → calls `POST /api/proof/generate`
- Result: proof hash, verify link, PDF download, QR code
- History: list of past proofs with status

### Dashboard Settings (`/dashboard/settings`)
- Account fields (name, email, password) in surface card
- Investor profile pills (Conservative→Aggressive) in surface card
- AI Advisor toggle switch in surface card
- Autonomous Trading: if active → stats + budget bar + notifications toggle + revoke
- If inactive → duration pills + limit pills + permissions list + activate button
- MFA modal: centered overlay, 6-digit input, confirm/cancel
- Save button (deblur effect) + Log out button (red)

## Implementation Status

### Done
- Auth (Dynamic SDK): Google + Email OTP via `useSocialAccounts` + `useConnectWithOtp`
- DynamicContextProvider wrapping all pages
- Auth guard (active — redirects to /get-started if not logged in)
- All 12 pages listed above, fully functional with mock data
- Real stock prices via Yahoo Finance (`/api/chart`)
- PDF certificate generation (`/api/proof-pdf`)
- Backend API calls wired (register, consensus, proof/generate, proof/:id)
- Trade execution via `/api/trade` endpoint (buy/sell xStocks on-chain)

### Needs Backend
- `POST /api/consensus` — advisor page will call when backend serves AI votes
- `POST /api/proof/generate` — works but falls back to mock on error
- `GET /api/proof/:id` — verify page calls, needs real proofs stored

### Needs Dynamic SDK Wiring
- **Add Funds onramp** — replace `setTimeout` in `AddFundsModal` with Coinbase onramp
- **Wallet balance** — replace `cash` state with `primaryWallet.getBalance()`
- **Gasless txs** — ZeroDev/Pimlico smart account config
- **On-chain holdings** — read xStock ERC-20 balances via wallet

### TODOs in Code
| File | What |
|---|---|
| `dashboard/page.tsx` | Replace AddFundsModal `setTimeout` with Dynamic Coinbase onramp |

## Dynamic SDK Reference
- Docs: https://www.dynamic.xyz/docs/javascript
- Full docs: https://www.dynamic.xyz/docs/llms.txt
- Packages: `@dynamic-labs/sdk-react-core`, `@dynamic-labs/ethereum`
- Hooks: `useDynamicContext`, `useSocialAccounts`, `useConnectWithOtp`, `useIsLoggedIn`, `useUserWallets`
- Events: `onAuthSuccess`, `onAuthFailure`, `onWalletAdded`, `onEmbeddedWalletCreated`
- Gasless: ZeroDev, Alchemy, Biconomy, Pimlico, Safe, Gelato
- Onramp: Coinbase (Apple Pay no KYC), Crypto.com, Kraken, Iron (SEPA)

## UX Rules (NON-NEGOTIABLE)
1. User must NEVER see: wallets, gas, chains, signing, seed phrases, blockchain, tokens, minting
2. Financial language only: "portfolio", "invest", "stocks", "shares", "returns"
3. All blockchain interactions happen silently behind the scenes
4. Progressive disclosure: advanced features only when relevant
5. Every interactive element has a Framer Motion transition (no raw CSS transitions except .get-started-btn)

## Commands
```bash
pnpm dev     # Start dev server (port 3000)
pnpm build   # Production build
pnpm lint    # ESLint
```
