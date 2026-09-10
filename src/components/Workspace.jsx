import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SpiderCursor } from './ui/SpyderCursor';

export default function Workspace() {
  const location = useLocation();
  const { prompt, model } = location.state || {};
  const [dots, setDots] = useState('');
  const [fullCode, setFullCode] = useState('');
  const [displayedCode, setDisplayedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [usedProvider, setUsedProvider] = useState('');

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isGenerating]);

  useEffect(() => {
    if (!prompt) return;

    async function fetchGeneration() {
      setIsGenerating(true);
      setFullCode('');
      setDisplayedCode('');

      try {
        const res = await fetch('http://localhost:3001/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, history: [], prompt }),
        });
        const data = await res.json();

        if (data.error) {
          setDisplayedCode(`// Error: ${data.error}`);
          setIsGenerating(false);
          return;
        }

        setFullCode(data.html);
        setUsedProvider(data.usedProvider);
        setIsGenerating(false);
        setIsTyping(true);
      } catch (err) {
        setDisplayedCode(`// Error: ${err.message}`);
        setIsGenerating(false);
      }
    }

    fetchGeneration();
  }, [prompt, model]);

  useEffect(() => {
    if (!fullCode || !isTyping) return;

    let i = 0;
    const charsPerTick = 8;
    const interval = setInterval(() => {
      i += charsPerTick;
      setDisplayedCode(fullCode.slice(0, i));
      if (i >= fullCode.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [fullCode, isTyping]);

  return (
    <div className="relative flex w-full h-screen bg-black text-white overflow-hidden p-6 gap-6">
      <div className="absolute inset-0 z-0">
        <SpiderCursor />
      </div>

      <div
        className="relative z-10 w-1/2 h-full flex items-center justify-center overflow-hidden"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        {!isTyping && fullCode ? (
          <iframe
            title="preview"
            srcDoc={fullCode}
            className="w-full h-full rounded-[20px] bg-white"
            sandbox="allow-scripts"
          />
        ) : (
          <p className="text-white/40 font-mono text-sm">
            {isGenerating || isTyping ? 'Building your page...' : 'Output will render here...'}
          </p>
        )}
      </div>

      <div
        className="relative z-10 w-1/2 h-full p-6 flex flex-col overflow-hidden"
        style={{
          borderRadius: '30px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
      >
        <p className="font-mono text-sm text-white/60 mb-2 shrink-0">
          Prompt: {prompt}
        </p>
        {usedProvider && (
          <p className="font-mono text-xs text-white/30 mb-4 shrink-0">
            via {usedProvider}
          </p>
        )}
        {isGenerating && (
          <p className="font-mono text-sm text-white/40 mb-2 shrink-0">
            Thinking{dots}
          </p>
        )}
        <pre className="font-mono text-xs text-green-400/90 overflow-y-auto flex-1 whitespace-pre-wrap">
          {displayedCode}
          {isTyping && <span className="animate-pulse">▊</span>}
        </pre>
      </div>
    </div>
  );
}