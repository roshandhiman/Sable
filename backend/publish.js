import crypto from 'crypto'

const config = () => ({
  url: (process.env.PUBLISH_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, ''),
  key: process.env.PUBLISH_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
})

const request = async (path, init = {}) => {
  const { url, key } = config()
  if (!url || !key) throw new Error('Publishing is not configured')
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    }
  })
  const data = await res.json().catch(() => [])
  if (!res.ok) throw new Error(data?.message || 'Could not publish this project')
  return data
}

const toSlug = (value) => String(value || 'project')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 42) || 'project'

export const publishWork = async (req, res) => {
  const { title, html } = req.body || {}
  if (!html) return res.status(400).json({ error: 'Nothing to publish' })
  const slug = `${toSlug(title)}-${crypto.randomBytes(4).toString('hex')}`
  try {
    await request('published_works', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ slug, html: String(html) })
    })
    res.json({ slug })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const getPublishedWork = async (req, res) => {
  try {
    const slug = encodeURIComponent(String(req.params.slug || ''))
    const rows = await request(`published_works?slug=eq.${slug}&select=html&limit=1`)
    if (!rows[0]?.html) return res.status(404).json({ error: 'Published project not found' })
    res.json({ html: rows[0].html })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
