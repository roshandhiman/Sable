import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RippleDistortion from './ui/RippleDistortion';

function WorkModal({ work, onClose }) {
  const [tab, setTab] = useState('preview');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(work.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(2, 4, 10, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '1.5rem'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(1200px, 92vw)',
          height: 'min(800px, 88vh)',
          background: 'rgba(10, 14, 28, 0.85)',
          border: '1px solid rgba(95, 139, 255, 0.35)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px rgba(95, 139, 255, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          gap: '0.75rem',
          background: 'rgba(15, 20, 38, 0.6)'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700,
            color: '#fff',
            flex: 1,
            fontFamily: 'ui-monospace, monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {work.title}
          </h2>

          <button
            onClick={() => setTab('preview')}
            style={{
              background: tab === 'preview' ? '#fff' : 'rgba(255, 255, 255, 0.05)',
              color: tab === 'preview' ? '#000' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid ' + (tab === 'preview' ? '#fff' : 'rgba(95, 139, 255, 0.25)'),
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease'
            }}
          >
            Preview
          </button>

          <button
            onClick={() => setTab('code')}
            style={{
              background: tab === 'code' ? '#fff' : 'rgba(255, 255, 255, 0.05)',
              color: tab === 'code' ? '#000' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid ' + (tab === 'code' ? '#fff' : 'rgba(95, 139, 255, 0.25)'),
              padding: '0.4rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.05em',
              transition: 'all 0.2s ease'
            }}
          >
            Code
          </button>

          {tab === 'code' && (
            <button
              onClick={handleCopy}
              style={{
                background: 'rgba(95, 139, 255, 0.15)',
                color: '#93b5ff',
                border: '1px solid rgba(95, 139, 255, 0.35)',
                padding: '0.4rem 0.9rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontFamily: 'ui-monospace, monospace',
                letterSpacing: '0.05em',
                transition: 'all 0.2s ease'
              }}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          )}

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.5)',
              cursor: 'pointer',
              fontSize: '1.4rem',
              lineHeight: 1,
              padding: '0.2rem 0.5rem',
              marginLeft: '0.5rem',
              transition: 'color 0.2s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {tab === 'preview' ? (
            <iframe
              title="preview"
              srcDoc={work.html}
              style={{ width: '100%', height: '100%', border: 'none', background: '#0a0a0f' }}
              sandbox="allow-scripts"
            />
          ) : (
            <pre style={{
              margin: 0,
              padding: '1.5rem',
              height: '100%',
              overflow: 'auto',
              fontSize: '0.8rem',
              color: '#93b5ff',
              background: 'rgba(5, 7, 15, 0.7)',
              fontFamily: 'ui-monospace, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all'
            }}>
              {work.html}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Works() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const works = JSON.parse(localStorage.getItem('sable_works') || '[]').reverse();

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#000' }}>
      {/* Background RippleDistortion */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <RippleDistortion
          src="https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=3416&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          brushSize={200}
          strength={0.2}
          swirl={1}
          rings={3}
          tint="#5f8bff"
          tintAmount={0.08}
          grayscale={true}
          trigger="hover"
          quality="low"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '2.5rem', minHeight: '100vh' }}>
        {/* Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              textTransform: 'uppercase',
              color: '#fff',
              fontFamily: 'ui-monospace, monospace'
            }}>
              Works
            </h1>
            <span style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              background: 'rgba(95, 139, 255, 0.15)',
              border: '1px solid rgba(95, 139, 255, 0.3)',
              color: '#93b5ff',
              fontFamily: 'ui-monospace, monospace',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>
              {works.length} {works.length === 1 ? 'project' : 'projects'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => navigate('/components')}
              style={{
                background: 'rgba(10, 15, 28, 0.6)',
                border: '1px solid rgba(95, 139, 255, 0.25)',
                color: '#fff',
                padding: '0.45rem 1.1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(95, 139, 255, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(95, 139, 255, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Components →
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                background: 'rgba(10, 15, 28, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '0.45rem 1.1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.85rem',
                letterSpacing: '0.05em',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#fff';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.background = 'rgba(10, 15, 28, 0.6)';
              }}
            >
              ← Landing
            </button>
          </div>
        </div>

        {works.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            borderRadius: '16px',
            background: 'rgba(10, 15, 28, 0.5)',
            border: '1px solid rgba(95, 139, 255, 0.2)',
            backdropFilter: 'blur(12px)',
            maxWidth: '500px',
            margin: '4rem auto'
          }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontFamily: 'ui-monospace, monospace', fontSize: '1rem', margin: '0 0 1.5rem' }}>
              No works generated yet. Start building from the landing page.
            </p>
            <button
              onClick={() => navigate('/')}
              style={{
                background: '#fff',
                color: '#000',
                border: 'none',
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                fontFamily: 'ui-monospace, monospace',
                transition: 'opacity 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Create First Website →
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '1.75rem'
          }}>
            {works.map((work, i) => {
              const isHovered = hoveredIndex === i;
              return (
                <div
                  key={i}
                  onClick={() => setSelected(work)}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    background: 'rgba(8, 12, 24, 0.65)',
                    border: isHovered ? '1px solid rgba(255, 255, 255, 0.85)' : '1px solid rgba(95, 139, 255, 0.28)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    boxShadow: isHovered
                      ? '0 16px 40px -10px rgba(95, 139, 255, 0.35), 0 0 25px rgba(95, 139, 255, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
                      : '0 8px 32px 0 rgba(0, 0, 0, 0.45), inset 0 0 0 1px rgba(255, 255, 255, 0.08)',
                    transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{
                    width: '100%',
                    height: '180px',
                    overflow: 'hidden',
                    background: '#0a0d17',
                    position: 'relative',
                    pointerEvents: 'none',
                    borderBottom: '1px solid rgba(95, 139, 255, 0.15)'
                  }}>
                    <iframe
                      title={work.title}
                      srcDoc={work.html}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '1280px',
                        height: '800px',
                        border: 'none',
                        transform: 'scale(0.245)',
                        transformOrigin: 'top left'
                      }}
                      sandbox="allow-scripts"
                    />
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: isHovered
                        ? 'linear-gradient(180deg, rgba(8, 12, 24, 0.15) 0%, rgba(8, 12, 24, 0.55) 100%)'
                        : 'linear-gradient(180deg, rgba(8, 12, 24, 0.25) 0%, rgba(8, 12, 24, 0.8) 100%)',
                      transition: 'background 0.25s ease'
                    }} />
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      zIndex: 3,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(8, 12, 24, 0.75)',
                      border: '1px solid rgba(95, 139, 255, 0.4)',
                      borderRadius: '20px',
                      padding: '3px 9px',
                      fontSize: '0.68rem',
                      color: '#93b5ff',
                      fontFamily: 'ui-monospace, monospace',
                      backdropFilter: 'blur(8px)'
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                      LIVE
                    </div>
                  </div>
                  <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: '#fff',
                      fontFamily: 'ui-monospace, monospace',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {work.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <p style={{
                        margin: 0,
                        fontSize: '0.8rem',
                        color: 'rgba(255, 255, 255, 0.55)',
                        fontFamily: 'ui-monospace, monospace'
                      }}>
                        {new Date(work.savedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <span style={{
                        fontSize: '0.8rem',
                        color: isHovered ? '#fff' : 'rgba(95, 139, 255, 0.8)',
                        fontFamily: 'ui-monospace, monospace',
                        fontWeight: 600,
                        transition: 'color 0.2s ease'
                      }}>
                        Open →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && <WorkModal work={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
