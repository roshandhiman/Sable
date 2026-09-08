'use client';
import React, { useEffect, useRef, useState } from 'react';
import PromptBox from '../PromptBox';
import ThemeToggle from '../ThemeToggle';
interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseX: number;
  baseY: number;
  radius: number;
  label: string;
  pulse: number;
}
export default function ConstellationGrid() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userOverride, setUserOverride] = useState(false);
  // System theme detect karne ke liye (agar user ne manually switch nahi kiya ho)
  useEffect(() => {
    if (userOverride) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [userOverride]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    let animId: number;
    let width = 0;
    let height = 0;
    const mouse = { x: -1000, y: -1000, prevX: -1000, prevY: -1000, vx: 0, vy: 0, radius: 220 };
    let nodes: Node[] = [];
    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      // ctx.scale(dpr, dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
    };

    const handleMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const handleMouseLeave = () => { mouse.x = -1000; mouse.y = -1000; };

    const initNodes = () => {
      nodes = [];
      const spacing = 55;
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing;
          const y = j * spacing;
          nodes.push({
            x, y, vx: 0, vy: 0, baseX: x, baseY: y,
            radius: Math.random() * 1.2 + 1.2,
            label: `${(i * 7).toString(16).toUpperCase()}:${(j * 11).toString(16).toUpperCase()}`,
            pulse: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      mouse.vx = (mouse.x - mouse.prevX) / (dt * 1000 || 1);
      mouse.vy = (mouse.y - mouse.prevY) / (dt * 1000 || 1);
      mouse.prevX = mouse.x;
      mouse.prevY = mouse.y;
      const speed = Math.sqrt(mouse.vx ** 2 + mouse.vy ** 2);

      const bgColor = isDarkMode ? '#030407' : '#ffffffff';
      const nodeColor = isDarkMode ? '255, 255, 255' : '15, 23, 42';
      const accentColor = isDarkMode ? '220, 220, 220' : '71, 71, 71';

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      const SPRING = 18;
      const DAMP = 0.82;

      for (const n of nodes) {
        n.pulse += dt * 3;
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < mouse.radius && dist > 0) {
          const power = 1 - dist / mouse.radius;
          const force = power * (1500 + speed * 150);
          const angle = Math.atan2(dy, dx);
          n.vx -= Math.cos(angle) * force * dt;
          n.vy -= Math.sin(angle) * force * dt;
        }

        n.vx += (n.baseX - n.x) * SPRING * dt;
        n.vy += (n.baseY - n.y) * SPRING * dt;
        n.vx *= DAMP;
        n.vy *= DAMP;
        n.x += n.vx * dt * 60;
        n.y += n.vy * dt * 60;
      }

      const MAX_DIST = 75;
      const MAX_SQ = MAX_DIST * MAX_DIST;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const sq = dx * dx + dy * dy;
          if (sq < MAX_SQ) {
            const d = Math.sqrt(sq);
            ctx.strokeStyle = `rgba(${nodeColor}, ${(1 - d / MAX_DIST) * (isDarkMode ? 0.18 : 0.08)})`;
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const near = dist < mouse.radius;
        const alpha = near ? 0.95 : 0.25 + Math.sin(n.pulse) * 0.1;
        ctx.fillStyle = `rgba(${near ? accentColor : nodeColor}, ${alpha})`;
        const r = near ? n.radius * 2.2 : n.radius + Math.sin(n.pulse) * 0.3;
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fill();
        if (dist < 90) {
          const ring = ((n.pulse * 20) % 30) + 4;
          ctx.strokeStyle = `rgba(${accentColor}, ${(1 - ring / 34) * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, ring, 0, Math.PI * 2);
          ctx.stroke();

          ctx.font = '8px ui-monospace, SFMono-Regular, Consolas, monospace';
          ctx.fillStyle = `rgba(${accentColor}, 0.85)`;
          ctx.fillText(n.label, n.x + 10, n.y - 10);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isDarkMode]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-slate-950">
      <canvas ref={canvasRef} className="absolute inset-0 block cursor-crosshair" />

      {/* light ur Dark mode switch karne ke liye */}
      <ThemeToggle
        isDarkMode={isDarkMode}
        onToggle={() => {
          setUserOverride(true);
          setIsDarkMode((prev) => !prev);
        }}
      />


      {/* <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-4 text-white"> */}
      <div className={`relative z-10 flex h-full flex-col items-center justify-center text-center px-4 ${isDarkMode ? 'text-white' : 'text-slate-950'}`}>
        <div className="pointer-events-none mix-blend-difference">
          <h1 className="font-mono text-7xl sm:text-9xl md:text-[15vw] font-black tracking-tighter uppercase leading-none">
            SABLE
          </h1>

          <p className="mt-6 font-mono text-sm md:text-base max-w-xl opacity-75 tracking-wider mx-auto">
            Type it. Sable builds it. Live in seconds.
          </p>
        </div>
        <br></br>
        <br></br>
        <br></br>


        <div className="mt-14 w-full" style={{ maxWidth: '900px' }}>
          <PromptBox isDarkMode={isDarkMode} />
        </div>
      </div>
    </div >
  );
}
