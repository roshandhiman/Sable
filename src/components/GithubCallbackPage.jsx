import { useEffect, useState } from 'react';
import { setGithubToken } from '../lib/github';

const mono = 'ui-monospace, monospace';

export default function GithubCallbackPage() {
  const [{ token, error }] = useState(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return { token: params.get('gh_token') || '', error: params.get('gh_error') || '' };
  });
  const isPopup = Boolean(window.opener && !window.opener.closed);

  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'sable-github', token, error }, window.location.origin);
      const timer = setTimeout(() => window.close(), 1200);
      return () => clearTimeout(timer);
    }
    if (token) setGithubToken(token);
    const hash = window.location.hash;
    window.location.replace(`/github${hash}`);
    return undefined;
  }, [token, error]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        fontFamily: mono,
      }}
    >
      <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
        {error ? 'Authorization failed' : 'GitHub connected'}
      </p>
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
        {error || (isPopup ? 'Returning to Sable…' : 'Redirecting…')}
      </p>
    </div>
  );
}
