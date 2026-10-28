import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const GH_API = 'https://api.github.com'

const frontendUrl = () => process.env.GITHUB_FRONTEND_URL || 'http://localhost:5173'
const redirectUri = () => process.env.GITHUB_REDIRECT_URI || `http://localhost:${process.env.PORT || 3001}/github/callback`
const redirectBack = (suffix) => `${frontendUrl()}/github/callback${suffix}`

const tokenFrom = (req) => {
  const header = req.get('authorization') || ''
  return header.replace(/^Bearer\s+/i, '').trim()
}

const ghFetch = async (url, token, init = {}) => {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {})
    }
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

const message = (data, fallback) =>
  data?.message || data?.error_description || data?.errors?.[0]?.message || fallback

export const githubLogin = (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    const err = new URLSearchParams({
      gh_error: 'GitHub app not configured — set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in backend/.env'
    })
    return res.redirect(redirectBack(`#${err.toString()}`))
  }
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: 'repo read:user',
    state: Math.random().toString(36).slice(2)
  })
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}

export const githubCallback = async (req, res) => {
  const { code } = req.query
  if (!code) return res.redirect(redirectBack('#gh_error=missing_code'))
  try {
    const r = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri()
      })
    })
    const data = await r.json()
    if (!data.access_token) {
      return res.redirect(redirectBack(`#gh_error=${encodeURIComponent(message(data, 'token_exchange_failed'))}`))
    }
    res.redirect(redirectBack(`#gh_token=${encodeURIComponent(data.access_token)}`))
  } catch (e) {
    res.redirect(redirectBack(`#gh_error=${encodeURIComponent(e.message)}`))
  }
}

export const githubUser = async (req, res) => {
  const token = tokenFrom(req)
  if (!token) return res.status(401).json({ error: 'Not connected to GitHub' })
  const { ok, status, data } = await ghFetch(`${GH_API}/user`, token)
  if (!ok) return res.status(status === 401 ? 401 : 500).json({ error: message(data, 'GitHub request failed') })
  res.json({
    login: data.login,
    avatar_url: data.avatar_url,
    name: data.name || data.login,
    html_url: data.html_url,
    public_repos: data.public_repos,
    private_repos: data.total_private_repos || 0
  })
}

export const githubRepos = async (req, res) => {
  const token = tokenFrom(req)
  if (!token) return res.status(401).json({ error: 'Not connected to GitHub' })
  const page = Number(req.query.page) || 1
  const { ok, status, data } = await ghFetch(
    `${GH_API}/user/repos?sort=updated&per_page=30&page=${page}&affiliation=owner,collaborator,organization_member`,
    token
  )
  if (!ok) return res.status(status === 401 ? 401 : 500).json({ error: message(data, 'GitHub request failed') })
  res.json({
    repos: (Array.isArray(data) ? data : []).map(r => ({
      name: r.name,
      full_name: r.full_name,
      html_url: r.html_url,
      description: r.description,
      private: r.private,
      updated_at: r.updated_at,
      default_branch: r.default_branch
    }))
  })
}

export const githubPush = async (req, res) => {
  const token = tokenFrom(req)
  if (!token) return res.status(401).json({ error: 'Not connected to GitHub' })

  const { name, description, private: isPrivate, html } = req.body || {}
  const repoName = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)

  if (!repoName) return res.status(400).json({ error: 'Repository name is required' })
  if (!html) return res.status(400).json({ error: 'Nothing to push' })

  try {
    const user = await ghFetch(`${GH_API}/user`, token)
    if (!user.ok) return res.status(401).json({ error: message(user.data, 'GitHub token is not valid') })
    const login = user.data.login

    const created = await ghFetch(`${GH_API}/user/repos`, token, {
      method: 'POST',
      body: JSON.stringify({
        name: repoName,
        description: description ? String(description).slice(0, 350) : 'Built with Sable',
        private: !!isPrivate,
        auto_init: false
      })
    })

    let repoUrl = created.data?.html_url
    if (!created.ok && created.status !== 422) {
      return res.status(created.status).json({ error: message(created.data, 'Could not create repository') })
    }

    const put = await ghFetch(`${GH_API}/repos/${login}/${repoName}/contents/index.html`, token, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Add index.html via Sable',
        content: Buffer.from(String(html), 'utf8').toString('base64')
      })
    })

    if (!put.ok) {
      return res.status(put.status).json({ error: message(put.data, 'Could not write index.html') })
    }

    repoUrl = put.data?.content?.html_url?.replace(/\/blob\/.*$/, '') || repoUrl || `https://github.com/${login}/${repoName}`
    res.json({
      ok: true,
      login,
      name: repoName,
      repo_url: repoUrl,
      file_url: put.data?.content?.html_url,
      created: created.ok
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
