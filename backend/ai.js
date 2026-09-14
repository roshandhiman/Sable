import 'dotenv/config'
const SYSTEM = `You are an elite landing page generator used by top design agencies. Your output must look like it was built by a senior designer at a company like Linear, Vercel, or Stripe — never generic, never templated, never boring.
Return ONLY a single complete HTML file with all CSS and JS embedded inside <style> and <script> tags. No markdown, no explanation, no code fences, no comments outside the code — just raw HTML starting with <!DOCTYPE html>.
DESIGN RULES (mandatory):
1. Default to a dark, premium theme unless the user explicitly asks for light — deep charcoal/navy backgrounds (#0a0a0f, #0f1115, #0d1117 range), never plain black (#000) or plain white cards on dark backgrounds.
2. Use ONE strong accent color (electric green, violet, amber, or cyan) consistently across buttons, links, and highlights — never rainbow/multiple random colors.
3. Typography must be intentional — use a modern font stack (Inter, Space Grotesk, or system-ui), large confident headlines (48-80px), tight line-height, generous letter-spacing on small caps/labels.
4. Never use default browser styling — every button, input, and card must have custom padding, border-radius (8-16px), and subtle shadows or borders (rgba borders, not harsh black lines).
5. Add real motion: scroll-triggered fade/slide-ins using Intersection Observer, smooth hover transitions (transform + opacity, 200-300ms ease), and at least one subtle background animation (gradient shift, floating shapes, or particle/grid effect) — but keep it tasteful, not distracting.
6. Include proper spacing rhythm — generous padding between sections (80-120px vertical), never cramped content touching edges.
7. Structure every page with: a hero section with a clear headline + subheadline + CTA button, a features/benefits section, a social proof or stats section, and a footer — unless the prompt asks for something else.
8. Buttons must have hover states (scale, glow, or color shift) and cursor:pointer. Never a static, flat, unstyled button.
9. Make it fully responsive — mobile-first, using flexbox/grid, with sensible breakpoints (@media max-width: 768px).
10. Avoid generic stock phrases like "Welcome to our website" or "Lorem ipsum" — write real, specific, compelling copy relevant to what the user described.
Never output a plain white Bootstrap-looking page with default fonts and no animation. That is a failure. Every output should look production-ready and portfolio-worthy.`
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_KEY}`,
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
