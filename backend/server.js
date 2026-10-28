import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
dotenv.config({ path: path.join(__dirname, '../.env') })

import express from 'express'
import cors from 'cors'
import { generate, generateStream, modelList } from './ai.js'
import { githubLogin, githubCallback, githubUser, githubRepos, githubPush } from './github.js'
import { getPublishedWork, publishWork } from './publish.js'

const app = express()
app.use(cors())
app.use(express.json())

const handleModels = (req, res) => {
  res.json(modelList)
}

const handleGenerate = async (req, res) => {
  const { model, history, prompt } = req.body
  try {
    const result = await generate(model, history || [], prompt)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

const handleGenerateStream = async (req, res) => {
  const { model, history, prompt } = req.body
  const controller = new AbortController()
  res.on('close', () => controller.abort())

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  })

  const send = (payload) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  try {
    for await (const event of generateStream(model, history || [], prompt, controller.signal)) {
      send(event)
    }
  } catch (err) {
    if (err.name !== 'AbortError') send({ type: 'error', message: err.message })
  } finally {
    if (!res.writableEnded) {
      res.write('data: [DONE]\n\n')
      res.end()
    }
  }
}

app.get('/models', handleModels)
app.get('/api/models', handleModels)

app.post('/generate', handleGenerate)
app.post('/api/generate', handleGenerate)

app.post('/generate/stream', handleGenerateStream)
app.post('/api/generate/stream', handleGenerateStream)

app.post('/publish', publishWork)
app.post('/api/publish', publishWork)
app.get('/published/:slug', getPublishedWork)
app.get('/api/published/:slug', getPublishedWork)

app.get('/github/login', githubLogin)
app.get('/api/github/login', githubLogin)
app.get('/github/callback', githubCallback)
app.get('/api/github/callback', githubCallback)
app.get('/github/user', githubUser)
app.get('/api/github/user', githubUser)
app.get('/github/repos', githubRepos)
app.get('/api/github/repos', githubRepos)
app.post('/github/push', githubPush)
app.post('/api/github/push', githubPush)

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`Backend running on port ${port}`)
})
