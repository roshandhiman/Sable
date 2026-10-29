'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PromptBox from '../PromptBox';
import ThemeToggle from '../ThemeToggle';
import AuthModal from '../AuthModal';
import { displayName, getSessionUser, supabase } from '../../lib/supabase';
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
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [userOverride, setUserOverride] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authUser, setAuthUser] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    getSessionUser().then((user) => setAuthUser(user ? displayName(user) : null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ? displayName(session.user) : null);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    setAuthUser(null);
  };
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent =
      '@keyframes theme-ripple-expand { from { transform: scale(0); } to { transform: scale(1); } } @keyframes theme-ripple-fade { from { opacity: 1; } to { opacity: 0; } }';
    document.head.appendChild(style);
    return () => style.remove();
  }, []);
  const spawnThemeRipple = (x: number, y: number, nextDark: boolean) => {
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );
    const ripple = document.createElement('div');
    ripple.style.position = 'fixed';
    ripple.style.left = `${x - radius}px`;
    ripple.style.top = `${y - radius}px`;
    ripple.style.width = `${radius * 2}px`;
    ripple.style.height = `${radius * 2}px`;
    ripple.style.borderRadius = '50%';
    ripple.style.background = nextDark ? '#030407' : '#fdfdfd';
    ripple.style.pointerEvents = 'none';
    ripple.style.zIndex = '9999';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation =
      'theme-ripple-expand 0.9s ease forwards, theme-ripple-fade 0.45s ease-in 0.85s forwards';
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', (event) => {
      if (event.animationName === 'theme-ripple-fade') ripple.remove();
    });
  };
  const handleThemeToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    setUserOverride(true);
    const next = !isDarkMode;
    setIsDarkMode(next);
    spawnThemeRipple(x, y, next);
  };
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

      const bgColor = isDarkMode ? '#030407' : '#fdfdfdff';
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
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', userSelect: 'none', background: '#030407' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'block', cursor: 'crosshair', width: '100%', height: '100%' }} />

      {/* COMPONENTS corner link */}
      <button
        onClick={() => navigate('/components')}
        style={{ position: 'absolute', bottom: '1.5rem', left: '1.5rem', zIndex: 50, background: 'transparent', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fff' : '#0f172a', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', letterSpacing: '0.15em', opacity: 0.6, textTransform: 'uppercase', padding: 0 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
      >
        COMPONENTS
      </button>

      <button
        onClick={() => navigate('/works')}
        style={{ position: 'absolute', bottom: '1.5rem', left: '9rem', zIndex: 50, background: 'transparent', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fff' : '#0f172a', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', letterSpacing: '0.15em', opacity: 0.6, textTransform: 'uppercase', padding: 0 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
      >
        MY WORKS
      </button>

      <button
        onClick={() => navigate('/github')}
        style={{ position: 'absolute', bottom: '1.5rem', left: '16.5rem', zIndex: 50, background: 'transparent', border: 'none', cursor: 'pointer', color: isDarkMode ? '#fff' : '#0f172a', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem', letterSpacing: '0.15em', opacity: 0.6, textTransform: 'uppercase', padding: 0 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
      >
        GITHUB
      </button>

      {authUser && (
        <div
          style={{ position: 'absolute', top: '2rem', right: '9rem', zIndex: 20, fontFamily: 'ui-monospace, monospace', fontSize: '0.75rem', letterSpacing: '0.08em', color: isDarkMode ? '#fff' : '#0f172a', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)', border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(15,23,42,0.2)', borderRadius: '999px', padding: '0.45rem 0.9rem', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', whiteSpace: 'nowrap', maxWidth: '12rem', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {authUser}
        </div>
      )}

      <button
        onClick={authUser ? handleLogout : () => setIsAuthOpen(true)}
        style={{ position: 'absolute', top: '1.5rem', right: '5.5rem', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.75rem', height: '2.75rem', borderRadius: '50%', border: isDarkMode ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(15,23,42,0.25)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)', cursor: 'pointer', transition: 'background 0.2s' }}
        aria-label={authUser ? 'Logout' : 'Account'}
        onMouseEnter={e => (e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.1)')}
        onMouseLeave={e => (e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.04)')}
      >
        {authUser ? (
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem', color: isDarkMode ? '#fff' : '#0f172a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: '1.25rem', height: '1.25rem', color: isDarkMode ? '#fff' : '#0f172a' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )}
      </button>

      <ThemeToggle
        isDarkMode={isDarkMode}
        onToggle={handleThemeToggle}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />


      <div style={{ position: 'relative', zIndex: 10, display: 'flex', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 1rem', color: isDarkMode ? '#fff' : '#0f172a' }}>
        <div style={{ pointerEvents: 'none' }}>
          <h1 style={{ fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', fontSize: 'clamp(4rem, 15vw, 13rem)', fontWeight: 900, letterSpacing: '-0.04em', textTransform: 'uppercase', lineHeight: 1, margin: 0 }}>
            SABLE
          </h1>
          <p style={{ marginTop: '1.5rem', fontFamily: 'ui-monospace, monospace', fontSize: 'clamp(0.75rem, 1.5vw, 1rem)', opacity: 0.6, letterSpacing: '0.12em', maxWidth: '36rem', margin: '1.5rem auto 0' }}>
            Type it. Sable builds it. Live in seconds.
          </p>
        </div>
        <br></br>
        <br></br>

        <div style={{ marginTop: '3.5rem', width: '100%', maxWidth: '900px' }}>
          <PromptBox isDarkMode={isDarkMode} />
        </div>
      </div>
    </div >
  );
}
