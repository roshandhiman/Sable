import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function PublishedPage() {
  const { slug } = useParams();
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/published/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Project not found');
        setHtml(data.html);
      })
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#000', color: '#fff', fontFamily: 'ui-monospace, monospace' }}>{error}</div>;
  if (!html) return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#000', color: '#fff', fontFamily: 'ui-monospace, monospace' }}>Loading project...</div>;
  return <iframe title={slug} srcDoc={html} sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals" style={{ width: '100vw', height: '100vh', border: 0, display: 'block' }} />;
}
