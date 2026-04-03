"use client";

import { useState } from "react";
import {
  PhantomCursor,
  SpiraleCursor,
  RuneOrbitCursor,
  VineTrailCursor,
  ShieldPulseCursor,
  GoldenDustCursor,
  ConstellationCursor,
  MagneticRingCursor,
  SnakeCursor,
  MinimalDotCursor,
} from "./cursor-components";

const CURSORS = [
  { name: "Phantom", desc: "Ghost trail with delayed followers", component: PhantomCursor },
  { name: "Spirale", desc: "Rotating spirals — inspired by the R swirl", component: SpiraleCursor },
  { name: "Rune Orbit", desc: "Elder Futhark runes orbiting the cursor", component: RuneOrbitCursor },
  { name: "Vine Trail", desc: "Organic vine with leaves — logo volutes", component: VineTrailCursor },
  { name: "Shield Pulse", desc: "ZK shield pulsing — proof of solvency", component: ShieldPulseCursor },
  { name: "Golden Dust", desc: "Jade + gold particles — wealth theme", component: GoldenDustCursor },
  { name: "Constellation", desc: "Stars that connect into constellations", component: ConstellationCursor },
  { name: "Magnetic Ring", desc: "Dot + delayed ring with inertia", component: MagneticRingCursor },
  { name: "Snake", desc: "20 dots chasing in a fluid chain", component: SnakeCursor },
  { name: "Minimal Dot", desc: "Single dot, blend mode difference", component: MinimalDotCursor },
];

export default function CursorPicker() {
  const [active, setActive] = useState(0);
  const ActiveCursor = CURSORS[active].component;

  return (
    <div className="min-h-screen" style={{ background: "#D8D2C8", fontFamily: "Sora, sans-serif", cursor: "none" }}>
      <ActiveCursor />

      <div className="max-w-4xl mx-auto px-8 py-16">
        <div className="flex items-center gap-4 mb-2">
          <img src="/logo.svg" alt="Radegast" style={{ height: 28 }} />
        </div>
        <p className="text-sm mb-10" style={{ color: "#6B6B6B" }}>Move your mouse around. Click to select a cursor.</p>

        <div className="grid grid-cols-2 gap-4">
          {CURSORS.map((c, i) => (
            <button
              key={c.name}
              onClick={() => setActive(i)}
              className="flex items-center gap-4 p-4 rounded-xl text-left transition"
              style={{
                background: active === i ? "#38A88A" : "transparent",
                color: active === i ? "#FFFFFF" : "#2A2A2A",
                border: `1.5px solid ${active === i ? "#38A88A" : "#C4C4C4"}`,
                cursor: "none",
              }}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0" style={{
                background: active === i ? "#FFFFFF20" : "#38A88A15",
                color: active === i ? "#FFFFFF" : "#38A88A",
              }}>
                {i + 1}
              </div>
              <div>
                <div className="text-[14px] font-semibold">{c.name}</div>
                <div className="text-[12px] opacity-70">{c.desc}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-16 p-16 rounded-2xl text-center" style={{ border: "1.5px dashed #C4C4C4" }}>
          <p className="text-lg font-semibold mb-2" style={{ color: "#2A2A2A" }}>Test area</p>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>
            Currently: <span style={{ color: "#38A88A", fontWeight: 600 }}>{CURSORS[active].name}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
