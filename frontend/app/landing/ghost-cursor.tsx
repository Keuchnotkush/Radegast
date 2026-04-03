"use client";

import { useEffect, useRef } from "react";

const GHOSTS = 8;
const LERP = 0.15;

export default function GhostCursor() {
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const positions = useRef(Array.from({ length: GHOSTS + 1 }, () => ({ x: -100, y: -100 })));
  const mouse = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove);

    let raf: number;
    const animate = () => {
      positions.current[0] = { ...mouse.current };

      for (let i = 1; i <= GHOSTS; i++) {
        const prev = positions.current[i - 1];
        const curr = positions.current[i];
        const speed = LERP * (1 - i * 0.08);
        curr.x += (prev.x - curr.x) * speed;
        curr.y += (prev.y - curr.y) * speed;
      }

      dotsRef.current.forEach((dot, i) => {
        if (!dot) return;
        const pos = positions.current[i];
        dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
      });

      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Ghost trails */}
      {Array.from({ length: GHOSTS }, (_, i) => {
        const idx = GHOSTS - i;
        const opacity = 0.3 - idx * 0.03;
        const size = 18 - idx * 1.2;
        return (
          <div
            key={`ghost-${i}`}
            ref={(el) => { if (el) dotsRef.current[idx] = el; }}
            className="absolute top-0 left-0 rounded-full"
            style={{
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              background: `rgba(56, 168, 138, ${opacity})`,
              willChange: "transform",
            }}
          />
        );
      })}

      {/* Main cursor */}
      <div
        ref={(el) => { if (el) dotsRef.current[0] = el; }}
        className="absolute top-0 left-0"
        style={{ willChange: "transform" }}
      >
        {/* Inner dot */}
        <div
          className="absolute rounded-full"
          style={{
            width: 8,
            height: 8,
            marginLeft: -4,
            marginTop: -4,
            background: "#38A88A",
          }}
        />
        {/* Outer ring */}
        <div
          className="absolute rounded-full"
          style={{
            width: 32,
            height: 32,
            marginLeft: -16,
            marginTop: -16,
            border: "1.5px solid rgba(56, 168, 138, 0.35)",
          }}
        />
      </div>
    </div>
  );
}
