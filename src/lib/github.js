const TOKEN_KEY = 'sable_github_token';

export const apiBase = () => '/api';

export const getGithubToken = () => localStorage.getItem(TOKEN_KEY) || '';

export const setGithubToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearGithubToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

export async function ghFetch(path, options = {}) {
  const token = getGithubToken();
  const res = await fetch(`${apiBase()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const startGithubAuth = () => {
  window.location.href = `${apiBase()}/github/login`;
};

export function connectGithub() {
  return new Promise((resolve) => {
    const popup = window.open(
      `${apiBase()}/github/login`,
      'sable-github-oauth',
      'width=540,height=700,menubar=no,toolbar=no'
    );
    if (!popup) {
      window.location.href = `${apiBase()}/github/login`;
      resolve({ token: getGithubToken(), error: '' });
      return;
    }
    let settled = false;
    let poll = null;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      if (poll) clearInterval(poll);
      if (result.token) setGithubToken(result.token);
      if (!popup.closed) popup.close();
      resolve(result);
    };
    const onMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data || {};
      if (data.type !== 'sable-github') return;
      finish({ token: data.token || '', error: data.error || '' });
    };
    window.addEventListener('message', onMessage);
    poll = setInterval(() => {
      if (popup.closed) {
        finish({ token: getGithubToken(), error: 'Authorization window was closed' });
      }
    }, 600);
  });
}

export function consumeGithubCallback() {
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return { token: getGithubToken(), error: '' };
  const params = new URLSearchParams(hash);
  const token = params.get('gh_token') || '';
  const error = params.get('gh_error') || '';
  if (token) setGithubToken(token);
  window.history.replaceState({}, '', window.location.pathname);
  return { token: token || getGithubToken(), error };
}
