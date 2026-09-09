import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SpiderCursor } from './ui/SpyderCursor';

export default function Workspace() {
  const location = useLocation();
  const { prompt, model } = location.state || {};
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex w-full h-screen bg-black text-white overflow-hidden p-6 gap-6">
      {/* Background spider cursor effect */}
      <div className="absolute inset-0 z-0">
        <SpiderCursor />
      </div>

      {/* Left: output/preview card */}
      <div
        className="relative z-10 w-1/2 h-full flex items-center justify-center"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <p className="text-white/40 font-mono text-sm">
          Output will render here...
        </p>
      </div>

      {/* Right: thinking / code generation card */}
      <div
        className="relative z-10 w-1/2 h-full p-6 flex flex-col"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <p className="font-mono text-sm text-white/60 mb-4">
          Prompt: {prompt}
        </p>
        <p className="font-mono text-sm text-white/40">
          Thinking{dots}
        </p>
      </div>
    </div>
  );
}