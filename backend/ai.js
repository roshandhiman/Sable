import 'dotenv/config'
const SYSTEM = `You are a landing page generator. Return ONLY a single complete HTML file with all CSS and JS embedded inside <style> and <script> tags. The page must be animated, responsive, and visually stunning. Output raw HTML only — no markdown, no explanation, no code fences.`
async function openaiCall(url, key, model, messages) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, max_tokens: 8192 })
  })
  if (res.status === 429) throw new Error('rate_limit')
  if (!res.ok) throw new Error('provider_error')
  const data = await res.json()
  return data.choices[0].message.content
}
async function geminiCall(messages) {
  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n')
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
    }
  )
  if (res.status === 429) throw new Error('rate_limit')
  if (!res.ok) throw new Error('provider_error')
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

async function cloudflareCall(messages) {
  const res = await fetch(
    `https://api.cloudflare.ai/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages })
    }
  )
  if (res.status === 429) throw new Error('rate_limit')
  if (!res.ok) throw new Error('provider_error')
  const data = await res.json()
  return data.result.response
}

const providers = [
  {
    id: 'groq-llama',
    label: 'Llama 3.3 70B (Groq)',
    fn: (m) => openaiCall('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_KEY, 'llama-3.3-70b-versatile', m)
  },
  {
    id: 'groq-kimi',
    label: 'Kimi K2 (Groq)',
    fn: (m) => openaiCall('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_KEY, 'moonshotai/kimi-k2-instruct', m)
  },
  {
    id: 'groq-gpt',
    label: 'GPT-OSS 120B (Groq)',
    fn: (m) => openaiCall('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_KEY, 'meta-llama/llama-4-scout-17b-16e-instruct', m)
  },
  {
    id: 'gemini-flash',
    label: 'Gemini Flash (Google)',
    fn: (m) => geminiCall(m)
  },
  {
    id: 'cerebras-qwen',
    label: 'Qwen 3 235B (Cerebras)',
    fn: (m) => openaiCall('https://api.cerebras.ai/v1/chat/completions', process.env.CEREBRAS_KEY, 'qwen-3-235b', m)
  },
  {
    id: 'cerebras-llama',
    label: 'Llama 3.1 (Cerebras)',
    fn: (m) => openaiCall('https://api.cerebras.ai/v1/chat/completions', process.env.CEREBRAS_KEY, 'llama3.1-8b', m)
  },
  {
    id: 'openrouter-deepseek',
    label: 'DeepSeek (OpenRouter)',
    fn: (m) => openaiCall('https://openrouter.ai/api/v1/chat/completions', process.env.OPENROUTER_KEY, 'deepseek/deepseek-chat-v3-0324:free', m)
  },
  {
    id: 'openrouter-qwen',
    label: 'Qwen3 (OpenRouter)',
    fn: (m) => openaiCall('https://openrouter.ai/api/v1/chat/completions', process.env.OPENROUTER_KEY, 'qwen/qwen3-235b-a22b:free', m)
  },
  {
    id: 'nvidia-llama',
    label: 'Llama 3.3 70B (NVIDIA)',
    fn: (m) => openaiCall('https://integrate.api.nvidia.com/v1/chat/completions', process.env.NVIDIA_KEY, 'meta/llama-3.3-70b-instruct', m)
  },
  {
    id: 'mistral-small',
    label: 'Mistral Small (Mistral)',
    fn: (m) => openaiCall('https://api.mistral.ai/v1/chat/completions', process.env.MISTRAL_KEY, 'mistral-small-latest', m)
  },
  {
    id: 'cloudflare-llama',
    label: 'Llama 3.1 (Cloudflare)',
    fn: (m) => cloudflareCall(m)
  },
  {
    id: 'github-gpt4o',
    label: 'GPT-4o (GitHub Models)',
    fn: (m) => openaiCall('https://models.inference.ai.azure.com/chat/completions', process.env.GITHUB_KEY, 'gpt-4o', m)
  }
]
export async function generate(selectedId, history, prompt) {
  const messages = [
    { role: 'system', content: SYSTEM },
    ...history,
    { role: 'user', content: prompt }
  ]
  const startIndex = providers.findIndex(p => p.id === selectedId)
  const order = [
    ...providers.slice(startIndex),
    ...providers.slice(0, startIndex)
  ]
  for (const provider of order) {
    try {
      const result = await provider.fn(messages)
      return { html: result, usedProvider: provider.label }
    } catch {
      continue
    }
  }

  throw new Error('All providers failed')
}
export const modelList = providers.map(p => ({ id: p.id, label: p.label }))
