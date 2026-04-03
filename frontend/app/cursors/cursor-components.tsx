"use client";

import { useEffect, useRef } from "react";

const JADE = "#38A88A";
const JADE_RGB = "56,168,138";

// ─── 1. PHANTOM ───
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
      for (let i = 1; i < 9; i++) { const p = positions.current[i - 1], c = positions.current[i], s = 0.15 * (1 - i * 0.08); c.x += (p.x - c.x) * s; c.y += (p.y - c.y) * s; }
      dotsRef.current.forEach((d, i) => { if (d) d.style.transform = `translate(${positions.current[i].x}px, ${positions.current[i].y}px)`; });
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {Array.from({ length: 8 }, (_, i) => { const idx = 8 - i, o = 0.3 - idx * 0.03, sz = 18 - idx * 1.2;
        return <div key={i} ref={el => { if (el) dotsRef.current[idx] = el; }} className="absolute top-0 left-0 rounded-full" style={{ width: sz, height: sz, marginLeft: -sz / 2, marginTop: -sz / 2, background: `rgba(${JADE_RGB},${o})`, willChange: "transform" }} />;
      })}
      <div ref={el => { if (el) dotsRef.current[0] = el; }} className="absolute top-0 left-0" style={{ willChange: "transform" }}>
        <div className="absolute rounded-full" style={{ width: 8, height: 8, marginLeft: -4, marginTop: -4, background: JADE }} />
        <div className="absolute rounded-full" style={{ width: 32, height: 32, marginLeft: -16, marginTop: -16, border: `1.5px solid rgba(${JADE_RGB},0.35)` }} />
      </div>
    </div>
  );
}

