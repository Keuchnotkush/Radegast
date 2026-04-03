import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen gap-6" style={{ background: "#D8D2C8", fontFamily: "Sora, sans-serif" }}>
      <img src="/logo.svg" alt="Radegast" style={{ height: 36 }} />
      <p className="text-sm" style={{ color: "#6B6B6B" }}>Design & Prototype</p>
      <div className="flex flex-col gap-3 w-full max-w-sm px-6">
        <Link
          href="/mockup-15"
          className="px-6 py-3 rounded-lg text-sm font-semibold text-center transition hover:opacity-90"
          style={{ background: "#2A2A2A", color: "#D8D2C8" }}
        >
          Dashboard — Mockup 15
        </Link>
        <Link
          href="/landing"
          className="px-6 py-3 rounded-lg text-sm font-semibold text-center transition hover:opacity-90"
          style={{ background: "#38A88A", color: "#FFFFFF" }}
        >
          Landing Page (Motion Design)
        </Link>
      </div>
    </div>
  );
}
