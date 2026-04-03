"use client";

import { useEffect, useRef } from "react";

export default function MinimalDotCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={ref}
        className="absolute top-0 left-0 rounded-full"
        style={{
          width: 10,
          height: 10,
          marginLeft: -5,
          marginTop: -5,
          background: "#38A88A",
          willChange: "transform",
          mixBlendMode: "difference",
        }}
      />
    </div>
  );
}