// ─── 2. SPIRALE (inspired by Radegast R swirl) ───
export function SpiraleCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const angle = useRef(0);
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
      angle.current += 0.04;
      const { x, y } = mouse.current;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const turns = 2.5;
        for (let t = 0; t < turns * Math.PI * 2; t += 0.05) {
          const r = t * 3.5;
          const a = t + angle.current + (i * Math.PI * 2) / 3;
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r;
          if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        const alpha = 0.25 - i * 0.06;
        ctx.strokeStyle = `rgba(${JADE_RGB},${alpha})`;
        ctx.lineWidth = 1.5 - i * 0.3;
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = JADE; ctx.fill();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ─── 3. RUNE ORBIT (ancient symbols orbiting) ───
export function RuneOrbitCursor() {
  const ref = useRef<HTMLDivElement>(null);
  const angle = useRef(0);
  const mouse = useRef({ x: -100, y: -100 });
  const runes = ["ᚱ", "ᚨ", "ᛞ", "ᛖ", "ᚷ"];
  useEffect(() => {
    const onMove = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const animate = () => {
      angle.current += 0.015;
      if (ref.current) ref.current.style.transform = `translate(${mouse.current.x}px, ${mouse.current.y}px)`;
      const children = ref.current?.children;
      if (children) {
        for (let i = 1; i < children.length; i++) {
          const a = angle.current + ((i - 1) * Math.PI * 2) / 5;
          const r = 28;
          const el = children[i] as HTMLElement;
          el.style.transform = `translate(${Math.cos(a) * r}px, ${Math.sin(a) * r}px)`;
          el.style.opacity = `${0.4 + Math.sin(angle.current * 2 + i) * 0.2}`;
        }
      }
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={ref} className="absolute top-0 left-0" style={{ willChange: "transform" }}>
        <div className="absolute rounded-full" style={{ width: 6, height: 6, marginLeft: -3, marginTop: -3, background: JADE }} />
        {runes.map((r, i) => (
          <div key={i} className="absolute text-[10px] font-bold" style={{ marginLeft: -5, marginTop: -6, color: JADE, willChange: "transform" }}>{r}</div>
        ))}
      </div>
    </div>
  );
}

// ─── 4. VINE TRAIL (organic swirl like the logo) ───
export function VineTrailCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<{ x: number; y: number; life: number }[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      points.current.push({ x: e.clientX, y: e.clientY, life: 1 });
      if (points.current.length > 60) points.current.shift();
    };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const pts = points.current;
      if (pts.length > 2) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          pts[i].life *= 0.97;
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          const wave = Math.sin(i * 0.3) * 8 * pts[i].life;
          ctx.quadraticCurveTo(pts[i].x + wave, pts[i].y + wave, xc, yc);
        }
        ctx.strokeStyle = `rgba(${JADE_RGB},0.35)`;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.stroke();
        // Small leaves
        for (let i = 0; i < pts.length; i += 6) {
          if (pts[i].life < 0.3) continue;
          const wave = Math.sin(i * 0.5) * 5;
          ctx.beginPath();
          ctx.ellipse(pts[i].x + wave, pts[i].y - wave, 3 * pts[i].life, 6 * pts[i].life, Math.PI / 4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${JADE_RGB},${pts[i].life * 0.25})`;
          ctx.fill();
        }
      }
      ctx.beginPath(); ctx.arc(mouse.current.x, mouse.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = JADE; ctx.fill();
      points.current = pts.filter(p => p.life > 0.02);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ─── 5. SHIELD PULSE (proof of solvency theme) ───
export function ShieldPulseCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (ref.current) ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div ref={ref} className="absolute top-0 left-0" style={{ willChange: "transform" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginLeft: -14, marginTop: -14 }} className="animate-pulse">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={JADE} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill={`${JADE}10`} />
        </svg>
        <div className="absolute rounded-full" style={{ width: 4, height: 4, marginLeft: -2, marginTop: -16, background: JADE }} />
      </div>
    </div>
  );
}

// ─── 6. GOLDEN DUST (wealth/finance) ───
export function GoldenDustCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<{ x: number; y: number; life: number; angle: number; speed: number; size: number; hue: number }[]>([]);
  const mouse = useRef({ x: -100, y: -100 });
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      for (let j = 0; j < 2; j++) {
        particles.current.push({ x: e.clientX, y: e.clientY, life: 1, angle: Math.random() * Math.PI * 2, speed: Math.random() * 1.5 + 0.3, size: Math.random() * 2.5 + 0.5, hue: Math.random() > 0.5 ? 160 : 45 });
      }
    };
    window.addEventListener("mousemove", onMove);
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles.current) {
        p.x += Math.cos(p.angle) * p.speed; p.y += Math.sin(p.angle) * p.speed - 0.3; p.life *= 0.96; p.speed *= 0.98;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        const color = p.hue === 160 ? `rgba(${JADE_RGB},${p.life * 0.6})` : `rgba(200,164,21,${p.life * 0.5})`;
        ctx.fillStyle = color; ctx.fill();
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

// ─── 7. CONSTELLATION ───
export function ConstellationCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stars = useRef<{ x: number; y: number; life: number }[]>([]);
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
      if (frame.current % 4 === 0) {
        stars.current.push({ x: mouse.current.x + (Math.random() - 0.5) * 30, y: mouse.current.y + (Math.random() - 0.5) * 30, life: 1 });
      }
      // Draw lines between close stars
      for (let i = 0; i < stars.current.length; i++) {
        stars.current[i].life *= 0.985;
        for (let j = i + 1; j < stars.current.length; j++) {
          const dx = stars.current[i].x - stars.current[j].x;
          const dy = stars.current[i].y - stars.current[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx.beginPath(); ctx.moveTo(stars.current[i].x, stars.current[i].y); ctx.lineTo(stars.current[j].x, stars.current[j].y);
            const a = Math.min(stars.current[i].life, stars.current[j].life) * 0.2;
            ctx.strokeStyle = `rgba(${JADE_RGB},${a})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
        ctx.beginPath(); ctx.arc(stars.current[i].x, stars.current[i].y, 2 * stars.current[i].life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${JADE_RGB},${stars.current[i].life * 0.5})`; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(mouse.current.x, mouse.current.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = JADE; ctx.fill();
      stars.current = stars.current.filter(s => s.life > 0.03);
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-50 pointer-events-none" />;
}

// ─── 8. MAGNETIC RING ───
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
      <div ref={ringRef} className="absolute top-0 left-0 rounded-full" style={{ width: 44, height: 44, marginLeft: -22, marginTop: -22, border: `2px solid rgba(${JADE_RGB},0.4)`, willChange: "transform" }} />
      <div ref={dotRef} className="absolute top-0 left-0 rounded-full" style={{ width: 6, height: 6, marginLeft: -3, marginTop: -3, background: JADE, willChange: "transform" }} />
    </div>
  );
}

// ─── 9. SNAKE ───
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
      for (let i = 1; i < 20; i++) { const p = positions.current[i - 1], c = positions.current[i]; c.x += (p.x - c.x) * 0.3; c.y += (p.y - c.y) * 0.3; }
      dotsRef.current.forEach((d, i) => { if (d) d.style.transform = `translate(${positions.current[i].x}px, ${positions.current[i].y}px)`; });
      raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {Array.from({ length: 20 }, (_, i) => { const sz = 6 - i * 0.25, o = 0.6 - i * 0.028;
        return <div key={i} ref={el => { if (el) dotsRef.current[i] = el; }} className="absolute top-0 left-0 rounded-full" style={{ width: Math.max(sz, 1.5), height: Math.max(sz, 1.5), marginLeft: -Math.max(sz, 1.5) / 2, marginTop: -Math.max(sz, 1.5) / 2, background: `rgba(${JADE_RGB},${Math.max(o, 0.05)})`, willChange: "transform" }} />;
      })}
    </div>
  );
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
