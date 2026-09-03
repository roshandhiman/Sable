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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`[${model}] ${res.status}:`, err?.error?.message || '')
    throw new Error(`${res.status}`)
  }
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`[gemini] ${res.status}:`, JSON.stringify(err))
    throw new Error(`${res.status}`)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

const providers = [
  {
    id: 'groq-gpt120b',
    label: 'GPT-OSS 120B (Groq)',
    fn: (m) => openaiCall('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_KEY, 'openai/gpt-oss-120b', m)
  },
  {
    id: 'groq-gpt20b',
    label: 'GPT-OSS 20B (Groq)',
    fn: (m) => openaiCall('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_KEY, 'openai/gpt-oss-20b', m)
  },
  {
    id: 'groq-qwen',
    label: 'Qwen 3 27B (Groq)',
    fn: (m) => openaiCall('https://api.groq.com/openai/v1/chat/completions', process.env.GROQ_KEY, 'qwen/qwen3.8-27b', m)
  },
  {
    id: 'mistral-small',
    label: 'Mistral Small (Mistral)',
    fn: (m) => openaiCall('https://api.mistral.ai/v1/chat/completions', process.env.MISTRAL_KEY, 'mistral-small-latest', m)
  },
  {
    id: 'mistral-large',
    label: 'Mistral Large (Mistral)',
    fn: (m) => openaiCall('https://api.mistral.ai/v1/chat/completions', process.env.MISTRAL_KEY, 'mistral-large-latest', m)
  },
  {
    id: 'gemini-flash',
    label: 'Gemini Flash (Google)',
    fn: (m) => geminiCall(m)
  },
  {
    id: 'openrouter-deepseek',
    label: 'DeepSeek V3 (OpenRouter)',
    fn: (m) => openaiCall('https://openrouter.ai/api/v1/chat/completions', process.env.OPENROUTER_KEY, 'deepseek/deepseek-chat-v3-0324', m)
  },
  {
    id: 'nvidia-llama',
    label: 'Llama 3.3 70B (NVIDIA)',
    fn: (m) => openaiCall('https://integrate.api.nvidia.com/v1/chat/completions', process.env.NVIDIA_KEY, 'meta/llama-3.3-70b-instruct', m)
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
    ...providers.slice(startIndex === -1 ? 0 : startIndex),
    ...providers.slice(0, startIndex === -1 ? 0 : startIndex)
  ]

  for (const provider of order) {
    console.log(`Trying: ${provider.label}`)
    try {
      const html = await provider.fn(messages)
      console.log(`Success: ${provider.label}`)
      return { html, usedProvider: provider.label }
    } catch (e) {
      console.log(`Failed: ${provider.label} — ${e.message}`)
      continue
    }
  }

  throw new Error('All providers failed')
}

export const modelList = providers.map(p => ({ id: p.id, label: p.label }))
