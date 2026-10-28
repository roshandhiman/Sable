import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react';
import { Home } from 'lucide-react';
import { SpiderCursor } from './ui/SpyderCursor';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-javascript';

export default function Workspace() {
  const location = useLocation();
  const navigate = useNavigate();
  const { prompt, model } = location.state || {};
  const [dots, setDots] = useState('');
  const [fullCode, setFullCode] = useState('');
  const [displayedCode, setDisplayedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [usedProvider, setUsedProvider] = useState('');
  const [error, setError] = useState('');
  const codeContainerRef = useRef(null);

  useEffect(() => {
    if (!isGenerating && !isStreaming) return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isGenerating, isStreaming]);

  useEffect(() => {
    if (!prompt) return;
    const controller = new AbortController();
    let cancelled = false;
    let raw = '';
    let streamError = '';
    let codeTimer = null;
    let previewTimer = null;

    const cleanLive = (s) =>
      s
        .replace(/^```(?:html)?\s*/i, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[ \t])\/\/[^\r\n]*/gm, '$1')
        .trim();

    const flushCode = () => {
      codeTimer = null;
      if (!cancelled) setDisplayedCode(cleanLive(raw));
    };
    const flushPreview = () => {
      previewTimer = null;
      if (!cancelled) setFullCode(cleanLive(raw));
    };
    const schedule = () => {
      if (codeTimer === null) codeTimer = setTimeout(flushCode, 100);
      if (previewTimer === null) previewTimer = setTimeout(flushPreview, 400);
    };

    async function run() {
      setIsGenerating(true);
      setIsStreaming(false);
      setDisplayedCode('');
      setFullCode('');
      setUsedProvider('');
      setError('');
      try {
        const api = import.meta.env.PROD ? '/api' : 'http://localhost:3001';
        const res = await fetch(`${api}/generate/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model, history: [], prompt }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let received = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const payload = t.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            let event;
            try {
              event = JSON.parse(payload);
            } catch {
              continue;
            }
            if (event.type === 'meta') {
              setUsedProvider(event.provider);
            } else if (event.type === 'error') {
              streamError = event.message;
            } else if (event.type === 'delta') {
              if (!received) {
                received = true;
                setIsGenerating(false);
                setIsStreaming(true);
              }
              raw += event.text;
              schedule();
            }
          }
        }

        const html = cleanLive(raw);
        if (cancelled) return;
        if (codeTimer) clearTimeout(codeTimer);
        if (previewTimer) clearTimeout(previewTimer);
        setDisplayedCode(html);
        setFullCode(html);
        setIsGenerating(false);
        setIsStreaming(false);
        if (!html) {
          setError(streamError || 'No output received');
          return;
        }
        const existing = JSON.parse(localStorage.getItem('sable_works') || '[]');
        existing.push({ title: prompt, html, savedAt: Date.now() });
        localStorage.setItem('sable_works', JSON.stringify(existing));
      } catch (err) {
        if (cancelled || err.name === 'AbortError') return;
        setError(err.message);
        setDisplayedCode('');
        setIsGenerating(false);
        setIsStreaming(false);
      }
    }

    run();
    return () => {
      cancelled = true;
      controller.abort();
      if (codeTimer) clearTimeout(codeTimer);
      if (previewTimer) clearTimeout(previewTimer);
    };
  }, [prompt, model]);

  useEffect(() => {
    if ((isGenerating || isStreaming) && codeContainerRef.current) {
      codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
    }
  }, [displayedCode, isGenerating, isStreaming]);

  const highlightedCode = useMemo(() => {
    if (!displayedCode) return '';
    try {
      return Prism.highlight(displayedCode, Prism.languages.html, 'html');
    } catch {
      return displayedCode;
    }
  }, [displayedCode]);

  const previewHtml = useMemo(() => {
    if (!fullCode) return '';
    const clickGuard = `
<script>
document.addEventListener('click', function(e) {
  var a = e.target.closest('a');
  if (!a) return;
  var href = a.getAttribute('href');
  if (!href || href === '#' || href === '/') {
    e.preventDefault();
    return;
  }
  if (href.startsWith('#')) {
    e.preventDefault();
    var el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  } else if (!href.startsWith('http') && !href.startsWith('mailto:')) {
    e.preventDefault();
  }
}, true);
</script>
</body>`;
    return fullCode.includes('</body>')
      ? fullCode.replace('</body>', clickGuard)
      : fullCode + clickGuard;
  }, [fullCode]);

  return (
    <div className="relative flex w-full h-screen bg-black text-white overflow-hidden p-6 gap-6">
      <div className="absolute inset-0 z-0">
        <SpiderCursor />
      </div>

      <button
        type="button"
        aria-label="Home"
        title="Home"
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 z-30 flex items-center justify-center cursor-pointer"
        style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: 'rgba(255, 255, 255, 0.7)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
        }}
      >
        <Home size={18} />
      </button>

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
        {fullCode ? (
          <iframe
            title="preview"
            srcDoc={previewHtml}
            className="w-full h-full rounded-[20px] bg-[#09090b] border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : (
          <p className="text-white/40 font-mono text-sm">
            {isGenerating || isStreaming
              ? `Building your page${dots}`
              : error
                ? `Error: ${error}`
                : 'Output will render here...'}
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
        <div className="flex items-center justify-between mb-2 shrink-0">
          <p className="font-mono text-sm text-white/60 truncate max-w-[80%] m-0">
            Prompt: {prompt}
          </p>
        </div>

        {usedProvider && (
          <p className="font-mono text-xs text-white/30 mb-3 shrink-0 m-0">
            via {usedProvider}
          </p>
        )}

        {isGenerating && (
          <p className="font-mono text-sm text-white/40 mb-2 shrink-0">
            Thinking{dots}
          </p>
        )}

        {error && (
          <p className="font-mono text-xs text-red-400 mb-2 shrink-0 m-0">{error}</p>
        )}

        <pre
          ref={codeContainerRef}
          className="font-mono text-xs overflow-y-auto flex-1 whitespace-pre-wrap leading-relaxed select-text"
          style={{
            margin: 0,
            padding: '1.25rem',
            background: 'rgba(5, 7, 15, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <code
            className="language-html"
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
          {(isGenerating || isStreaming) && (
            <span className="animate-pulse text-blue-400">▊</span>
          )}
        </pre>

        <div className="mt-4 shrink-0">
          <input
            type="text"
            placeholder="What Would You Like To Change?"
            style={{
              width: '100%',
              padding: '1.25rem 1rem',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
              borderRadius: '16px',
              color: 'white',
              background: 'rgba(255, 255, 255, 0.05)',
              outline: 'none',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem'
            }}
          />
        </div>
      </div>
    </div>
  );
}