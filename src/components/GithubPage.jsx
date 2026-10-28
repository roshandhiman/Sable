import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearGithubToken, consumeGithubCallback, ghFetch } from '../lib/github';

const mono = 'ui-monospace, monospace';

const backBtn = {
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.2)',
  color: '#fff',
  padding: '0.35rem 1rem',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: mono,
  fontSize: '0.85rem',
  letterSpacing: '0.05em',
  transition: 'all 0.2s ease',
};

const repoRow = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  padding: '1rem 1.2rem',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  background: 'rgba(255,255,255,0.03)',
  transition: 'all 0.2s ease',
};

const smallBtn = {
  ...backBtn,
  padding: '0.4rem 0.9rem',
  fontSize: '0.78rem',
};

function GithubDashboard({ token, onDisconnect }) {
  const [user, setUser] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([ghFetch('/github/user'), ghFetch('/github/repos')])
      .then(([profile, list]) => {
        if (!active) return;
        setUser(profile);
        setRepos(list.repos || []);
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message);
        if (/401|token|not connected/i.test(e.message)) onDisconnect();
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, onDisconnect]);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem 1.2rem',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          background: 'rgba(255,255,255,0.04)',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        {user?.avatar_url && (
          <img
            src={user.avatar_url}
            alt=""
            width={36}
            height={36}
            style={{ borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)' }}
          />
        )}
        <div style={{ flex: 1, minWidth: '10rem' }}>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, fontFamily: mono }}>
            {user?.login || 'connected'}
          </p>
          <p
            style={{
              margin: '0.2rem 0 0',
              fontSize: '0.78rem',
              fontFamily: mono,
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            {user ? `${user.public_repos} public · ${user.private_repos} private repos` : 'loading...'}
          </p>
        </div>
        <button
          type="button"
          style={smallBtn}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      </div>

      {error && (
        <p style={{ color: '#f87171', fontSize: '0.85rem', fontFamily: mono, marginTop: 0 }}>{error}</p>
      )}

      <p
        style={{
          fontSize: '0.75rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          fontFamily: mono,
        }}
      >
        Your repositories
      </p>

      {loading && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontFamily: mono }}>Loading repos...</p>
      )}

      {!loading && repos.length === 0 && (
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontFamily: mono }}>
          No repositories found.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxWidth: '60rem' }}>
        {repos.map((repo) => (
          <a
            key={repo.full_name}
            href={repo.html_url}
            target="_blank"
            rel="noreferrer"
            style={{ ...repoRow, textDecoration: 'none', color: '#fff', fontFamily: mono }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                {repo.name}
                {repo.private && (
                  <span
                    style={{
                      marginLeft: '0.6rem',
                      fontSize: '0.68rem',
                      color: 'rgba(255,255,255,0.6)',
                      border: '1px solid rgba(255,255,255,0.25)',
                      borderRadius: '4px',
                      padding: '0.08rem 0.4rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 400,
                    }}
                  >
                    private
                  </span>
                )}
              </p>
              <p
                style={{
                  margin: '0.3rem 0 0',
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.5)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {repo.description || repo.full_name}
              </p>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>
              {new Date(repo.updated_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export default function GithubPage() {
  const navigate = useNavigate();
  const [initial] = useState(() => consumeGithubCallback());
  const [token, setToken] = useState(initial.token);
  const error = initial.error || '';
  const [notice, setNotice] = useState('');

  const handleDisconnect = useCallback(() => {
    clearGithubToken();
    setToken('');
    setNotice('GitHub disconnected.');
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', background: '#000', color: '#fff' }}>
      <div style={{ padding: '2.5rem', fontFamily: mono }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <h1
            style={{
              margin: 0,
              fontSize: '3rem',
              fontWeight: 900,
              letterSpacing: '-0.05em',
              textTransform: 'uppercase',
              color: '#fff',
              fontFamily: mono,
            }}
          >
            GitHub
          </h1>
          <button
            type="button"
            style={backBtn}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onClick={() => navigate('/')}
          >
            ← Back
          </button>
        </div>

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: 0, fontFamily: mono }}>{error}</p>
        )}
        {notice && (
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', marginTop: 0, fontFamily: mono }}>
            {notice}
          </p>
        )}

        {token ? (
          <GithubDashboard token={token} onDisconnect={handleDisconnect} />
        ) : (
          <div
            style={{
              maxWidth: '34rem',
              padding: '2rem',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <p
              style={{
                marginTop: 0,
                color: 'rgba(255,255,255,0.7)',
                fontSize: '0.9rem',
                lineHeight: 1.7,
                fontFamily: mono,
              }}
            >
              GitHub connectivity
            </p>
            <p
              style={{
                margin: '0 0 0.4rem',
                fontSize: '1.5rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
                fontFamily: mono,
              }}
            >
              Coming soon
            </p>
            <p
              style={{
                margin: 0,
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.85rem',
                lineHeight: 1.7,
                fontFamily: mono,
              }}
            >
              Connect your account and push your generated pages straight to your repositories — this feature
              will be added soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
