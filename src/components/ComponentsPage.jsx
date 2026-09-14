import { useNavigate } from 'react-router-dom';

export default function ComponentsPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#030407', color: '#fff', fontFamily: 'ui-monospace, monospace', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.05em', textTransform: 'uppercase', margin: 0 }}>Components</h1>
        <button onClick={() => navigate('/')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.35rem 1rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em', fontSize: '0.85rem' }}>
          ← Back 
        </button>
      </div>
      <p style={{ opacity: 0.5, fontSize: '0.9rem', letterSpacing: '0.1em' }}>Component library — coming soon.</p>
    </div>
  );
}
