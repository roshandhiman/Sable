<div align="center">

# SABLE

**Type it. Sable builds it. Live in seconds.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=flat-square&logo=vercel)](https://sable-ai.vercel.app)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

</div>

---

SABLE is an AI-powered landing page generator. Describe what you want — SABLE writes the full HTML, CSS, and JS and renders it live in your browser. No sign-up. No setup.

## Features

- **8 AI Models** — Groq, Mistral, Gemini, DeepSeek, NVIDIA Llama with automatic fallback
- **Live Preview** — Generated page renders instantly in a split-screen iframe
- **Typewriter Effect** — Watch the code write itself in real time
- **Interactive Background** — Mouse-reactive constellation dot grid
- **Dark / Light Mode** — System-aware with manual toggle

## Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| AI Providers | Groq · Mistral · Gemini · OpenRouter · NVIDIA |
| Deployment | Vercel |

## Run Locally

```bash
# Clone
git clone https://github.com/roshandhiman/Sable.git
cd Sable

# Frontend
npm install
npm run dev

# Backend
cd backend
npm install
# Add your API keys to .env (see .env.example)
node server.js
```

**Required `.env` keys:**
```
GROQ_KEY=
MISTRAL_KEY=
GEMINI_KEY=
OPENROUTER_KEY=
NVIDIA_KEY=
```

## How it Works

```
User types prompt → selects model → hits Send
  → POST /api/generate
  → Express tries selected AI provider
  → If it fails → auto-falls back to next
  → Returns complete HTML file
  → Rendered live in browser
```

---

<div align="center">
  Built by <a href="https://github.com/roshandhiman">Roshanpreet Singh Dhiman</a> · Chitkara University
</div>
