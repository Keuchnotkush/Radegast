"use client";

import { useEffect, useRef, useCallback } from "react";

const COLS = ["#38A88A", "#4B0082", "#CC5A3A", "#C8A415", "#B5506A", "#2E8B57"];

export default function Topography() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const draw = useCallback((t: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const cx = cv.getContext("2d");
    if (!cx) return;
    const W = cv.width;
    const H = cv.height;

    cx.clearRect(0, 0, W, H);

    for (let l = 0; l < 8; l++) {
      cx.beginPath();
      const off = t * 0.0003 * (l % 2 === 0 ? 1 : -1);
      const yBase = H * 0.12 + l * H * 0.08;
      for (let x = 0; x <= W; x += 3) {
        const n =
          Math.sin(x * 0.004 + off + l * 0.7) * 50 +
          Math.sin(x * 0.009 + off * 1.3 + l * 1.2) * 25 +
          Math.sin(x * 0.002 + off * 0.5 + l * 0.3) * 70;
        if (x === 0) cx.moveTo(x, yBase + n);
        else cx.lineTo(x, yBase + n);
      }
      cx.strokeStyle = COLS[l % COLS.length];
      cx.globalAlpha = 0.18 + l * 0.025;
      cx.lineWidth = 1.5;
      cx.stroke();
      cx.globalAlpha = 1;
    }

    for (let l = 0; l < 6; l++) {
      const off = t * 0.0002 * (l % 2 === 0 ? -1 : 1) + 3;
      const yBase = H * 0.38 + l * H * 0.09;
      cx.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const n =
          Math.sin(x * 0.003 + off + l * 1.1) * 60 +
          Math.sin(x * 0.007 + off * 1.5 + l * 0.8) * 30 +
          Math.cos(x * 0.0015 + off * 0.3 + l * 2) * 80;
        if (x === 0) cx.moveTo(x, yBase + n);
        else cx.lineTo(x, yBase + n);
      }
      cx.strokeStyle = COLS[(l + 3) % COLS.length];
      cx.globalAlpha = 0.14 + l * 0.02;
      cx.lineWidth = 1.2;
      cx.stroke();
      cx.globalAlpha = 1;
    }

    for (let l = 0; l < 5; l++) {
      const off = t * 0.00015 * (l % 2 === 0 ? 1 : -1) + 7;
      const yBase = H * 0.7 + l * H * 0.06;
      cx.beginPath();
      for (let x = 0; x <= W; x += 3) {
        const n =
          Math.sin(x * 0.002 + off + l * 0.9) * 80 +
          Math.sin(x * 0.005 + off * 0.8 + l * 1.5) * 35 +
          Math.cos(x * 0.001 + off * 0.2 + l * 0.5) * 60;
        if (x === 0) cx.moveTo(x, yBase + n);
        else cx.lineTo(x, yBase + n);
      }
      cx.strokeStyle = COLS[(l + 1) % COLS.length];
      cx.globalAlpha = 0.12 + l * 0.015;
      cx.lineWidth = 1;
      cx.stroke();
      cx.globalAlpha = 1;
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const resize = () => {
      cv.width = window.innerWidth * 2;
      cv.height = window.innerHeight * 2;
    };
    resize();
    window.addEventListener("resize", resize);
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
