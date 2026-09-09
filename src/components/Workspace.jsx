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
    <div className="relative flex w-full h-screen bg-black text-white overflow-hidden">
      {/* Background spider cursor effect */}
      <div className="absolute inset-0 z-0">
        <SpiderCursor />
      </div>

      {/* Content on top */}
      <div className="relative z-10 flex w-full h-full">
        {/* Left: output/preview */}
        <div className="w-1/2 h-full border-r border-white/10 flex items-center justify-center">
          <p className="text-white/40 font-mono text-sm">
            Output will render here...
          </p>
        </div>

        {/* Right: thinking / code generation */}
        <div className="w-1/2 h-full p-6 flex flex-col">
          <p className="font-mono text-sm text-white/60 mb-4">
            Prompt: {prompt}
          </p>
          <p className="font-mono text-sm text-white/40">
            Thinking{dots}
          </p>
        </div>
      </div>
    </div>
  );
}