"use client";

import { useState } from "react";
import {
  PhantomCursor,
  SpotlightCursor,
  MagneticRingCursor,
  CometCursor,
  CrosshairCursor,
  BubblesCursor,
  GlowPulseCursor,
  SnakeCursor,
  StarDustCursor,
  MinimalDotCursor,
} from "./cursor-components";

const CURSORS = [
  { name: "Phantom", desc: "Ghost trail with delayed followers", component: PhantomCursor },
  { name: "Spotlight", desc: "Soft glow that follows the mouse", component: SpotlightCursor },
  { name: "Magnetic Ring", desc: "Dot + ring that follows with delay", component: MagneticRingCursor },
  { name: "Comet", desc: "Fading line trail behind the cursor", component: CometCursor },
  { name: "Crosshair", desc: "Minimal cross + dot", component: CrosshairCursor },
  { name: "Bubbles", desc: "Rising bubbles from cursor", component: BubblesCursor },
  { name: "Glow Pulse", desc: "Pulsing ring around cursor", component: GlowPulseCursor },
  { name: "Snake", desc: "20 dots following in a chain", component: SnakeCursor },
  { name: "Star Dust", desc: "Diamond particles scatter", component: StarDustCursor },
  { name: "Minimal Dot", desc: "Single dot, blend mode difference", component: MinimalDotCursor },
];

export default function CursorPicker() {
  const [active, setActive] = useState(0);
  const ActiveCursor = CURSORS[active].component;

  return (
    <div className="min-h-screen" style={{ background: "#D8D2C8", fontFamily: "Sora, sans-serif", cursor: "none" }}>
      <ActiveCursor />

      <div className="max-w-4xl mx-auto px-8 py-16">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#2A2A2A" }}>Cursor Picker</h1>
        <p className="text-sm mb-10" style={{ color: "#6B6B6B" }}>Move your mouse around. Click to select.</p>

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

        <div className="mt-16 p-10 rounded-2xl text-center" style={{ border: "1.5px dashed #C4C4C4" }}>
          <p className="text-lg font-semibold mb-2" style={{ color: "#2A2A2A" }}>Test area</p>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>Move your mouse freely here to see the <span style={{ color: "#38A88A", fontWeight: 600 }}>{CURSORS[active].name}</span> cursor in action.</p>
        </div>
      </div>
    </div>
  );
}
