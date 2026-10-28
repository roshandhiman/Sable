import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import RippleDistortion from './ui/RippleDistortion';
import { getGithubToken, ghFetch } from '../lib/github';
import { deleteWork, loadWorks } from '../lib/supabase';

function WorkModal({ work, onClose }) {
  const [tab, setTab] = useState('preview');

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '80vw', height: '80vh',
          background: '#000',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '20px',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          gap: '1rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#fff', flex: 1, fontFamily: 'ui-monospace, monospace' }}>
            {work.title}
          </h2>
          <button
            onClick={() => setTab('preview')}
            style={{
              background: tab === 'preview' ? '#fff' : 'transparent',
              color: tab === 'preview' ? '#000' : 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '0.3rem 0.9rem', borderRadius: '6px',
              cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.08em'
            }}
          >
            Preview
          </button>
          <button
            onClick={() => setTab('code')}
            style={{
              background: tab === 'code' ? '#fff' : 'transparent',
              color: tab === 'code' ? '#000' : 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.2)',
              padding: '0.3rem 0.9rem', borderRadius: '6px',
              cursor: 'pointer', fontSize: '0.78rem', fontFamily: 'ui-monospace, monospace',
              letterSpacing: '0.08em'
            }}
          >
            Code
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
              fontSize: '1.3rem', lineHeight: 1, padding: '0 0.2rem'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          {tab === 'preview' ? (
            <iframe
              title="preview"
              srcDoc={work.html}
              style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            />
          ) : (
            <pre style={{
              margin: 0, padding: '1.5rem',
              height: '100%', overflow: 'auto',
              fontSize: '0.75rem', color: '#4ade80',
              fontFamily: 'ui-monospace, monospace',
              whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>
              {work.html}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'sable-work';

function PushModal({ work, onClose }) {
  const [repoName, setRepoName] = useState(() => slugify(work.title));
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [connected] = useState(() => Boolean(getGithubToken()));

  const handlePush = async () => {
    if (!repoName.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const data = await ghFetch('/github/push', {
        method: 'POST',
        body: JSON.stringify({
          name: repoName,
          description: work.title,
          private: isPrivate,
          html: work.html,
        }),
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1001,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(8px)'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(30rem, 90vw)',
          background: '#000',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '16px',
          padding: '1.5rem',
          fontFamily: 'ui-monospace, monospace',
          color: '#fff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Push to GitHub</h2>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </div>

        {!connected ? (
          <div>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              GitHub push connectivity will be added soon.
            </p>
            <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Coming soon</p>
          </div>
        ) : (
          <div>
            <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '0.4rem' }}>
              Repository name
            </label>
            <input
              value={repoName}
              onChange={e => setRepoName(e.target.value)}
              disabled={busy || Boolean(result)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '0.75rem 0.9rem',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px', color: '#fff', outline: 'none',
                fontFamily: 'inherit', fontSize: '0.85rem', marginBottom: '0.9rem'
              }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', marginBottom: '1rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPrivate}
                disabled={busy || Boolean(result)}
                onChange={e => setIsPrivate(e.target.checked)}
              />
              Private repository
            </label>

            {error && <p style={{ margin: '0 0 0.8rem', fontSize: '0.8rem', color: '#f87171' }}>{error}</p>}

            {result ? (
              <div style={{ border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '0.9rem', background: 'rgba(255,255,255,0.04)' }}>
                <p style={{ margin: '0 0 0.6rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>
                  {result.created ? 'Repository created and' : 'Pushed to'} index.html
                </p>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <a
                    href={result.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.8rem', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '6px', padding: '0.35rem 0.8rem', textDecoration: 'none' }}
                  >
                    Open repo ↗
                  </a>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.35rem 0.8rem', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePush}
                disabled={busy || !repoName.trim()}
                style={{
                  background: '#fff', color: '#000', border: 'none',
                  padding: '0.7rem 1.3rem', borderRadius: '8px',
                  cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
                  fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em',
                  opacity: busy || !repoName.trim() ? 0.6 : 1
                }}
              >
                {busy ? 'Pushing…' : 'Create repo & push'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DeployModal({ work, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [link, setLink] = useState('');

  const deploy = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await ghFetch('/publish', {
        method: 'POST',
        body: JSON.stringify({ title: work.title, html: work.html }),
      });
      const url = `${window.location.origin}/deployed/${data.slug}`;
      setLink(url);
      navigator.clipboard?.writeText(url).catch(() => {});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1001, background: 'rgba(0,0,0,0.85)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 'min(30rem, 90vw)', background: '#000', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', padding: '1.5rem', fontFamily: 'ui-monospace, monospace', color: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Deploy project</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 0, color: '#fff', fontSize: '1.3rem', cursor: 'pointer' }}>×</button>
        </div>
        {!link ? <>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', lineHeight: 1.5 }}>Publish this project on your Sable domain and get a shareable link.</p>
          {error && <p style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</p>}
          <button type="button" onClick={deploy} disabled={busy} style={{ background: '#fff', color: '#000', border: 0, borderRadius: '8px', padding: '0.7rem 1.1rem', cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {busy ? 'Deploying…' : 'Deploy'}
          </button>
        </> : <>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', lineHeight: 1.5 }}>Your website is live. The link has been copied.</p>
          <input value={link} readOnly onFocus={e => e.currentTarget.select()} style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '7px', fontFamily: 'inherit', fontSize: '0.72rem' }} />
          <div style={{ marginTop: '0.8rem', display: 'flex', gap: '0.6rem' }}>
            <a href={link} target="_blank" rel="noreferrer" style={{ color: '#000', background: '#fff', padding: '0.55rem 0.8rem', borderRadius: '7px', textDecoration: 'none', fontSize: '0.78rem', fontWeight: 700 }}>Open site ↗</a>
            <button type="button" onClick={() => navigator.clipboard?.writeText(link)} style={{ color: '#fff', background: 'transparent', padding: '0.55rem 0.8rem', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.2)', fontFamily: 'inherit', cursor: 'pointer' }}>Copy link</button>
          </div>
        </>}
      </div>
    </div>
  );
}

export default function WorksPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [works, setWorks] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(true);
  const [worksError, setWorksError] = useState('');
  const [pushTarget, setPushTarget] = useState(null);
  const [deployTarget, setDeployTarget] = useState(null);

  useEffect(() => {
    let active = true;
    loadWorks()
      .then((list) => {
        if (active) setWorks(list);
      })
      .catch((e) => {
        if (active) setWorksError(e.message);
      })
      .finally(() => {
        if (active) setLoadingWorks(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDelete = async (e, savedAt) => {
    e.stopPropagation();
    const target = works.find((w) => w.savedAt === savedAt);
    if (!target) return;
    try {
      await deleteWork(target);
    } catch (err) {
      setWorksError(err.message);
      return;
    }
    setWorks((prev) => prev.filter((w) => w.savedAt !== savedAt));
    if (selected && selected.savedAt === savedAt) {
      setSelected(null);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#000' }}>
      <div style={{ position: 'fixed', inset: 0 }}>
        <RippleDistortion
          src="https://images.unsplash.com/photo-1782977389500-dd7adad33ebe?q=80&w=3416&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          brushSize={200} strength={0.2} swirl={1} rings={3}
          tint="#ffffff" tintAmount={0.06} grayscale={true}
          trigger="hover" quality="low"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div style={{ position: 'relative', zIndex: 10, padding: '2.5rem', minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
          <h1 style={{
            margin: 0, fontSize: '3rem', fontWeight: 900,
            letterSpacing: '-0.05em', textTransform: 'uppercase', color: '#fff',
            fontFamily: 'ui-monospace, monospace'
          }}>
            My Works
          </h1>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', padding: '0.35rem 1rem', borderRadius: '6px',
              cursor: 'pointer', fontFamily: 'ui-monospace, monospace',
              fontSize: '0.85rem', letterSpacing: '0.05em'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
          >
            ← Back
          </button>
        </div>

        {loadingWorks ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem' }}>
            Loading your works...
          </p>
        ) : worksError ? (
          <p style={{ color: '#f87171', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem' }}>
            {worksError}
          </p>
        ) : works.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'ui-monospace, monospace', fontSize: '0.9rem' }}>
            No works yet. Generate something first.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {works.map((work, i) => (
              <div
                key={work.savedAt || i}
                onClick={() => setSelected(work)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 255, 255, 0.15)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ width: '100%', height: '180px', overflow: 'hidden', background: '#0a0a0f', position: 'relative', pointerEvents: 'none' }}>
                  <iframe
                    title={work.title}
                    srcDoc={work.html}
                    style={{
                      position: 'absolute', top: 0, left: 0,
                      width: '1280px', height: '800px', border: 'none',
                      transform: 'scale(0.234)', transformOrigin: 'top left'
                    }}
                    sandbox="allow-scripts"
                  />
                </div>
                <div style={{ padding: '1.2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#fff', fontFamily: 'ui-monospace, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {work.title}
                    </h3>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'ui-monospace, monospace' }}>
                      {new Date(work.savedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPushTarget(work); }}
                      title="Push to GitHub"
                      aria-label="Push to GitHub"
                      style={{
                        background: 'transparent', border: 'none', color: '#ffffff',
                        opacity: 0.75, cursor: 'pointer', padding: '0.35rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 .5C5.73.5.99 5.24.99 11.5c0 4.86 3.15 8.98 7.52 10.44.55.1.75-.24.75-.53v-1.86c-3.06.67-3.71-1.48-3.71-1.48-.5-1.28-1.23-1.62-1.23-1.62-1-.69.08-.67.08-.67 1.11.08 1.7 1.14 1.7 1.14.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.44-.28-5.01-1.22-5.01-5.44 0-1.2.43-2.18 1.13-2.95-.11-.28-.49-1.4.11-2.92 0 0 .93-.3 3.05 1.13a10.5 10.5 0 0 1 5.56 0c2.11-1.43 3.04-1.13 3.04-1.13.6 1.52.22 2.64.11 2.92.7.77 1.13 1.75 1.13 2.95 0 4.23-2.58 5.16-5.03 5.43.4.34.75 1.02.75 2.05v3.04c0 .29.2.64.76.53 4.36-1.46 7.5-5.58 7.5-10.44C23.01 5.24 18.27.5 12 .5z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeployTarget(work); }}
                      title="Deploy and share"
                      aria-label="Deploy and share"
                      style={{ background: 'transparent', border: 'none', color: '#ffffff', opacity: 0.75, cursor: 'pointer', padding: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.18)'; }}
                      onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'scale(1)'; }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m22 2-7 20-4-9-9-4Z" />
                        <path d="M22 2 11 13" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, work.savedAt)}
                    title="Delete card"
                    aria-label="Delete card"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ffffff',
                      opacity: 0.75,
                      cursor: 'pointer',
                      padding: '0.35rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '0.75'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                      <line x1="10" y1="11" x2="10" y2="17"/>
                      <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && <WorkModal work={selected} onClose={() => setSelected(null)} />}
      {pushTarget && <PushModal work={pushTarget} onClose={() => setPushTarget(null)} />}
      {deployTarget && <DeployModal work={deployTarget} onClose={() => setDeployTarget(null)} />}
    </div>
  );
}
