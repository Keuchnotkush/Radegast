"use client";

const P = {
  bg: "#D8D2C8",
  border: "#C4C4C4",
  jade: "#9CDAC9",
  jadeDark: "#45BA9A",
  dark: "#504141",
  darkGray: "#575757",
  warmGray: "#99978B",
  green: "#2E8B57",
  red: "#C62828",
  gray: "#6B6B6B",
  grayLight: "#4A4A4A",
  text: "#2A2A2A",
};

const STOCKS = [
  { symbol: "TSLAx", name: "Tesla", price: 247.32, change: +3.42, allocation: 25, color: P.jadeDark },
  { symbol: "NVDAx", name: "NVIDIA", price: 892.15, change: +5.21, allocation: 30, color: "#4B0082" },
  { symbol: "AAPLx", name: "Apple", price: 198.76, change: -0.85, allocation: 20, color: "#CC5A3A" },
  { symbol: "METAx", name: "Meta", price: 512.40, change: +2.17, allocation: 15, color: "#C8A415" },
  { symbol: "AMZNx", name: "Amazon", price: 187.93, change: +1.56, allocation: 10, color: "#B5506A" },
];

const AI_ALERTS = [
  { type: "warning", text: "TSLAx is 25% of your portfolio — strategy target is 20%. Consider reducing exposure.", time: "2m ago" },
  { type: "success", text: "NVDAx earnings beat estimates. Your Growth strategy benefits. No action needed.", time: "1h ago" },
  { type: "info", text: "Market opens in 3h. Pre-market shows S&P 500 futures +0.4%.", time: "3h ago" },
];

