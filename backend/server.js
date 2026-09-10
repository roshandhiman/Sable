import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { generate, modelList } from './ai.js'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/models', (req, res) => {
  res.json(modelList)
})
//local ke liye tha 
// app.post('/generate', async (req, res) => {
//   const { model, history, prompt } = req.body
//   try {
//     const result = await generate(model, history || [], prompt)
//     res.json(result)
//   } catch (err) {
//     res.status(500).json({ error: err.message })
//   }
// })
app.post('/api/generate', async (req, res) => {
  const { model, history, prompt } = req.body
  try {
    const result = await generate(model, history || [], prompt)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.listen(process.env.PORT || 3001, () => {
  console.log(`Backend running on port ${process.env.PORT || 3001}`)
})
