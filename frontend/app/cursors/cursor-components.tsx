"use client";

import { useEffect, useRef, useCallback } from "react";

const JADE = "#38A88A";

// ─── 1. PHANTOM (current) ───
export function PhantomCursor() {
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const positions = useRef(Array.from({ length: 9 }, () => ({ x: -100, y: -100 })));
  const mouse = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const animate = () => {
      positions.current[0] = { ...mouse.current };
      for (let i = 1; i < 9; i++) {
        const p = positions.current[i - 1], c = positions.current[i];
        const s = 0.15 * (1 - i * 0.08);
        c.x += (p.x - c.x) * s;
        c.y += (p.y - c.y) * s;
      }
      dotsRef.current.forEach((d, i) => { if (d) d.style.transform = `translate(${positions.current[i].x}px, ${positions.current[i].y}px)`; });
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {Array.from({ length: 8 }, (_, i) => {
        const idx = 8 - i; const o = 0.3 - idx * 0.03; const sz = 18 - idx * 1.2;
        return <div key={i} ref={el => { if (el) dotsRef.current[idx] = el; }} className="absolute top-0 left-0 rounded-full" style={{ width: sz, height: sz, marginLeft: -sz / 2, marginTop: -sz / 2, background: `rgba(56,168,138,${o})`, willChange: "transform" }} />;
      })}
      <div ref={el => { if (el) dotsRef.current[0] = el; }} className="absolute top-0 left-0" style={{ willChange: "transform" }}>
        <div className="absolute rounded-full" style={{ width: 8, height: 8, marginLeft: -4, marginTop: -4, background: JADE }} />
        <div className="absolute rounded-full" style={{ width: 32, height: 32, marginLeft: -16, marginTop: -16, border: `1.5px solid ${JADE}50` }} />
      </div>
    </div>
  );
}

// ─── 2. SPOTLIGHT ───
export function SpotlightCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={ref} className="absolute top-0 left-0" style={{ willChange: "transform" }}>
        <div className="absolute rounded-full" style={{ width: 200, height: 200, marginLeft: -100, marginTop: -100, background: `radial-gradient(circle, ${JADE}18 0%, transparent 70%)` }} />
        <div className="absolute rounded-full" style={{ width: 6, height: 6, marginLeft: -3, marginTop: -3, background: JADE }} />
      </div>
    </div>
  );
}

// ─── 3. MAGNETIC RING ───
export function MagneticRingCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.08;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.08;
      if (dotRef.current) dotRef.current.style.transform = `translate(${mouse.current.x}px, ${mouse.current.y}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.current.x}px, ${ring.current.y}px)`;
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={ringRef} className="absolute top-0 left-0 rounded-full" style={{ width: 44, height: 44, marginLeft: -22, marginTop: -22, border: `2px solid ${JADE}60`, willChange: "transform", transition: "width 0.2s, height 0.2s" }} />
      <div ref={dotRef} className="absolute top-0 left-0 rounded-full" style={{ width: 6, height: 6, marginLeft: -3, marginTop: -3, background: JADE, willChange: "transform" }} />
    </div>
  );
}

// ─── 4. COMET TAIL ───
export function CometCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const points = useRef<{ x: number; y: number; life: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      points.current.push({ x: e.clientX, y: e.clientY, life: 1 });
      if (points.current.length > 80) points.current.shift();
    };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 1; i < points.current.length; i++) {
        const p = points.current[i]; const prev = points.current[i - 1];
        p.life *= 0.95;
        ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = `rgba(56,168,138,${p.life * 0.6})`; ctx.lineWidth = p.life * 4; ctx.lineCap = "round"; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(mouse.current.x, mouse.current.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = JADE; ctx.fill();
      points.current = points.current.filter(p => p.life > 0.01);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ─── 5. CROSSHAIR ───
export function CrosshairCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={ref} className="absolute top-0 left-0" style={{ willChange: "transform" }}>
        <div className="absolute" style={{ width: 1, height: 24, marginLeft: -0.5, marginTop: -12, background: `${JADE}80` }} />
        <div className="absolute" style={{ width: 24, height: 1, marginLeft: -12, marginTop: -0.5, background: `${JADE}80` }} />
        <div className="absolute rounded-full" style={{ width: 4, height: 4, marginLeft: -2, marginTop: -2, background: JADE }} />
      </div>
    </div>
  );
}