function MiniChart({ color, trend }: { color: string; trend: "up" | "down" }) {
  const pts = trend === "up"
    ? "0,28 15,24 30,26 45,18 60,20 75,12 90,14 105,6 120,8"
    : "0,8 15,12 30,10 45,18 60,16 75,22 90,20 105,26 120,24";
  const id = `g15-${color.replace("#", "")}`;
  return (
    <svg width="100" height="28" viewBox="0 0 120 32" fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,32 ${pts} 120,32`} fill={`url(#${id})`} />
      <polyline points={pts} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AllocationBar() {
  return (
    <div className="flex w-full h-2 rounded-full overflow-hidden gap-[1px]" style={{ background: P.border }}>
      {STOCKS.map((s) => (
        <div key={s.symbol} style={{ width: `${s.allocation}%`, background: s.color }} className="h-full first:rounded-l-full last:rounded-r-full" />
      ))}
    </div>
  );
}

function DonutChart() {
  const total = STOCKS.reduce((a, s) => a + s.allocation, 0);
  let cum = 0;
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-36 h-36">
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke={P.border} strokeWidth="12" />
        {STOCKS.map((s) => {
          const off = (cum / total) * c;
          const len = (s.allocation / total) * c;
          cum += s.allocation;
          return <circle key={s.symbol} cx="80" cy="80" r={r} fill="none" stroke={s.color} strokeWidth="12" strokeDasharray={`${len - 2} ${c - len + 2}`} strokeDashoffset={-off} strokeLinecap="round" />;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold" style={{ color: P.text, fontFamily: "Sora" }}>$24,847</span>
        <span className="text-[10px] font-medium" style={{ color: P.gray }}>Portfolio value</span>
      </div>
    </div>
  );
}

export default function Mockup15() {
  return (
    <div className="min-h-screen" style={{ background: P.bg, fontFamily: "Sora, sans-serif", color: P.text }}>
      {/* NAV */}
      <nav className="flex items-center justify-between px-8 py-4" style={{ borderBottom: `1px solid ${P.border}` }}>
        <span className="text-xl" style={{ color: "#38A88A", fontFamily: "'Cinzel Decorative', serif", fontWeight: 700 }}>Radegast</span>
        <div className="flex items-center gap-6">
          <NavLink active>Portfolio</NavLink>
          <NavLink>Invest</NavLink>
          <NavLink>Advisor</NavLink>
          <NavLink>Verify</NavLink>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium" style={{ color: P.gray }}>Growth Strategy</span>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: P.jadeDark, color: "#FFFFFF" }}>K</div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* STATS */}
        <div className="grid grid-cols-4 gap-8 mb-10">
          <Stat label="Total Portfolio" value="$24,847.62" sub="+$842.30 (3.5%)" subColor={P.green} accent={P.jadeDark} />
          <Stat label="Today's Return" value="+$312.18" sub="+1.27%" subColor={P.green} accent={"#4B0082"} />
          <Stat label="Strategy" value="Growth" sub="Aggressive allocation" subColor={P.gray} accent={"#CC5A3A"} />
          <Stat label="AI Mode" value="Advisory" sub="You approve trades" subColor={P.gray} accent={"#C8A415"} />
        </div>

        <div className="grid grid-cols-3 gap-10">
          {/* LEFT */}
          <div className="col-span-2 flex flex-col gap-10">
            <section>
              <SectionTitle>Portfolio Allocation</SectionTitle>
              <div className="flex items-center gap-8 mt-4">
                <DonutChart />
                <div className="flex-1 flex flex-col gap-2">
                  {STOCKS.map((s) => (
                    <div key={s.symbol} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                        <span className="text-[13px] font-medium">{s.name}</span>
                        <span className="text-[11px]" style={{ color: P.gray }}>{s.symbol}</span>
                      </div>
                      <span className="text-[13px] font-semibold">{s.allocation}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5"><AllocationBar /></div>
            </section>

            <section>
              <SectionTitle>Holdings</SectionTitle>
              <div className="flex flex-col mt-4">
                <div className="grid grid-cols-6 gap-4 pb-2.5 text-[11px] font-medium uppercase tracking-wider" style={{ color: P.gray, borderBottom: `1px solid ${P.border}` }}>
                  <span className="col-span-2">Stock</span><span className="text-right">Price</span><span className="text-right">24h</span><span className="text-right">7d</span><span className="text-right">Value</span>
                </div>
                {STOCKS.map((s) => {
                  const val = (s.price * s.allocation * 10).toFixed(2);
                  const isUp = s.change >= 0;
                  return (
                    <div key={s.symbol} className="grid grid-cols-6 gap-4 py-3.5 items-center" style={{ borderBottom: `1px solid ${P.border}60` }}>
                      <div className="col-span-2 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[11px] font-bold" style={{ background: `${s.color}25`, color: P.text }}>
                          {s.symbol.slice(0, 2)}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium">{s.name}</div>
                          <div className="text-[11px]" style={{ color: P.gray }}>{s.symbol}</div>
                        </div>
                      </div>
                      <div className="text-right text-[13px] font-medium">${s.price.toFixed(2)}</div>
                      <div className="text-right text-[13px] font-semibold" style={{ color: isUp ? P.green : P.red }}>
                        {isUp ? "+" : ""}{s.change.toFixed(2)}%
                      </div>
                      <div className="flex justify-end"><MiniChart color={s.color} trend={isUp ? "up" : "down"} /></div>
                      <div className="text-right text-[13px] font-semibold">${val}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-10">
            <section>
              <SectionTitle>AI Recommendations</SectionTitle>
              <div className="flex flex-col gap-3 mt-4">
                {AI_ALERTS.map((a, i) => (
                  <div key={i} className="flex gap-3 py-3" style={{ borderBottom: `1px solid ${P.border}60` }}>
                    <div className="mt-1 shrink-0">
                      <div className="w-2 h-2 rounded-full" style={{ background: a.type === "warning" ? P.jadeDark : a.type === "success" ? P.green : P.darkGray }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12.5px] leading-[1.6]" style={{ color: P.grayLight }}>{a.text}</p>
                      <span className="text-[11px] mt-1 block" style={{ color: P.gray }}>{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2.5 rounded-lg text-[13px] font-semibold transition hover:opacity-90" style={{ background: P.jadeDark, color: "#FFFFFF" }}>
                View All
              </button>
            </section>

            <section>
              <SectionTitle>Proof of Solvency</SectionTitle>
              <div className="flex flex-col items-center text-center gap-4 mt-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${P.jade}40` }}>
                  <ShieldIcon />
                </div>
                <p className="text-[12px] leading-[1.6]" style={{ color: P.gray }}>
                  Prove your portfolio exceeds a threshold — without revealing your holdings.
                </p>
                <div className="w-full flex items-center gap-2 py-3" style={{ borderTop: `1px solid ${P.border}`, borderBottom: `1px solid ${P.border}` }}>
                  <span className="text-base font-semibold" style={{ color: P.gray }}>$</span>
                  <input type="text" defaultValue="50,000" className="flex-1 bg-transparent text-base font-semibold outline-none" style={{ color: P.text }} readOnly />
                  <span className="text-[11px] font-medium" style={{ color: P.gray }}>USD</span>
                </div>
                <button className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition hover:opacity-90" style={{ background: P.dark, color: "#FFFFFF" }}>
                  Generate Proof
                </button>
                <div className="flex items-center gap-1.5">
                  <LockIcon />
                  <span className="text-[11px]" style={{ color: P.gray }}>Zero-knowledge — data stays on your device</span>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle>Quick Actions</SectionTitle>
              <div className="flex gap-3 mt-4">
                <ActionBtn label="Invest" color={P.jadeDark} />
                <ActionBtn label="Withdraw" color={"#CC5A3A"} />
                <ActionBtn label="Rebalance" color={"#4B0082"} />
                <ActionBtn label="History" color={P.darkGray} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Components ---- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-semibold uppercase tracking-wider" style={{ fontFamily: "Lexend", color: P.darkGray }}>{children}</h3>;
}

function Stat({ label, value, sub, subColor, accent }: { label: string; value: string; sub: string; subColor: string; accent: string }) {
  return (
    <div>
      <div className="w-8 h-1 rounded-full mb-3" style={{ background: accent }} />
      <div className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: P.gray, fontFamily: "Lexend" }}>{label}</div>
      <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: "Sora" }}>{value}</div>
      <div className="text-[12px] font-medium" style={{ color: subColor }}>{sub}</div>
    </div>
  );
}

function NavLink({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className="text-[13px] font-medium cursor-pointer" style={{
      color: active ? P.text : P.gray,
      borderBottom: active ? `2px solid ${P.jadeDark}` : "2px solid transparent",
      paddingBottom: 4,
    }}>
      {children}
    </span>
  );
}

function ActionBtn({ label, color }: { label: string; color: string }) {
  return (
    <button className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold transition hover:opacity-80" style={{ background: color, color: P.text }}>
      {label}
    </button>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P.jadeDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={P.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
