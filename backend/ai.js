import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const SYSTEM = `You are an elite Staff UI/UX Designer and Frontend Engineer (Linear, Apple, Vercel, Stripe). You possess maxed-out UI/UX design skills. You NEVER output generic AI-slop, NEVER use tacky neon gradients, and NEVER output broken images.

OUTPUT FORMAT:
Return ONLY a single complete, self-contained HTML file with all CSS inside <style> and all JavaScript inside <script>.
Start directly with <!DOCTYPE html>. No markdown code blocks, no explanations, no text outside the HTML.

DESIGN PHILOSOPHY & RULES:
1. ART DIRECTION — DISTINCTIVE, BRIEF-LED DESIGN:
   - Treat each prompt as a real creative brief. Identify the audience, product, mood, and primary action, then design specifically for them. Do not force every website into the same template.
   - Honor an explicitly requested style first, including neo-brutalism, editorial, Swiss, Y2K, luxury, playful, minimal, or dark tech. When no style is specified, use a polished contemporary editorial direction with confident typography, purposeful asymmetry, tactile details, and one memorable visual idea.
   - Make neo-brutalism intentional when it fits: strong ink-like borders, hard offset shadows, oversized type, visible grid structure, punchy but controlled color, and tactile hover states. Avoid piling every brutalist trope into one page.
   - Build a coherent palette for the brand and subject. Use a dominant background, strong text contrast, one primary accent, and at most one supporting accent. Acid lime, cobalt, vermilion, or warm paper are options, not defaults. Never use generic purple-blue AI gradients, gratuitous glow, glass cards, or neon decoration.
   - Use real visual hierarchy and deliberate whitespace. Vary section composition, scale, alignment, and rhythm. Use grids, editorial columns, oversized numerals, image crops, graphic shapes, or restrained texture only when they strengthen the idea.
   - Every section should have a clear purpose and visual variation. Avoid repeated rounded-card grids, identical feature tiles, generic dashboards, stock SaaS copy, filler sections, and decorative elements with no role.

2. TYPOGRAPHY AND DETAIL:
   - Choose typography that fits the brief. Load suitable Google Fonts in <head> when appropriate, with sensible system fallbacks. Do not force the same font pair onto every brand.
   - Use a clearly differentiated display face and readable body face. Make the headline memorable through scale, line breaks, weight, or composition rather than excessive effects.
   - Keep body copy readable with comfortable line-height and measure. Use small uppercase labels sparingly for metadata, not as the default for all text.
   - Make buttons, navigation, inputs, focus states, hover states, dividers, borders, and shadows feel like one deliberate design system. Avoid default pill buttons unless they suit the brand.

3. NEVER OUTPUT BROKEN IMAGES (ZERO TOLERANCE):
   - NEVER use placeholder text in <img> src.
   - NEVER output <img src=""> or <img alt="something"> without a working URL.
   - If using images, ONLY use valid, verified Unsplash direct URLs with real query params:
     * Gym / Fitness: https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80
     * Coffee / Cafe: https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80
     * Tech / SaaS: https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80
     * Architecture / Modern: https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80
     * Food / Restaurant: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80
   - When in doubt, prefer beautiful inline SVG icons, Bento metric stat cards, and interactive UI widgets instead of images.

4. PAGE STRUCTURE AND FUNCTION:
   - Choose page sections based on the actual request and product. Do not add pricing, testimonials, metrics, feature grids, badges, or a multi-column footer unless they make sense for that brief.
   - Make the first viewport immediately communicate what the site is, who it serves, and what to do next. Use a distinct, high-impact hero composition, not a mandatory badge-plus-headline-plus-two-buttons formula.
   - Give each page a logical reading flow, intentional section transitions, and a clear primary action. Make the navigation useful for the sections that actually exist.
   - Include functional interactions when the concept calls for them: working navigation, forms with clear validation/feedback, tabs, filters, accordions, calculators, or toggles. Do not add fake controls or interactions just to satisfy a checklist. Use vanilla JavaScript and ensure interactions work without external frameworks.
   - Use truthful, prompt-provided content. Never invent customer counts, ratings, testimonials, certifications, addresses, or performance claims. When the user has not supplied specifics, use concise non-factual copy rather than fabricated proof.
   - Use suitable, working image URLs only when imagery improves the result. Prefer the verified Unsplash URLs below or create visual interest with CSS and inline SVG. Always set useful alt text and sensible image sizing.

5. RESPONSIVE, ACCESSIBLE, PRODUCTION-QUALITY HTML:
   - Include a small CSS reset, semantic landmarks, a useful page title, viewport metadata, and a responsive layout that works from narrow mobile screens through wide desktop.
   - Use fluid type and spacing with clamp() where useful. Prevent horizontal overflow. Reflow navigation, grids, and hero composition cleanly on mobile.
   - Maintain strong text contrast, visible keyboard focus, descriptive accessible labels, correct button/link semantics, and reduced-motion support for animations.
   - Keep the output self-contained: inline CSS and vanilla JavaScript only. No React, build steps, external component libraries, fake controls, or dependencies beyond suitable font/image URLs.
   - Ensure every visible link and control has a sensible, working action. Validate forms client-side and provide visible success/error feedback where relevant.

6. STRICT NO-COMMENT RULE (MANDATORY):
   - NEVER write comments in the code.
   - NO HTML comments (<!-- ... -->).
   - NO CSS comments (/* ... */).
   - NO JavaScript comments (// or /* ... */).
   - Output 100% pure, clean code with zero comments.

7. IN-PAGE ANCHOR LINKS (MANDATORY):
   - All navigation links in the navbar, header, and buttons MUST use in-page hash anchors (e.g., href="#features", href="#pricing", href="#contact").
   - NEVER use relative routes like href="/" or href="/features" or empty hrefs.`