// ─── 6. BUBBLES ───
export function BubblesCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubbles = useRef<{ x: number; y: number; r: number; life: number; vx: number; vy: number }[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  const frame = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frame.current++;
      if (frame.current % 3 === 0) {
        bubbles.current.push({ x: mouse.current.x, y: mouse.current.y, r: Math.random() * 8 + 3, life: 1, vx: (Math.random() - 0.5) * 2, vy: -Math.random() * 2 - 0.5 });
      }
      for (const b of bubbles.current) {
        b.x += b.vx; b.y += b.vy; b.life *= 0.97;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * b.life, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56,168,138,${b.life * 0.5})`; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(mouse.current.x, mouse.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = JADE; ctx.fill();
      bubbles.current = bubbles.current.filter(b => b.life > 0.02);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ─── 7. GLOW PULSE ───
export function GlowPulseCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={ref} className="absolute top-0 left-0" style={{ willChange: "transform" }}>
        <div className="absolute rounded-full animate-ping" style={{ width: 40, height: 40, marginLeft: -20, marginTop: -20, background: `${JADE}15` }} />
        <div className="absolute rounded-full" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, background: `${JADE}20`, border: `1px solid ${JADE}40` }} />
        <div className="absolute rounded-full" style={{ width: 6, height: 6, marginLeft: -3, marginTop: -3, background: JADE }} />
      </div>
    </div>
  );
}

// ─── 8. SNAKE ───
export function SnakeCursor() {
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const positions = useRef(Array.from({ length: 20 }, () => ({ x: -100, y: -100 })));
  const mouse = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const animate = () => {
      positions.current[0] = { ...mouse.current };
      for (let i = 1; i < 20; i++) {
        const p = positions.current[i - 1], c = positions.current[i];
        c.x += (p.x - c.x) * 0.3;
        c.y += (p.y - c.y) * 0.3;
      }
      dotsRef.current.forEach((d, i) => { if (d) d.style.transform = `translate(${positions.current[i].x}px, ${positions.current[i].y}px)`; });
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {Array.from({ length: 20 }, (_, i) => {
        const sz = 6 - i * 0.25; const o = 0.6 - i * 0.028;
        return <div key={i} ref={el => { if (el) dotsRef.current[i] = el; }} className="absolute top-0 left-0 rounded-full" style={{ width: Math.max(sz, 1.5), height: Math.max(sz, 1.5), marginLeft: -Math.max(sz, 1.5) / 2, marginTop: -Math.max(sz, 1.5) / 2, background: `rgba(56,168,138,${Math.max(o, 0.05)})`, willChange: "transform" }} />;
      })}
    </div>
  );
}

// ─── 9. STAR DUST ───
export function StarDustCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<{ x: number; y: number; life: number; angle: number; speed: number; size: number }[]>([]);
  const mouse = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      for (let j = 0; j < 2; j++) {
        const angle = Math.random() * Math.PI * 2;
        particles.current.push({ x: e.clientX, y: e.clientY, life: 1, angle, speed: Math.random() * 1.5 + 0.5, size: Math.random() * 3 + 1 });
      }
    };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles.current) {
        p.x += Math.cos(p.angle) * p.speed; p.y += Math.sin(p.angle) * p.speed; p.life *= 0.96; p.speed *= 0.98;
        ctx.beginPath();
        const s = p.size * p.life;
        ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x + s * 0.5, p.y); ctx.lineTo(p.x, p.y + s); ctx.lineTo(p.x - s * 0.5, p.y); ctx.closePath();
        ctx.fillStyle = `rgba(56,168,138,${p.life * 0.7})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(mouse.current.x, mouse.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = JADE; ctx.fill();
      particles.current = particles.current.filter(p => p.life > 0.02);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ─── 10. MINIMAL DOT ───
export function MinimalDotCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={ref} className="absolute top-0 left-0 rounded-full" style={{ width: 10, height: 10, marginLeft: -5, marginTop: -5, background: JADE, willChange: "transform", mixBlendMode: "difference" }} />
    </div>
  );
}