function cleanHtml(raw) {
  if (!raw) return ''
  let cleaned = raw.trim()
  if (cleaned.startsWith('```html')) {
    cleaned = cleaned.replace(/^```html\s*/i, '').replace(/\s*```$/, '')
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '')
  }
  cleaned = cleaned
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[ \t])\/\/[^\r\n]*/gm, '$1')
  return cleaned.trim()
}

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
    console.error(`[${model}] ${res.status}:`, err?.error?.message || err?.message || '')
    throw new Error(`${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

async function* sseDeltas(res, extract) {
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const lines = buf.split(/\r?\n/)
    buf = lines.pop()
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith('data:')) continue
      const payload = t.slice(5).trim()
      if (!payload || payload === '[DONE]') continue
      let json
      try { json = JSON.parse(payload) } catch { continue }
      const text = extract(json)
      if (text) yield text
    }
  }
}

async function* openaiStream(url, key, model, messages, signal) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, max_tokens: 8192, stream: true }),
    signal
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error(`[${model} stream] ${res.status}:`, err?.error?.message || err?.message || '')
    throw new Error(`${res.status}`)
  }
  yield* sseDeltas(res, j => j?.choices?.[0]?.delta?.content || j?.choices?.[0]?.text || '')
}

async function geminiCall(messages) {
  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n')
  const models = ['gemini-2.5-flash', 'gemini-3.6-flash']

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error(`[gemini] ${model} ${res.status}:`, JSON.stringify(err))
        continue
      }
      const data = await res.json()
      const output = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (output) return output
    } catch (e) {
      console.error(`[gemini] ${model} error:`, e.message)
    }
  }

  throw new Error('Gemini generation failed')
}

async function* geminiStream(messages, signal) {
  const text = messages.map(m => `${m.role}: ${m.content}`).join('\n')
  const models = ['gemini-2.5-flash', 'gemini-3.6-flash']
  let emitted = false

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] }),
          signal
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error(`[gemini stream] ${model} ${res.status}:`, JSON.stringify(err))
        continue
      }
      for await (const delta of sseDeltas(res, j => j?.candidates?.[0]?.content?.parts?.[0]?.text || '')) {
        emitted = true
        yield delta
      }
      if (emitted) return
    } catch (e) {
      if (e.name === 'AbortError') throw e
      console.error(`[gemini stream] ${model} error:`, e.message)
    }
  }

  if (!emitted) throw new Error('Gemini generation failed')
}
const legacyAliasMap = {
  'nvidia-llama': 'openrouter-llama',
  'mistral-small': 'mistral-codestral',
  'mistral-large': 'mistral-7b'
}

const openaiProvider = (id, label, url, keyEnv, model) => ({
  id,
  label,
  fn: (m) => openaiCall(url, process.env[keyEnv], model, m),
  stream: (m, s) => openaiStream(url, process.env[keyEnv], model, m, s)
})

const providers = [
  openaiProvider('groq-gpt120b', 'GPT-OSS 120B (Groq)', 'https://api.groq.com/openai/v1/chat/completions', 'GROQ_KEY', 'openai/gpt-oss-120b'),
  openaiProvider('groq-gpt20b', 'GPT-OSS 20B (Groq)', 'https://api.groq.com/openai/v1/chat/completions', 'GROQ_KEY', 'openai/gpt-oss-20b'),
  openaiProvider('groq-qwen', 'Qwen 3 27B (Groq)', 'https://api.groq.com/openai/v1/chat/completions', 'GROQ_KEY', 'qwen/qwen3.8-27b'),
  openaiProvider('mistral-codestral', 'Codestral (Mistral)', 'https://api.mistral.ai/v1/chat/completions', 'MISTRAL_KEY', 'codestral-latest'),
  openaiProvider('mistral-7b', 'Mistral 7B (Mistral)', 'https://api.mistral.ai/v1/chat/completions', 'MISTRAL_KEY', 'open-mistral-7b'),
  {
    id: 'gemini-flash',
    label: 'Gemini Flash (Google)',
    fn: (m) => geminiCall(m),
    stream: (m, s) => geminiStream(m, s)
  },
  openaiProvider('openrouter-deepseek', 'DeepSeek V3 (OpenRouter)', 'https://openrouter.ai/api/v1/chat/completions', 'OPENROUTER_KEY', 'deepseek/deepseek-chat-v3-0324'),
  openaiProvider('openrouter-llama', 'Llama 3.3 70B (OpenRouter)', 'https://openrouter.ai/api/v1/chat/completions', 'OPENROUTER_KEY', 'meta-llama/llama-3.3-70b-instruct')
]

function buildMessages(history, prompt) {
  return [
    { role: 'system', content: SYSTEM },
    ...(history || []),
    { role: 'user', content: prompt }
  ]
}

function providerOrder(selectedId) {
  const targetId = legacyAliasMap[selectedId] || selectedId
  const startIndex = providers.findIndex(p => p.id === targetId)
  const start = startIndex === -1 ? 0 : startIndex
  return [...providers.slice(start), ...providers.slice(0, start)]
}

export async function generate(selectedId, history, prompt) {
  const messages = buildMessages(history, prompt)
  const order = providerOrder(selectedId)

  for (const provider of order) {
    console.log(`Trying: ${provider.label}`)
    try {
      const rawHtml = await provider.fn(messages)
      const html = cleanHtml(rawHtml)
      console.log(`Success: ${provider.label}`)
      return { html, usedProvider: provider.label }
    } catch (e) {
      console.log(`Failed: ${provider.label} — ${e.message}`)
      continue
    }
  }

  throw new Error('All providers failed')
}

export async function* generateStream(selectedId, history, prompt, signal) {
  const messages = buildMessages(history, prompt)
  const order = providerOrder(selectedId)
  let started = false

  for (const provider of order) {
    if (!provider.stream) continue
    let iterator
    try {
      iterator = provider.stream(messages, signal)
      const first = await iterator.next()
      if (first.done || !first.value) {
        await iterator.return?.()?.catch?.(() => {})
        continue
      }
      started = true
      console.log(`Streaming from: ${provider.label}`)
      yield { type: 'meta', provider: provider.label }
      yield { type: 'delta', text: first.value }
      for await (const chunk of iterator) {
        if (chunk) yield { type: 'delta', text: chunk }
      }
      yield { type: 'done', provider: provider.label }
      return
    } catch (e) {
      if (e.name === 'AbortError') throw e
      if (started) {
        yield { type: 'error', message: e.message }
        return
      }
      console.log(`Stream failed: ${provider.label} — ${e.message}`)
      continue
    }
  }

  throw new Error('All providers failed')
}

export const modelList = providers.map(p => ({ id: p.id, label: p.label }))
